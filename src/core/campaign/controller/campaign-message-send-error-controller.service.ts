import { Injectable, inject } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { CampaignMessageSendError } from "../entity/campaign-message-send-error.model";
import { QueryError } from "../model/query-error.model";

@Injectable({
    providedIn: "root",
})
export class CampaignMessageSendErrorControllerService extends MainServerControllerService {
    override auth: AuthService;

    constructor() {
        const auth = inject(AuthService);

        super();
        this.auth = auth;

        this.setPath(ServerEndpoints.campaign, ServerEndpoints.error);
        this.setHttp();
    }

    async get(
        query: QueryError = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<CampaignMessageSendError[]> {
        return (
            await this.http.get<CampaignMessageSendError[]>("", {
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
