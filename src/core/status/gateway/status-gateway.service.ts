import { Injectable } from "@angular/core";
import { MainServerGatewayService } from "../../common/gateway/main-server-gateway.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { AuthService } from "../../auth/service/auth.service";
import { Status } from "../entity/status.entity";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";
import { NGXLogger } from "ngx-logger";

@Injectable({
    providedIn: "root",
})
export class StatusGatewayService extends MainServerGatewayService {
    constructor(auth: AuthService, logger: NGXLogger) {
        super(auth, logger);
        this.setPath(ServerEndpoints.websocket, ServerEndpoints.status, ServerEndpoints.new);
        this.setWs();
    }

    watchNewStatus(callback: (message: Status) => void) {
        this.messageSubject.subscribe(event => {
            if (event.data === WebsocketReceivedMessage.pong) return;

            const message = JSON.parse(event.data);

            callback(message);
        });
    }
}
