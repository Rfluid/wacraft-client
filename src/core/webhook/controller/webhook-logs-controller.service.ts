import { Injectable, inject } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { WebhookLogFields } from "../entity/webhook-log.entity";
import { QueryLogs } from "../model/query.model";

@Injectable({
    providedIn: "root",
})
export class WebhookLogsControllerService extends MainServerControllerService {
    override auth: AuthService;

    constructor() {
        const auth = inject(AuthService);

        super();
        this.auth = auth;

        this.setPath(ServerEndpoints.webhook, ServerEndpoints.log);
        this.setHttp();
    }

    async get(
        query: QueryLogs = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<WebhookLogFields[]> {
        return (
            await this.http.get<WebhookLogFields[]>("", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }
}
