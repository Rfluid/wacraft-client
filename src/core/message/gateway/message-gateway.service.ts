import { Injectable } from "@angular/core";
import { MainServerGatewayService } from "../../common/gateway/main-server-gateway.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { AuthService } from "../../auth/service/auth.service";
import { Conversation } from "../model/conversation.model";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { NGXLogger } from "ngx-logger";

@Injectable({
    providedIn: "root",
})
export class MessageGatewayService extends MainServerGatewayService {
    constructor(auth: AuthService, logger: NGXLogger) {
        super(auth, logger);
        this.setPath(ServerEndpoints.websocket, ServerEndpoints.message, ServerEndpoints.new);
        this.setWs();
    }

    watchNewMessage(callback: (message: Conversation) => void) {
        this.messageSubject.subscribe(event => {
            // Ignore heartbeat replies
            if (event.data === WebsocketReceivedMessage.pong) return;

            const message = JSON.parse(event.data);

            callback(message);
        });
    }
}
