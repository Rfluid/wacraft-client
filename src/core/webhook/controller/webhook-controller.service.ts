import { Injectable, inject } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Query } from "../model/query.model";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { Webhook } from "../entity/webhook.entity";
import { Create } from "../model/create.model";
import { Update } from "../model/update.model";

@Injectable({
    providedIn: "root",
})
export class WebhookControllerService extends MainServerControllerService {
    override auth: AuthService;

    constructor() {
        const auth = inject(AuthService);

        super();
        this.auth = auth;

        this.setPath(ServerEndpoints.webhook);
        this.setHttp();
    }

    async get(
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<Webhook[]> {
        return (
            await this.http.get<Webhook[]>("", {
                params: {
                    ...query,
                    ...pagination,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async create(data: Create): Promise<Webhook> {
        return (await this.http.post<Webhook>("", data)).data;
    }

    async delete(id: string): Promise<void> {
        return (await this.http.delete<void>("", { data: { id } })).data;
    }

    async update(data: Update): Promise<Webhook> {
        return (await this.http.put<Webhook>("", data)).data;
    }

    async contentLike(
        likeText: string,
        likeKey: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<Webhook[]> {
        likeText = encodeURIComponent(likeText);
        likeKey = encodeURIComponent(likeKey);
        return (
            await this.http.get<Webhook[]>(
                `${ServerEndpoints.content}/${likeKey}/${ServerEndpoints.like}/${likeText}`,
                {
                    params: {
                        ...query,
                        ...pagination,
                        ...order,
                        ...whereDate,
                    },
                },
            )
        ).data;
    }
}
