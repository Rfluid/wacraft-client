import { TestBed } from "@angular/core/testing";
import { NGXLogger } from "ngx-logger";
import { Subject } from "rxjs";

import { WorkspaceInvitation, WorkspaceMemberStoreService } from "./workspace-member-store.service";
import { WorkspaceMemberControllerService } from "../controller/workspace-member-controller.service";
import { WorkspaceStoreService } from "./workspace-store.service";
import { WorkspaceMember } from "../entity/workspace-member.entity";
import { Workspace } from "../entity/workspace.entity";
import { MockLogger, defer, drain } from "../../../testing";

function member(id: string): WorkspaceMember {
    return {
        id,
        workspace_id: "ws1",
        user_id: `u-${id}`,
        created_at: new Date(),
        updated_at: new Date(),
    };
}

function invitation(id: string, email = `${id}@x`): WorkspaceInvitation {
    return {
        id,
        email,
        token: `t-${id}`,
        policies: [],
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
    };
}

describe("WorkspaceMemberStoreService", () => {
    let store: WorkspaceMemberStoreService;
    let memberCtl: jasmine.SpyObj<WorkspaceMemberControllerService>;
    let workspaceStore: { currentWorkspace: Workspace | null; workspaceChanged: Subject<unknown> };

    beforeEach(() => {
        memberCtl = jasmine.createSpyObj<WorkspaceMemberControllerService>(
            "WorkspaceMemberControllerService",
            ["getMembers", "getInvitations"],
        );
        memberCtl.getMembers.and.resolveTo([]);
        memberCtl.getInvitations.and.resolveTo([] as never);

        workspaceStore = {
            currentWorkspace: { id: "ws1" } as Workspace,
            workspaceChanged: new Subject(),
        };

        TestBed.configureTestingModule({
            providers: [
                WorkspaceMemberStoreService,
                { provide: WorkspaceMemberControllerService, useValue: memberCtl },
                { provide: WorkspaceStoreService, useValue: workspaceStore },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(WorkspaceMemberStoreService);
    });

    describe("members domain", () => {
        it("get() bails early when no current workspace", async () => {
            workspaceStore.currentWorkspace = null;
            await store.get();
            expect(memberCtl.getMembers).not.toHaveBeenCalled();
        });

        it("get() appends and offsets by current length", async () => {
            memberCtl.getMembers.and.callFake(async (_id, paginate) => {
                if (paginate?.offset === 0) return [member("m1"), member("m2")];
                return [member("m3")];
            });

            await store.get();
            await store.get();
            expect(store.members.map(m => m.id)).toEqual(["m1", "m2", "m3"]);
            expect(memberCtl.getMembers.calls.allArgs().map(a => a[1]?.offset)).toEqual([0, 2]);
        });

        it("get() sets reachedMaxLimit when result is shorter than the page size", async () => {
            // paginationLimit is 15; one item is shorter, so we've reached the end.
            memberCtl.getMembers.and.resolveTo([member("m1")]);
            await store.get();
            expect(store.reachedMaxLimit).toBe(true);
            expect(store.members.length).toBe(1);
        });

        it("get() toggles loading flag inside the lock", async () => {
            const gate = defer<WorkspaceMember[]>();
            memberCtl.getMembers.and.returnValue(gate.promise);

            const fetching = store.get();
            await drain();
            expect(store.loading).toBe(true);

            gate.resolve([member("m1")]);
            await fetching;
            expect(store.loading).toBe(false);
        });

        it("get() restores loading flag and rethrows on error", async () => {
            memberCtl.getMembers.and.rejectWith(new Error("net"));
            await expectAsync(store.get()).toBeRejected();
            expect(store.loading).toBe(false);
        });

        it("members and invitations locks are independent", async () => {
            // Hold members lock with a slow get(); a concurrent invitations refresh must proceed.
            const memberGate = defer<WorkspaceMember[]>();
            memberCtl.getMembers.and.returnValue(memberGate.promise);
            memberCtl.getInvitations.and.resolveTo([invitation("i1")] as never);

            const memberFetch = store.get();
            const invitationFetch = store.getInvitations();
            await drain();

            // Members lock is held but invitations completed.
            expect(store.invitations.map(i => i.id)).toEqual(["i1"]);
            expect(store.members).toEqual([]);

            memberGate.resolve([member("m1")]);
            await Promise.all([memberFetch, invitationFetch]);
            expect(store.members.map(m => m.id)).toEqual(["m1"]);
        });

        it("prependMember dedupes and places at front", async () => {
            store.members = [member("m1"), member("m2")];
            await store.prependMember(member("m2"));
            expect(store.members.map(m => m.id)).toEqual(["m2", "m1"]);
        });

        it("syncMember replaces in-place", async () => {
            const original = member("m1");
            const updated: WorkspaceMember = { ...original, user_id: "u-NEW" };
            store.members = [original];
            await store.syncMember(updated);
            expect(store.members[0].user_id).toBe("u-NEW");
            expect(store.membersById.get("m1")?.user_id).toBe("u-NEW");
        });

        it("removeMember drops from list and Map", async () => {
            store.members = [member("m1"), member("m2")];
            store.membersById.set("m1", member("m1"));
            store.membersById.set("m2", member("m2"));
            await store.removeMember("m1");
            expect(store.members.map(m => m.id)).toEqual(["m2"]);
            expect(store.membersById.has("m1")).toBe(false);
        });
    });

    describe("invitations domain", () => {
        it("getInvitations() bails early when no current workspace", async () => {
            workspaceStore.currentWorkspace = null;
            await store.getInvitations();
            expect(memberCtl.getInvitations).not.toHaveBeenCalled();
        });

        it("getInvitations() appends and offsets by current length", async () => {
            memberCtl.getInvitations.and.callFake((async (
                _id: string,
                paginate: { offset: number; limit: number },
            ) => {
                if (paginate?.offset === 0) return [invitation("i1"), invitation("i2")];
                return [invitation("i3")];
            }) as never);

            await store.getInvitations();
            await store.getInvitations();
            expect(store.invitations.map(i => i.id)).toEqual(["i1", "i2", "i3"]);
        });

        it("getInvitations() sets reachedMaxInvitationLimit on short page", async () => {
            memberCtl.getInvitations.and.resolveTo([invitation("i1")] as never);
            await store.getInvitations();
            expect(store.reachedMaxInvitationLimit).toBe(true);
        });

        it("refetchInvitations() clears state and fetches from offset 0", async () => {
            store.invitations = [invitation("stale")];
            store.invitationsById.set("stale", invitation("stale"));
            store.reachedMaxInvitationLimit = true;

            memberCtl.getInvitations.and.resolveTo([invitation("i1")] as never);
            await store.refetchInvitations();

            expect(store.invitations.map(i => i.id)).toEqual(["i1"]);
            expect(store.invitationsById.has("stale")).toBe(false);
            expect(memberCtl.getInvitations.calls.mostRecent().args[1]?.offset).toBe(0);
        });

        it("removeInvitation drops from list and Map", async () => {
            store.invitations = [invitation("i1"), invitation("i2")];
            store.invitationsById.set("i1", invitation("i1"));
            await store.removeInvitation("i1");
            expect(store.invitations.map(i => i.id)).toEqual(["i2"]);
            expect(store.invitationsById.has("i1")).toBe(false);
        });

        it("getInvitations() restores invitationLoading on error", async () => {
            memberCtl.getInvitations.and.rejectWith(new Error("net"));
            await expectAsync(store.getInvitations()).toBeRejected();
            expect(store.invitationLoading).toBe(false);
        });

        it("refetchInvitations() restores invitationLoading on error", async () => {
            memberCtl.getInvitations.and.rejectWith(new Error("net"));
            await expectAsync(store.refetchInvitations()).toBeRejected();
            expect(store.invitationLoading).toBe(false);
        });
    });

    describe("workspace change", () => {
        it("clears both members and invitations state on workspaceChanged", () => {
            store.members = [member("m1")];
            store.membersById.set("m1", member("m1"));
            store.reachedMaxLimit = true;
            store.invitations = [invitation("i1")];
            store.invitationsById.set("i1", invitation("i1"));
            store.reachedMaxInvitationLimit = true;

            workspaceStore.workspaceChanged.next({});

            expect(store.members).toEqual([]);
            expect(store.membersById.size).toBe(0);
            expect(store.reachedMaxLimit).toBe(false);
            expect(store.invitations).toEqual([]);
            expect(store.invitationsById.size).toBe(0);
            expect(store.reachedMaxInvitationLimit).toBe(false);
        });
    });

    describe("getById", () => {
        it("returns from cache or undefined", async () => {
            store.membersById.set("m1", member("m1"));
            expect(await store.getById("m1")).toEqual(member("m1") as never);
            expect(await store.getById("missing")).toBeUndefined();
        });
    });
});
