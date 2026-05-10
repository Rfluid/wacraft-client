import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { Subject } from "rxjs";

import { StatusGatewayService } from "./status-gateway.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { Status } from "../entity/status.entity";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { installFakeWebSocket, lastFakeWs } from "../../../testing";

describe("StatusGatewayService", () => {
    let service: StatusGatewayService;
    let authToken: Subject<string>;
    let wsHandle: { dispose: () => void };

    beforeEach(() => {
        wsHandle = installFakeWebSocket();
        authToken = new Subject<string>();
        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                StatusGatewayService,
                { provide: AuthService, useValue: { token: authToken } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged: new Subject<string>() },
                },
            ],
        });
        service = TestBed.inject(StatusGatewayService);
        authToken.next("tok");
        lastFakeWs().triggerOpen();
    });

    afterEach(() => {
        wsHandle.dispose();
    });

    it("parses JSON status frames and forwards them to the watcher", () => {
        const seen: Status[] = [];
        service.watchNewStatus(s => seen.push(s));

        lastFakeWs().receive(
            JSON.stringify({ message_id: "m1", product_data: { status: "sent" } }),
        );
        expect(seen.length).toBe(1);
        expect(seen[0].message_id).toBe("m1");
    });

    it("filters pong heartbeats", () => {
        const seen: Status[] = [];
        service.watchNewStatus(s => seen.push(s));

        lastFakeWs().receive(WebsocketReceivedMessage.pong);
        expect(seen.length).toBe(0);
    });

    it("configures the websocket path correctly", () => {
        expect(lastFakeWs().url).toContain("websocket");
        expect(lastFakeWs().url).toContain("status");
        expect(lastFakeWs().url).toContain("new");
    });
});
