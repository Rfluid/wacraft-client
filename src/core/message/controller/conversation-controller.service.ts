import { Injectable } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { Query } from "../model/query.model";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrderWithDeletedAt } from "../../common/model/date-order.model";
import { Conversation } from "../model/conversation.model";
import { WhereDateWithDeletedAt } from "../../common/model/where-date.model";

@Injectable({
    providedIn: "root",
})
export class ConversationControllerService extends MainServerControllerService {
    constructor() {
        super();
        this.setPath(ServerEndpoints.message, ServerEndpoints.conversation);
        this.setHttp();
    }

    async get(
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<Conversation[]> {
        return (
            await this.http.get<Conversation[]>("", {
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
        query: Query = {},
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<number> {
        return (
            await this.http.get<number>(`${ServerEndpoints.count}`, {
                params: {
                    ...query,
                    ...order,
                    ...whereDate,
                },
            })
        ).data;
    }

    async getByMessagingProductContact(
        messagingProductContactId: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<Conversation[]> {
        return (
            await this.http.get<Conversation[]>(
                `${ServerEndpoints.messaging_product_contact}/${messagingProductContactId}`,
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

    async countByMessagingProductContact(
        messagingProductContactId: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<number> {
        return (
            await this.http.get<number>(
                `count/${ServerEndpoints.messaging_product_contact}/${messagingProductContactId}`,
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

    async conversationContentLike(
        messagingProductContactId: string,
        likeText: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<Conversation[]> {
        likeText = encodeURIComponent(likeText);
        return (
            await this.http.get<Conversation[]>(
                `${ServerEndpoints.messaging_product_contact}/${messagingProductContactId}/${ServerEndpoints.content}/${ServerEndpoints.like}/${likeText}`,
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

    async countConversationContentLike(
        messagingProductContactId: string,
        likeText: string,
        query: Query = {},
        pagination: Paginate = { limit: 1, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<number> {
        likeText = encodeURIComponent(likeText);
        return (
            await this.http.get<number>(
                `${ServerEndpoints.count}/${ServerEndpoints.messaging_product_contact}/${messagingProductContactId}/${ServerEndpoints.content}/${ServerEndpoints.like}/${likeText}`,
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
