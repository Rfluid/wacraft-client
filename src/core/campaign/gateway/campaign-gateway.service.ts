import { Injectable } from "@angular/core";
import { MainServerGatewayService } from "../../common/gateway/main-server-gateway.service";
import { AuthService } from "../../auth/service/auth.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { CampaignResults } from "../model/campaign-results.model";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { NGXLogger } from "ngx-logger";

@Injectable({
    providedIn: "root",
})
export class CampaignGatewayService extends MainServerGatewayService {
    constructor(auth: AuthService, logger: NGXLogger) {
        super(auth, logger);
        this.setPath(ServerEndpoints.websocket, ServerEndpoints.campaign, ServerEndpoints.whatsapp);
    }

    connectToCampaign(campaignId: string) {
        this.setPath(ServerEndpoints.websocket, ServerEndpoints.campaign, ServerEndpoints.whatsapp);
        this.appendPath("send", campaignId);
        this.setWs();
    }

    send() {
        this.sendWebSocketMessage("send");
    }

    cancel() {
        this.sendWebSocketMessage("cancel");
    }

    status() {
        this.sendWebSocketMessage("status");
    }

    watchCampaign(
        jsonCallback: (result: CampaignResults) => void,
        stringCallback?: (result: string) => void,
    ) {
        this.messageSubject.subscribe(event => {
            try {
                if (event.data === WebsocketReceivedMessage.pong) return;

                const result = JSON.parse(event.data);

                jsonCallback(result);
            } catch (error) {
                if (stringCallback) {
                    stringCallback(event.data);
                }
            }
        });
    }
}
