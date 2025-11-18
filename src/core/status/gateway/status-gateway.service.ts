import { Injectable } from "@angular/core";
import { MainServerGatewayService } from "../../common/gateway/main-server-gateway.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Status } from "../entity/status.entity";
import { WebsocketReceivedMessage } from "../../common/model/websocket-received-message.model";

@Injectable({
    providedIn: "root",
})
export class StatusGatewayService extends MainServerGatewayService {
    constructor() {
        super();
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
