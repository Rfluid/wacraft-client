import { TestBed } from "@angular/core/testing";

import { WorkspaceContextService } from "./workspace-context.service";

describe("WorkspaceContextService", () => {
    let service: WorkspaceContextService;

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("hydrates currentWorkspaceId from localStorage on construction", () => {
        localStorage.setItem("currentWorkspaceId", "ws-stored");
        TestBed.configureTestingModule({});
        service = TestBed.inject(WorkspaceContextService);
        expect(service.currentWorkspaceId).toBe("ws-stored");
    });

    it("starts with null when no value is stored", () => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WorkspaceContextService);
        expect(service.currentWorkspaceId).toBeNull();
    });

    it("setWorkspaceId persists, updates the field, and emits on workspaceChanged", () => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WorkspaceContextService);
        const seen: string[] = [];
        service.workspaceChanged.subscribe(v => seen.push(v));

        service.setWorkspaceId("ws-1");

        expect(service.currentWorkspaceId).toBe("ws-1");
        expect(localStorage.getItem("currentWorkspaceId")).toBe("ws-1");
        expect(seen).toEqual(["ws-1"]);
    });

    it("multiple setWorkspaceId calls fan out one emission per call", () => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WorkspaceContextService);
        const seen: string[] = [];
        service.workspaceChanged.subscribe(v => seen.push(v));

        service.setWorkspaceId("ws-1");
        service.setWorkspaceId("ws-2");
        service.setWorkspaceId("ws-1"); // re-emit even on same value

        expect(seen).toEqual(["ws-1", "ws-2", "ws-1"]);
    });
});
