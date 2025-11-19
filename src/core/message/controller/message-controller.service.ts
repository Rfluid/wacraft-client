import { Injectable } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import { MessageFields } from "../entity/message.entity";
import { SendWhatsAppMessage } from "../model/send-whatsapp-message.model";
import { Query } from "../model/query.model";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrderWithDeletedAt } from "../../common/model/date-order.model";
import { Conversation } from "../model/conversation.model";
import { WhereDateWithDeletedAt } from "../../common/model/where-date.model";

@Injectable({
    providedIn: "root",
})
export class MessageControllerService extends MainServerControllerService {
    constructor() {
        super();
        this.setPath(ServerEndpoints.message);
        this.setHttp();
    }

    async sendWhatsAppMessage(payload: SendWhatsAppMessage): Promise<MessageFields> {
        return (await this.http.post<MessageFields>(ServerEndpoints.whatsapp, payload)).data;
    }

    async contentLike(
        likeText: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
    ): Promise<Conversation[]> {
        const encodedLikeText = encodeURIComponent(likeText);
        return (
            await this.http.get<Conversation[]>(
                `/${ServerEndpoints.content}/${ServerEndpoints.like}/${encodedLikeText}`,
                {
                    params: {
                        ...query,
                        ...pagination,
                        ...order,
                    },
                },
            )
        ).data;
    }

    async contentKeyLike(
        keyName: string,
        likeText: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
    ): Promise<Conversation[]> {
        const encodedKeyName = encodeURIComponent(keyName);
        const encodedLikeText = encodeURIComponent(likeText);
        return (
            await this.http.get<Conversation[]>(
                `${ServerEndpoints.content}/${encodedKeyName}/${ServerEndpoints.like}/${encodedLikeText}`,
                {
                    params: {
                        ...query,
                        ...pagination,
                        ...order,
                    },
                },
            )
        ).data;
    }

    async getWamId(
        wamId: string,
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
    ): Promise<MessageFields[]> {
        const encodedWamId = encodeURIComponent(wamId);
        return (
            await this.http.get<MessageFields[]>(
                `${ServerEndpoints.whatsapp}/wam-id/${encodedWamId}`,
                {
                    params: {
                        ...query,
                        ...pagination,
                        ...order,
                    },
                },
            )
        ).data;
    }

    async markConversationAsReadToUser(
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<{ success: boolean }> {
        return (
            await this.http.post<{ success: boolean }>(
                `${ServerEndpoints.whatsapp}/mark-as-read`,
                undefined,
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

    async sendTypingToUser(
        query: Query = {},
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrderWithDeletedAt = {},
        whereDate: WhereDateWithDeletedAt = {},
    ): Promise<{ success: boolean }> {
        return (
            await this.http.post<{ success: boolean }>(
                `${ServerEndpoints.whatsapp}/send-typing`,
                undefined,
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

    async countContentLike(
        likeText: string,
        query: Query = {},
        order: DateOrderWithDeletedAt = {},
    ): Promise<number> {
        const encodedLikeText = encodeURIComponent(likeText);
        return (
            await this.http.get<number>(
                `/${ServerEndpoints.count}/${ServerEndpoints.content}/${ServerEndpoints.like}/${encodedLikeText}`,
                {
                    params: {
                        ...query,
                        ...order,
                    },
                },
            )
        ).data;
    }

    async countContentKeyLike(
        keyName: string,
        likeText: string,
        query: Query = {},
        order: DateOrderWithDeletedAt = {},
    ): Promise<number> {
        const encodedKeyName = encodeURIComponent(keyName);
        const encodedLikeText = encodeURIComponent(likeText);
        return (
            await this.http.get<number>(
                `/${ServerEndpoints.count}/${ServerEndpoints.content}/${encodedKeyName}/${ServerEndpoints.like}/${encodedLikeText}`,
                {
                    params: {
                        ...query,
                        ...order,
                    },
                },
            )
        ).data;
    }
}
