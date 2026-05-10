import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { WorkspaceMemberControllerService } from "./workspace-member-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("WorkspaceMemberControllerService", () => {
    let service: WorkspaceMemberControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(WorkspaceMemberControllerService);
    });

    afterEach(() => localStorage.clear());

    const ws = "ws-1";

    it("getMembers GETs {ws}/member with default pagination", async () => {
        await service.getMembers(ws);
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe(`${ws}/member`);
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 10, offset: 0 }),
        );
    });

    it("addMember POSTs to {ws}/member", async () => {
        await service.addMember(ws, { user_id: "u-1", policies: [] });
        expect(http.post.calls.mostRecent().args[0]).toBe(`${ws}/member`);
    });

    it("updateMemberPolicies PATCHes the member-scoped path with { policies }", async () => {
        await service.updateMemberPolicies(ws, "m-1", []);
        const args = http.patch.calls.mostRecent().args;
        expect(args[0]).toBe(`${ws}/member/m-1`);
        expect(args[1]).toEqual({ policies: [] });
    });

    it("removeMember sends DELETE to {ws}/member/{id}", async () => {
        await service.removeMember(ws, "m-1");
        expect(http.delete.calls.mostRecent().args[0]).toBe(`${ws}/member/m-1`);
    });

    it("inviteMember POSTs to {ws}/invitation", async () => {
        await service.inviteMember(ws, { email: "x@y", policies: [] });
        expect(http.post.calls.mostRecent().args[0]).toBe(`${ws}/invitation`);
    });

    it("getInvitations GETs {ws}/invitation with default pagination", async () => {
        await service.getInvitations(ws);
        expect(http.get.calls.mostRecent().args[0]).toBe(`${ws}/invitation`);
    });

    it("revokeInvitation sends DELETE to {ws}/invitation/{id}", async () => {
        await service.revokeInvitation(ws, "inv-1");
        expect(http.delete.calls.mostRecent().args[0]).toBe(`${ws}/invitation/inv-1`);
    });
});
