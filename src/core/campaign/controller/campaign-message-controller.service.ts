import { Injectable, inject } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { CampaignMessage } from "../entity/campaign-message.entity";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { QueryMessage } from "../model/query-message.model";
import { CreateMessage } from "../model/create-message.model";

@Injectable({
    providedIn: "root",
})
export class CampaignMessageControllerService extends MainServerControllerService {
    override auth: AuthService;

    constructor() {
        const auth = inject(AuthService);

        super();
        this.auth = auth;

        this.setPath(ServerEndpoints.campaign, ServerEndpoints.message);
        this.setHttp();
    }

    async get(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<CampaignMessage[]> {
        return (
            await this.http.get<CampaignMessage[]>("", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async getSent(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<CampaignMessage[]> {
        return (
            await this.http.get<CampaignMessage[]>("sent", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async getUnsent(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<CampaignMessage[]> {
        return (
            await this.http.get<CampaignMessage[]>("unsent", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async count(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<number> {
        return (
            await this.http.get<number>("count", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async countSent(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<number> {
        return (
            await this.http.get<number>("count/sent", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async countUnsent(
        query: QueryMessage = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<number> {
        return (
            await this.http.get<number>("count/unsent", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async create(data: CreateMessage): Promise<CampaignMessage> {
        return (await this.http.post<CampaignMessage>("", data)).data;
    }

    async delete(id: string): Promise<void> {
        return (await this.http.delete<void>("", { data: { id } })).data;
    }
}
