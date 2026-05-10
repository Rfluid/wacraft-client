import { TestBed } from "@angular/core/testing";
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from "@angular/router";

import { adminGuard } from "./admin.guard";
import { UserStoreService } from "../../user/store/user-store.service";
import { Role } from "../../user/model/role.model";

describe("adminGuard", () => {
    let userStore: jasmine.SpyObj<UserStoreService> & {
        currentUser: unknown;
    };
    let router: { navigate: jasmine.Spy };

    const executeGuard: CanActivateFn = (...args) =>
        TestBed.runInInjectionContext(() => adminGuard(...args));

    const args = [{} as ActivatedRouteSnapshot, {} as RouterStateSnapshot] as const;

    beforeEach(() => {
        const spy = jasmine.createSpyObj<UserStoreService>("UserStoreService", ["loadCurrent"]);
        spy.loadCurrent.and.resolveTo();
        userStore = Object.assign(spy, { currentUser: undefined });

        router = { navigate: jasmine.createSpy("navigate") };

        TestBed.configureTestingModule({
            providers: [
                { provide: UserStoreService, useValue: userStore },
                { provide: Router, useValue: router },
            ],
        });
    });

    it("returns true when current user has admin role", async () => {
        userStore.currentUser = { role: Role.admin } as never;
        expect(await executeGuard(...args)).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it("redirects to /home and returns false when role is not admin", async () => {
        userStore.currentUser = { role: Role.user } as never;
        const result = await executeGuard(...args);
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(["home"]);
    });

    it("redirects to /home when currentUser is undefined", async () => {
        userStore.currentUser = undefined as never;
        expect(await executeGuard(...args)).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(["home"]);
    });

    it("redirects to /home when loadCurrent throws", async () => {
        userStore.loadCurrent.and.rejectWith(new Error("net"));
        expect(await executeGuard(...args)).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(["home"]);
    });
});
