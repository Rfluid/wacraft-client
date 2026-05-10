import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { Subject } from "rxjs";

import { WorkspaceMembersComponent } from "./workspace-members.component";
import { WorkspaceStoreService } from "../../core/workspace/store/workspace-store.service";
import { WorkspaceMemberStoreService } from "../../core/workspace/store/workspace-member-store.service";
import { WorkspaceMemberControllerService } from "../../core/workspace/controller/workspace-member-controller.service";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("WorkspaceMembersComponent — scroll across two scopes", () => {
    let component: WorkspaceMembersComponent;
    let memberStore: jasmine.SpyObj<WorkspaceMemberStoreService> & {
        loading: boolean;
        invitationLoading: boolean;
        reachedMaxLimit: boolean;
        reachedMaxInvitationLimit: boolean;
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj<WorkspaceMemberStoreService>(
            "WorkspaceMemberStoreService",
            ["get", "getInvitations"],
        );
        spy.get.and.resolveTo(undefined as never);
        spy.getInvitations.and.resolveTo(undefined as never);
        memberStore = Object.assign(spy, {
            loading: false,
            invitationLoading: false,
            reachedMaxLimit: false,
            reachedMaxInvitationLimit: false,
        });

        TestBed.configureTestingModule({
            providers: [
                { provide: WorkspaceMemberStoreService, useValue: memberStore },
                { provide: WorkspaceStoreService, useValue: {} as never },
                { provide: WorkspaceMemberControllerService, useValue: {} as never },
                {
                    provide: ActivatedRoute,
                    useValue: { fragment: new Subject<string>() },
                },
                {
                    provide: Router,
                    useValue: { navigate: jasmine.createSpy("navigate") },
                },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new WorkspaceMembersComponent(),
        );
    });

    it("does nothing far from bottom", () => {
        component.onScroll(scrollEv(farFromBottom()));
        expect(memberStore.get).not.toHaveBeenCalled();
        expect(memberStore.getInvitations).not.toHaveBeenCalled();
    });

    it("calls memberStore.get() in members scope", () => {
        component.memberScope = "members";
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.get).toHaveBeenCalled();
        expect(memberStore.getInvitations).not.toHaveBeenCalled();
    });

    it("calls memberStore.getInvitations() in invitations scope", () => {
        component.memberScope = "invitations";
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.getInvitations).toHaveBeenCalled();
        expect(memberStore.get).not.toHaveBeenCalled();
    });

    it("respects reachedMax for the active scope", () => {
        component.memberScope = "members";
        memberStore.reachedMaxLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.get).not.toHaveBeenCalled();

        component.memberScope = "invitations";
        memberStore.reachedMaxInvitationLimit = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.getInvitations).not.toHaveBeenCalled();
    });

    it("respects loading flag for the active scope", () => {
        component.memberScope = "members";
        memberStore.loading = true;
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.get).not.toHaveBeenCalled();
    });

    it("scrolling re-entrance guard blocks duplicates", async () => {
        let resolveFirst!: () => void;
        memberStore.get.and.returnValue(
            new Promise<void>(res => {
                resolveFirst = res;
            }),
        );
        component.memberScope = "members";
        component.onScroll(scrollEv(nearBottom()));
        component.onScroll(scrollEv(nearBottom()));
        expect(memberStore.get.calls.count()).toBe(1);
        resolveFirst();
        await Promise.resolve();
    });
});
