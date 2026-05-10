import { TestBed } from "@angular/core/testing";
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from "@angular/router";

import { devtoolsGuard } from "./devtools.guard";
import { environment } from "../../../environments/environment";

describe("devtoolsGuard", () => {
    let router: { navigate: jasmine.Spy };
    const args = [{} as ActivatedRouteSnapshot, {} as RouterStateSnapshot] as const;
    let originalEnv: string;

    const executeGuard: CanActivateFn = (...inner) =>
        TestBed.runInInjectionContext(() => devtoolsGuard(...inner));

    beforeEach(() => {
        router = { navigate: jasmine.createSpy("navigate") };
        TestBed.configureTestingModule({
            providers: [{ provide: Router, useValue: router }],
        });
        originalEnv = environment.env;
    });

    afterEach(() => {
        environment.env = originalEnv;
    });

    it("permits dev environments", () => {
        for (const env of ["development", "dev", "local"]) {
            environment.env = env;
            router.navigate.calls.reset();
            expect(executeGuard(...args)).toBe(true);
            expect(router.navigate).not.toHaveBeenCalled();
        }
    });

    it("redirects to home and returns false in non-dev environments", () => {
        environment.env = "production";
        expect(executeGuard(...args)).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(["home"]);
    });
});
