import { Injectable } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { MessagingProduct } from "../entity/messaging-product.entity";
import { Query } from "../model/query.model";

@Injectable({
    providedIn: "root",
})
export class MessagingProductControllerService extends MainServerControllerService {
    constructor() {
        super();
        this.setPath(ServerEndpoints.messaging_product);
        this.setHttp();
    }

    async get(
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<MessagingProduct[]> {
        return (
            await this.http.get<MessagingProduct[]>("", {
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
