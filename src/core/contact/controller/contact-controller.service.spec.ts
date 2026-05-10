import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";

import { ContactControllerService } from "./contact-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";

describe("ContactControllerService", () => {
    let service: ContactControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("accessToken", "tok");
        http = jasmine.createSpyObj<AxiosInstance>(
            "AxiosInstance",
            ["get", "post", "put", "delete"],
            {
                interceptors: { response: { use: () => 0 } } as never,
                defaults: { headers: {} },
            } as never,
        );
        http.post.and.resolveTo({ data: undefined });
        http.put.and.resolveTo({ data: undefined });
        http.delete.and.resolveTo({ data: undefined });
        spyOn(axios, "create").and.returnValue(http);

        TestBed.configureTestingModule({
            providers: [
                ContactControllerService,
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
        service = TestBed.inject(ContactControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("create POSTs at root", async () => {
        const payload = { name: "Alice" };
        await service.create(payload as never);
        expect(http.post).toHaveBeenCalledWith("", payload);
    });

    it("update PUTs at root", async () => {
        const payload = { id: "c1", name: "Alice" };
        await service.update(payload as never);
        expect(http.put).toHaveBeenCalledWith("", payload);
    });

    it("delete sends DELETE with body { id }", async () => {
        await service.delete("c9");
        expect(http.delete).toHaveBeenCalledWith("", { data: { id: "c9" } });
    });
});
