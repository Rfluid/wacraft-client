import { TestBed } from "@angular/core/testing";
import { Router, NavigationEnd } from "@angular/router";
import { Subject } from "rxjs";

import { MainServerControllerService } from "./main-server-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { drain } from "../../../testing";

describe("MainServerControllerService", () => {
    let service: MainServerControllerService;
    let token: Subject<string>;
    let workspaceChanged: Subject<string>;
    let workspaceContext: { currentWorkspaceId: string | null; workspaceChanged: Subject<string> };
    let router: { url: string; events: Subject<unknown>; navigate: jasmine.Spy };
    let originalLocalStorage: Storage;

    beforeEach(() => {
        token = new Subject<string>();
        workspaceChanged = new Subject<string>();
        workspaceContext = { currentWorkspaceId: null, workspaceChanged };
        router = {
            url: "/somewhere",
            events: new Subject(),
            navigate: jasmine.createSpy("navigate"),
        };

        // localStorage stub.
        originalLocalStorage = window.localStorage;
        const storage = new Map<string, string>();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (k: string) => storage.get(k) ?? null,
                setItem: (k: string, v: string) => storage.set(k, v),
                removeItem: (k: string) => storage.delete(k),
                clear: () => storage.clear(),
                key: () => null,
                length: 0,
            },
        });

        TestBed.configureTestingModule({
            providers: [
                MainServerControllerService,
                { provide: AuthService, useValue: { token } },
                { provide: WorkspaceContextService, useValue: workspaceContext },
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(MainServerControllerService);
    });

    afterEach(() => {
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: originalLocalStorage,
        });
    });

    describe("setHttp — auth and workspace headers", () => {
        it("rebuilds the axios instance with the bearer token when a token arrives", () => {
            const before = service.http;
            token.next("tok-A");
            expect(service.http).not.toBe(before); // new instance
            expect(service.http.defaults.headers["Authorization"]).toBe("Bearer tok-A");
        });

        it("includes the X-Workspace-ID header when a workspace is selected", () => {
            workspaceContext.currentWorkspaceId = "ws-99";
            token.next("tok-A");
            expect(service.http.defaults.headers["X-Workspace-ID"]).toBe("ws-99");
        });

        it("omits X-Workspace-ID when no workspace is selected", () => {
            token.next("tok-A");
            expect(service.http.defaults.headers["X-Workspace-ID"]).toBeUndefined();
        });

        it("ignores empty/null tokens (does not rebuild http instance)", () => {
            const before = service.http;
            token.next(""); // null/falsy → setHttp returns early
            expect(service.http).toBe(before);
        });

        it("rebuilds http on workspace change using the persisted token", () => {
            window.localStorage.setItem("accessToken", "tok-stored");
            const before = service.http;
            workspaceContext.currentWorkspaceId = "ws-42";
            workspaceChanged.next("ws-42");
            expect(service.http).not.toBe(before);
            expect(service.http.defaults.headers["Authorization"]).toBe("Bearer tok-stored");
            expect(service.http.defaults.headers["X-Workspace-ID"]).toBe("ws-42");
        });
    });

    describe("billing-redirect interceptor", () => {
        async function fireResponseError(error: unknown): Promise<void> {
            // Find the response-error interceptor and invoke its rejection handler.
            const interceptors = (
                service.http.interceptors.response as unknown as {
                    handlers: { rejected?: (err: unknown) => unknown }[];
                }
            ).handlers;
            const handler = interceptors.find(h => h.rejected)?.rejected;
            if (!handler) throw new Error("no rejected handler");
            try {
                await handler(error);
            } catch {
                // The interceptor re-rejects.
            }
        }

        beforeEach(() => {
            token.next("tok-A"); // ensure a fresh http with attached interceptor
        });

        it("redirects to /billing on 429 with billing context", async () => {
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            expect(router.navigate).toHaveBeenCalledWith(["/billing"]);
        });

        it("does not redirect on 429 without billing context", async () => {
            await fireResponseError({ response: { status: 429, data: {} } });
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it("does not redirect when already on /billing", async () => {
            router.url = "/billing/something";
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it("does not redirect when on auth pages", async () => {
            router.url = "/auth/login";
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it("coalesces a burst of 429s into a single navigate (until next NavigationEnd)", async () => {
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            expect(router.navigate.calls.count()).toBe(1);

            // After NavigationEnd fires, the gate resets and a new redirect can run.
            router.events.next(new NavigationEnd(0, "/billing", "/billing"));
            await drain();
            await fireResponseError({
                response: { status: 429, data: { context: "billing" } },
            });
            expect(router.navigate.calls.count()).toBe(2);
        });

        it("re-rejects the original error after handling", async () => {
            const interceptors = (
                service.http.interceptors.response as unknown as {
                    handlers: { rejected?: (err: unknown) => unknown }[];
                }
            ).handlers;
            const handler = interceptors.find(h => h.rejected)!.rejected!;
            const err = { response: { status: 500 } };
            await expectAsync(handler(err) as Promise<unknown>).toBeRejectedWith(err);
        });
    });

    describe("verify-email-required interceptor", () => {
        async function fireResponseError(error: unknown): Promise<void> {
            const interceptors = (
                service.http.interceptors.response as unknown as {
                    handlers: { rejected?: (err: unknown) => unknown }[];
                }
            ).handlers;
            const handler = interceptors.find(h => h.rejected)?.rejected;
            try {
                await handler!(error);
            } catch {
                /* re-rejection is expected */
            }
        }

        beforeEach(() => {
            token.next("tok-A");
        });

        it("redirects to /verify-email-required on 403 with the email-verification message", async () => {
            await fireResponseError({
                response: {
                    status: 403,
                    data: { message: "Email verification required" },
                },
            });
            expect(router.navigate).toHaveBeenCalledWith(["/verify-email-required"]);
        });

        it("does not redirect on a 403 with a different message", async () => {
            await fireResponseError({
                response: { status: 403, data: { message: "Forbidden" } },
            });
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it("does not redirect when already on /verify-email-required", async () => {
            router.url = "/verify-email-required";
            await fireResponseError({
                response: {
                    status: 403,
                    data: { message: "Email verification required" },
                },
            });
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe("setPath", () => {
        it("stores the path used to build subsequent baseURLs", () => {
            service.setPath();
            // Smoke check via the next setHttp.
            token.next("tok-A");
            expect(service.http.defaults.baseURL).toContain("http");
        });
    });
});
