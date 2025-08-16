/*  Centralised WebSocket gateway with:
 *    • Auto-reconnect using exponential back-off
 *    • Token hot-swap (subscribes to AuthService.token$)
 *    • Optional application-level ping/keep-alive
 *
 *  Make sure your backend recognises the ping payload:
 *      "ping"
 *  Otherwise tweak sendPingPayload().
 */

import { Injectable } from "@angular/core";
import { AuthService } from "../../auth/service/auth.service";
import { environment } from "../../../environments/environment";
import { ServerEndpoints } from "../constant/server-endpoints.enum";
import { firstValueFrom, Subject } from "rxjs";
import { WebsocketSentMessage } from "../model/websocket-sent-message.model";
import { NGXLogger } from "ngx-logger";

@Injectable({ providedIn: "root" })
export class MainServerGatewayService {
    /* ───── Connection target ───── */
    private readonly prefix = `ws${environment.mainServerSecurity ? "s" : ""}://${environment.mainServerUrl}`;
    private path: string[] = [];

    /* ───── Socket instance ───── */
    ws?: WebSocket;

    /* ───── Reactive once-only events ───── */
    openSubject = new Subject<Event>();
    closedSubject = new Subject<CloseEvent>();
    errorSubject = new Subject<Event>();

    opened = firstValueFrom(this.openSubject);
    closed = firstValueFrom(this.closedSubject);
    error = firstValueFrom(this.errorSubject);

    /* ───── Reconnection knobs ───── */
    autoReconnect = true;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    baseDelay = 2_000; // 2 s (doubles each retry)
    maxDelay = 60_000; // 1 min
    reconnectTimeout?: ReturnType<typeof setTimeout>;

    /* ───── Ping / keep-alive knobs ───── */
    sendPing = true; // disable if backend already handles ping/pong
    pingInterval = environment?.webSocketBasePingInterval ?? 30 * 1000; // use ping interval from environment variables
    private pingTimer?: ReturnType<typeof setInterval>;

    /* ───── ctor ───── */
    constructor(
        private auth: AuthService,
        private logger: NGXLogger,
    ) {
        this.watchToken(); // auto-initialises socket and hot-swaps token
    }

    /* ───── Public path helpers ───── */
    setPath(...path: ServerEndpoints[]): void {
        this.path = path;
    }
    appendPath(...path: string[]): void {
        this.path = [...this.path, ...path];
    }

    /* ──────────────────────────────────────────────────────────────────────────
     *  (Re)-Establishes the WebSocket. Safe to call repeatedly (tears down old).
     *──────────────────────────────────────────────────────────────────────────*/
    setWs(token: string | null = localStorage.getItem("accessToken")): void {
        this.clearReconnectTimer();
        this.stopPing(); // make sure ping loop is cleared

        /* Gracefully close previous socket (if any) */
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }

        /* Reset one-shot Subjects */
        this.openSubject = new Subject<Event>();
        this.closedSubject = new Subject<CloseEvent>();
        this.errorSubject = new Subject<Event>();
        this.opened = firstValueFrom(this.openSubject);
        this.closed = firstValueFrom(this.closedSubject);
        this.error = firstValueFrom(this.errorSubject);

        /* Build URL:  ws(s)://host/a/b?Authorization=Bearer xxxx */
        const address = [this.prefix, ...this.path].join("/");
        const url = `${address}?Authorization=${"Bearer " + token}`;

        this.ws = new WebSocket(url);

        /* ── Callbacks ── */
        this.ws.onopen = (ev: Event) => {
            this.logger.info("[WS] connected", { url });
            this.reconnectAttempts = 0;
            this.openSubject.next(ev);
            this.startPing(); // start keep-alive loop
        };

        this.ws.onclose = (ev: CloseEvent) => {
            this.logger.warn("[WS] closed", { ev });
            this.closedSubject.next(ev);
            this.stopPing();
            // Do not reconnect if closed without error
            // this.scheduleReconnect();
        };

        this.ws.onerror = (ev: Event) => {
            this.logger.error("[WS] error", { ev });
            this.errorSubject.next(ev);
            this.stopPing();
            this.scheduleReconnect();
        };
    }

    /* ───── Token watcher ───── */
    private watchToken(): void {
        this.auth.token.subscribe((tok) => this.setWs(tok));
    }

    /* ───── Reconnection helpers ───── */
    private scheduleReconnect(): void {
        if (!this.autoReconnect) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`[WS] giving up after ${this.maxReconnectAttempts} tries`);
            return;
        }
        const delay = Math.min(this.baseDelay * 2 ** this.reconnectAttempts, this.maxDelay);
        this.reconnectAttempts += 1;
        this.logger.info(`[WS] retry ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay / 1000}s`);
        this.reconnectTimeout = setTimeout(() => this.setWs(), delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
    }

    /* ───── Ping helpers ───── */
    private startPing(): void {
        if (!this.sendPing || !this.ws) return;
        this.pingTimer = setInterval(() => {
            if (this.ws!.readyState === WebSocket.OPEN) {
                this.ws!.send(WebsocketSentMessage.ping);
            }
        }, this.pingInterval);
    }

    private stopPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = undefined;
        }
    }
}
