import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { Subject } from "rxjs";

import { CampaignGatewayService } from "./campaign-gateway.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { CampaignResults } from "../model/campaign-results.model";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { installFakeWebSocket, lastFakeWs, FakeWebSocket } from "../../../testing";

describe("CampaignGatewayService", () => {
    let service: CampaignGatewayService;
    let authToken: Subject<string>;
    let wsHandle: { dispose: () => void };

    beforeEach(() => {
        wsHandle = installFakeWebSocket();
        authToken = new Subject<string>();
        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                CampaignGatewayService,
                { provide: AuthService, useValue: { token: authToken } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged: new Subject<string>() },
                },
            ],
        });
        service = TestBed.inject(CampaignGatewayService);
        authToken.next("tok");
        lastFakeWs().triggerOpen();
    });

    afterEach(() => {
        wsHandle.dispose();
    });

    describe("watchCampaign", () => {
        it("parses JSON frames and routes them to the JSON callback", () => {
            const seen: CampaignResults[] = [];
            service.watchCampaign(r => seen.push(r));

            lastFakeWs().receive(JSON.stringify({ total: 10, sent: 5, successes: 4, errors: 1 }));
            expect(seen.length).toBe(1);
            expect(seen[0].total).toBe(10);
        });

        it("filters pong heartbeats", () => {
            const seen: CampaignResults[] = [];
            service.watchCampaign(r => seen.push(r));

            lastFakeWs().receive(WebsocketReceivedMessage.pong);
            expect(seen.length).toBe(0);
        });

        it("falls back to the string callback when JSON parsing fails", () => {
            const json: CampaignResults[] = [];
            const strings: string[] = [];
            service.watchCampaign(
                r => json.push(r),
                s => strings.push(s),
            );

            lastFakeWs().receive("not-json-payload");
            expect(json).toEqual([]);
            expect(strings).toEqual(["not-json-payload"]);
        });

        it("silently drops unparseable frames when no string callback is provided", () => {
            const json: CampaignResults[] = [];
            // No second callback.
            service.watchCampaign(r => json.push(r));
            expect(() => lastFakeWs().receive("garbage")).not.toThrow();
            expect(json).toEqual([]);
        });
    });

    describe("connectToCampaign / send / cancel / status", () => {
        it("connectToCampaign rebuilds the path with the campaign id and opens a fresh socket", () => {
            const before = FakeWebSocket.instances.length;
            service.connectToCampaign("camp-42");
            expect(FakeWebSocket.instances.length).toBe(before + 1);
            expect(lastFakeWs().url).toContain("camp-42");
            expect(lastFakeWs().url).toContain("send");
        });

        it("send / cancel / status forward control payloads on the active socket", async () => {
            const ws = lastFakeWs();
            await service.send();
            await service.cancel();
            await service.status();
            expect(ws.sent).toEqual(["send", "cancel", "status"]);
        });
    });
});
