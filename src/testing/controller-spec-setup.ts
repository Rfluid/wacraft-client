import axios, { AxiosInstance } from "axios";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { AuthService } from "../core/auth/service/auth.service";
import { WorkspaceContextService } from "../core/workspace/store/workspace-context.service";

// Sets up an axios spy + stub TestBed providers for a controller that
// extends MainServerControllerService. Returns the axios spy so tests
// can drive its methods.
export function setupControllerHttp(): jasmine.SpyObj<AxiosInstance> {
    localStorage.clear();
    localStorage.setItem("accessToken", "tok");
    const http = jasmine.createSpyObj<AxiosInstance>(
        "AxiosInstance",
        ["get", "post", "put", "patch", "delete"],
        {
            interceptors: { response: { use: () => 0 } } as never,
            defaults: { headers: {} },
        } as never,
    );
    http.get.and.resolveTo({ data: [] });
    http.post.and.resolveTo({ data: undefined });
    http.put.and.resolveTo({ data: undefined });
    http.patch.and.resolveTo({ data: undefined });
    http.delete.and.resolveTo({ data: undefined });
    spyOn(axios, "create").and.returnValue(http);

    TestBed.configureTestingModule({
        providers: [
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

    return http;
}
