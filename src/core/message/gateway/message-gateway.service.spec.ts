import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { Subject } from "rxjs";

import { MessageGatewayService } from "./message-gateway.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { Conversation } from "../model/conversation.model";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { installFakeWebSocket, lastFakeWs } from "../../../testing";

describe("MessageGatewayService", () => {
    let service: MessageGatewayService;
    let authToken: Subject<string>;
    let wsHandle: { dispose: () => void };

    beforeEach(() => {
        wsHandle = installFakeWebSocket();
        authToken = new Subject<string>();
        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                MessageGatewayService,
                { provide: AuthService, useValue: { token: authToken } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged: new Subject<string>() },
                },
            ],
        });
        service = TestBed.inject(MessageGatewayService);
        authToken.next("tok");
        lastFakeWs().triggerOpen();
    });

    afterEach(() => {
        wsHandle.dispose();
    });

    it("parses JSON frames and forwards them to the registered callback", () => {
        const seen: Conversation[] = [];
        service.watchNewMessage(m => seen.push(m));

        lastFakeWs().receive(JSON.stringify({ id: "m1", from_id: "c1" }));
        expect(seen.length).toBe(1);
        expect(seen[0].id).toBe("m1");
    });

    it("filters pong heartbeats", () => {
        const seen: Conversation[] = [];
        service.watchNewMessage(m => seen.push(m));

        lastFakeWs().receive(WebsocketReceivedMessage.pong);
        expect(seen.length).toBe(0);
    });

    it("can register multiple watchers (each receives every frame)", () => {
        const a: string[] = [];
        const b: string[] = [];
        service.watchNewMessage(m => a.push(m.id));
        service.watchNewMessage(m => b.push(m.id));

        lastFakeWs().receive(JSON.stringify({ id: "x" }));
        expect(a).toEqual(["x"]);
        expect(b).toEqual(["x"]);
    });

    it("configures the websocket path correctly", () => {
        // /websocket/message/new — the path encoded in the URL.
        expect(lastFakeWs().url).toContain("websocket");
        expect(lastFakeWs().url).toContain("message");
        expect(lastFakeWs().url).toContain("new");
    });
});
