import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";

import { WorkspaceControllerService } from "./workspace-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../store/workspace-context.service";

describe("WorkspaceControllerService", () => {
    let service: WorkspaceControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("accessToken", "tok");
        http = jasmine.createSpyObj<AxiosInstance>(
            "AxiosInstance",
            ["get", "post", "put", "patch", "delete"],
            {
                interceptors: { response: { use: () => 0 } } as never,
                defaults: { headers: {} },
            } as never,
        );
        http.get.and.resolveTo({ data: [] });
        http.post.and.resolveTo({ data: { id: "ws-1", name: "x", slug: "x" } });
        http.patch.and.resolveTo({ data: { id: "ws-1", name: "x", slug: "x" } });
        http.delete.and.resolveTo({ data: undefined });
        spyOn(axios, "create").and.returnValue(http);

        TestBed.configureTestingModule({
            providers: [
                WorkspaceControllerService,
                { provide: AuthService, useValue: { token: new Subject<string>() } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged: new Subject() },
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: jasmine.createSpy("navigate"),
                        events: new Subject(),
                        url: "/",
                    },
                },
            ],
        });
        service = TestBed.inject(WorkspaceControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("get GETs root with default pagination of 15", async () => {
        await service.get();
        expect(http.get).toHaveBeenCalledWith(
            "",
            jasmine.objectContaining({
                params: jasmine.objectContaining({ limit: 15, offset: 0 }),
            }),
        );
    });

    it("get accepts custom pagination/order", async () => {
        await service.get({ limit: 5, offset: 10 }, { created_at: "asc" as never });
        const params = (http.get.calls.mostRecent().args[1] as { params: Record<string, unknown> })
            .params;
        expect(params).toEqual(
            jasmine.objectContaining({ limit: 5, offset: 10, created_at: "asc" }),
        );
    });

    it("create POSTs at root with name/slug/description", async () => {
        await service.create({ name: "Acme", slug: "acme", description: "d" });
        expect(http.post).toHaveBeenCalledWith("", {
            name: "Acme",
            slug: "acme",
            description: "d",
        });
    });

    it("update PATCHes at /:id with the partial payload", async () => {
        await service.update("ws-1", { name: "renamed" });
        expect(http.patch).toHaveBeenCalledWith("ws-1", { name: "renamed" });
    });

    it("delete DELETEs at /:id", async () => {
        await service.delete("ws-1");
        expect(http.delete).toHaveBeenCalledWith("ws-1");
    });
});
