import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { Subject } from "rxjs";

import { MainServerGatewayService } from "./main-server-gateway.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { FakeWebSocket, installFakeWebSocket, lastFakeWs } from "../../../testing";

describe("MainServerGatewayService", () => {
    let service: MainServerGatewayService;
    let authToken: Subject<string>;
    let workspaceChanged: Subject<string>;
    let workspaceContext: { currentWorkspaceId: string | null; workspaceChanged: Subject<string> };
    let wsHandle: { dispose: () => void };
    let originalLocalStorage: Storage;

    beforeEach(() => {
        wsHandle = installFakeWebSocket();

        // Stub localStorage so setWs picks up a deterministic token.
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
        storage.set("accessToken", "tok-initial");

        authToken = new Subject<string>();
        workspaceChanged = new Subject<string>();
        workspaceContext = { currentWorkspaceId: null, workspaceChanged };

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                MainServerGatewayService,
                { provide: AuthService, useValue: { token: authToken } },
                { provide: WorkspaceContextService, useValue: workspaceContext },
            ],
        });
        service = TestBed.inject(MainServerGatewayService);
        service.setPath();
    });

    afterEach(() => {
        wsHandle.dispose();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: originalLocalStorage,
        });
        if (service.reconnectTimeout) clearTimeout(service.reconnectTimeout);
    });

    const lastWs = (): FakeWebSocket => lastFakeWs();

    describe("construction and token-driven socket setup", () => {
        it("does not open a WebSocket until something triggers setWs", () => {
            // The Subject in AuthService doesn't replay; constructor's watchToken()
            // subscribes but no token has been emitted, so no socket yet.
            expect(FakeWebSocket.instances.length).toBe(0);
        });

        it("opens a WebSocket when a token is emitted, with the bearer token in the query", () => {
            authToken.next("tok-A");
            expect(FakeWebSocket.instances.length).toBe(1);
            expect(lastWs().url).toContain("Authorization=Bearer+tok-A");
        });

        it("includes workspace_id in the query when a workspace is selected", () => {
            workspaceContext.currentWorkspaceId = "ws-1";
            authToken.next("tok-A");
            expect(lastWs().url).toContain("workspace_id=ws-1");
        });

        it("reuses the bearer token from localStorage when setWs is called without one", () => {
            service.setWs();
            expect(lastWs().url).toContain("Authorization=Bearer+tok-initial");
        });
    });

    describe("openSubject / opened Promise", () => {
        it("resolves the opened Promise when the underlying socket fires onopen", async () => {
            authToken.next("tok-A");
            const opened = service.opened;
            lastWs().triggerOpen();
            await opened;
            expect().nothing();
        });
    });

    describe("token swap", () => {
        it("creates a new socket on each token emission", () => {
            authToken.next("tok-A");
            authToken.next("tok-B");
            expect(FakeWebSocket.instances.length).toBe(2);
            expect(FakeWebSocket.instances[0].url).toContain("tok-A");
            expect(FakeWebSocket.instances[1].url).toContain("tok-B");
        });

        it("closes the previous socket only once the new socket has opened", () => {
            authToken.next("tok-A");
            const a = FakeWebSocket.instances[0];
            // A must be the active socket before B can close it; the close
            // happens inside B.onopen by reading the previously-bound this.ws.
            a.triggerOpen();

            authToken.next("tok-B");
            const b = FakeWebSocket.instances[1];
            expect(a.closed).toBe(false); // B still connecting

            b.triggerOpen();
            expect(a.closed).toBe(true);
        });
    });

    describe("workspace change", () => {
        it("re-creates the socket when workspaceChanged emits", () => {
            authToken.next("tok-A");
            const before = FakeWebSocket.instances.length;
            workspaceChanged.next("ws-2");
            expect(FakeWebSocket.instances.length).toBe(before + 1);
        });
    });

    describe("messageSubject routing", () => {
        it("forwards messages from the currently active socket", () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();

            const seen: string[] = [];
            service.messageSubject.subscribe(e => seen.push(e.data as string));

            lastWs().receive("hello");
            expect(seen).toEqual(["hello"]);
        });

        it("ignores messages from a stale socket after token swap", () => {
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();

            authToken.next("tok-B");
            const b = lastWs();
            b.triggerOpen();

            const seen: string[] = [];
            service.messageSubject.subscribe(e => seen.push(e.data as string));

            // The previous socket is still bound; drive a message from it. The
            // gateway's `if (ws !== this.ws) return` guard must drop it.
            a.receive("from-old");
            b.receive("from-new");
            expect(seen).toEqual(["from-new"]);
        });
    });

    describe("auto-reconnect on error", () => {
        beforeEach(() => {
            jasmine.clock().install();
        });
        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it("schedules a reconnect after the current socket errors", () => {
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();
            service.reconnectAttempts = 0;
            a.triggerError();

            expect(service.reconnectAttempts).toBe(1);
            jasmine.clock().tick(service.baseDelay + 10);
            expect(FakeWebSocket.instances.length).toBe(2);
        });

        it("uses exponential backoff capped at maxDelay", () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();
            service.maxReconnectAttempts = 100;
            service.baseDelay = 1000;
            service.maxDelay = 5000;

            // Each reconnected socket must be opened (binding it to this.ws)
            // before the next error counts; otherwise onerror's
            // `ws !== this.ws` guard drops the reconnect.
            for (let i = 0; i < 4; i++) {
                lastWs().triggerError();
                jasmine.clock().tick(service.maxDelay + 10);
                lastWs().triggerOpen();
            }
            expect(FakeWebSocket.instances.length).toBe(5);
        });

        it("stops scheduling once maxReconnectAttempts is reached", () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();
            service.maxReconnectAttempts = 2;
            service.reconnectAttempts = 2;
            lastWs().triggerError();

            jasmine.clock().tick(service.maxDelay + 1000);
            expect(FakeWebSocket.instances.length).toBe(1);
        });

        it("does not schedule when autoReconnect is disabled", () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();
            service.autoReconnect = false;
            lastWs().triggerError();
            jasmine.clock().tick(60_000);
            expect(FakeWebSocket.instances.length).toBe(1);
        });

        it("does not schedule when an old (non-current) socket errors", () => {
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();
            authToken.next("tok-B");
            const b = lastWs();
            b.triggerOpen();
            const before = FakeWebSocket.instances.length;

            a.triggerError(); // stale; gateway must ignore
            jasmine.clock().tick(60_000);
            expect(FakeWebSocket.instances.length).toBe(before);
        });
    });

    describe("ping keep-alive", () => {
        beforeEach(() => {
            jasmine.clock().install();
        });
        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it("starts an interval ping after onopen and stops it on close", () => {
            service.pingInterval = 1000;
            service.sendPing = true;
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();

            jasmine.clock().tick(2500);
            expect(a.sent.length).toBe(2);
            const before = a.sent.length;

            a.triggerClose();
            jasmine.clock().tick(5000);
            expect(a.sent.length).toBe(before);
        });

        it("does not send when sendPing is disabled", () => {
            service.pingInterval = 1000;
            service.sendPing = false;
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();
            jasmine.clock().tick(5000);
            expect(a.sent.length).toBe(0);
        });

        it("uses an independent timer per socket (no double-pings after token swap)", () => {
            service.pingInterval = 1000;
            service.sendPing = true;
            authToken.next("tok-A");
            const a = lastWs();
            a.triggerOpen();

            authToken.next("tok-B");
            const b = lastWs();
            b.triggerOpen();
            // The previous socket should have been closed (which stops its ping timer).
            expect(a.closed).toBe(true);

            const beforeA = a.sent.length;
            jasmine.clock().tick(2500);
            // Only b accumulates pings; a should not.
            expect(a.sent.length).toBe(beforeA);
            expect(b.sent.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("sendWebSocketMessage", () => {
        it("forwards data to the active socket once opened", async () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();

            await service.sendWebSocketMessage("hello");
            expect(lastWs().sent).toContain("hello");
        });

        it("rejects when the socket has been cleared after the connection was opened", async () => {
            authToken.next("tok-A");
            lastWs().triggerOpen();
            (service as unknown as { ws?: WebSocket }).ws = undefined;
            await expectAsync(service.sendWebSocketMessage("data")).toBeRejected();
        });
    });
});
