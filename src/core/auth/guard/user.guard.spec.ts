import { TestBed } from "@angular/core/testing";
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from "@angular/router";

import { userGuard } from "./user.guard";
import { AuthService } from "../service/auth.service";
import { UserStoreService } from "../../user/store/user-store.service";
import { WorkspaceStoreService } from "../../workspace/store/workspace-store.service";

describe("userGuard", () => {
    let auth: jasmine.SpyObj<AuthService>;
    let userStore: jasmine.SpyObj<UserStoreService>;
    let workspaceStore: jasmine.SpyObj<WorkspaceStoreService> & {
        currentWorkspace: unknown;
    };
    let router: { createUrlTree: jasmine.Spy };

    const executeGuard: CanActivateFn = (...args) =>
        TestBed.runInInjectionContext(() => userGuard(...args));

    function makeRouteState(url: string) {
        return [{} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot] as const;
    }

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(
            "AuthService",
            ["setToken", "checkAndRefreshToken", "getToken"],
            { loginTime: 0 },
        );
        auth.checkAndRefreshToken.and.resolveTo();
        auth.getToken.and.returnValue("tok");

        userStore = jasmine.createSpyObj<UserStoreService>("UserStoreService", ["getCurrent"]);
        userStore.getCurrent.and.resolveTo({} as never);

        const wsObj = jasmine.createSpyObj<WorkspaceStoreService>("WorkspaceStoreService", [
            "loadWorkspaces",
            "restoreWorkspace",
        ]);
        wsObj.loadWorkspaces.and.resolveTo();
        wsObj.restoreWorkspace.and.stub();
        workspaceStore = Object.assign(wsObj, { currentWorkspace: null });

        router = {
            createUrlTree: jasmine.createSpy("createUrlTree").and.returnValue({} as UrlTree),
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: auth },
                { provide: UserStoreService, useValue: userStore },
                { provide: WorkspaceStoreService, useValue: workspaceStore },
                { provide: Router, useValue: router },
            ],
        });
    });

    it("returns true when token is valid, user loads, and workspace restores", async () => {
        const result = await executeGuard(...makeRouteState("/home"));
        expect(result).toBe(true);
        expect(auth.checkAndRefreshToken).toHaveBeenCalled();
        expect(userStore.getCurrent).toHaveBeenCalled();
        expect(workspaceStore.loadWorkspaces).toHaveBeenCalled();
        expect(workspaceStore.restoreWorkspace).toHaveBeenCalled();
    });

    it("does not call restoreWorkspace when a workspace is already selected", async () => {
        workspaceStore.currentWorkspace = { id: "ws-1" } as never;
        await executeGuard(...makeRouteState("/home"));
        expect(workspaceStore.restoreWorkspace).not.toHaveBeenCalled();
    });

    it("redirects to /auth/login when no token after refresh", async () => {
        auth.getToken.and.returnValue("");
        const result = await executeGuard(...makeRouteState("/home"));
        expect(router.createUrlTree).toHaveBeenCalledWith(["/auth/login"]);
        expect(result).not.toBe(true);
    });

    it("redirects to /auth/login when getCurrent rejects", async () => {
        userStore.getCurrent.and.rejectWith(new Error("net"));
        const result = await executeGuard(...makeRouteState("/home"));
        expect(router.createUrlTree).toHaveBeenCalledWith(["/auth/login"]);
        expect(result).not.toBe(true);
    });

    it("redirects to /auth/login when checkAndRefreshToken throws", async () => {
        auth.checkAndRefreshToken.and.rejectWith(new Error("expired"));
        const result = await executeGuard(...makeRouteState("/home"));
        expect(router.createUrlTree).toHaveBeenCalledWith(["/auth/login"]);
        expect(result).not.toBe(true);
    });

    it("captures the access_token query param into the auth service", async () => {
        await executeGuard(...makeRouteState("/home?access_token=tok-from-url"));
        expect(auth.setToken).toHaveBeenCalledWith("tok-from-url");
    });

    it("does not call setToken when no access_token is in the URL", async () => {
        await executeGuard(...makeRouteState("/home"));
        expect(auth.setToken).not.toHaveBeenCalled();
    });
});
