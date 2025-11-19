import { Injectable } from "@angular/core";
import { MainServerControllerService } from "../../common/controller/main-server-controller.service";
import { ServerEndpoints } from "../../common/constant/server-endpoints.enum";
import {
    MessagingProductContact,
    MessagingProductContactFields,
} from "../entity/messaging-product-contact.entity";
import { CreateWhatsAppContact } from "../model/create-whatsapp-contact.model";
import { QueryContact } from "../model/query-contact.model";
import { Paginate } from "../../common/model/paginate.model";
import { DateOrder } from "../../common/model/date-order.model";
import { WhereDate } from "../../common/model/where-date.model";
import { ConversationMessagingProductContact } from "../../message/model/conversation.model";

@Injectable({
    providedIn: "root",
})
export class MessagingProductContactControllerService extends MainServerControllerService {
    constructor() {
        super();
        this.setPath(ServerEndpoints.messaging_product, ServerEndpoints.contact);
        this.setHttp();
    }

    async delete(id: string): Promise<MessagingProductContactFields> {
        return (await this.http.delete(``, { data: { id } })).data;
    }

    async block(id: string): Promise<MessagingProductContactFields> {
        return (await this.http.patch(`${ServerEndpoints.block}`, { id })).data;
    }

    async createWhatsAppContact(
        data: CreateWhatsAppContact,
    ): Promise<MessagingProductContactFields> {
        return (
            await this.http.post<MessagingProductContactFields>(`${ServerEndpoints.whatsapp}`, data)
        ).data;
    }

    async getWhatsAppContacts(
        query: QueryContact,
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<ConversationMessagingProductContact[]> {
        return (
            await this.http.get<ConversationMessagingProductContact[]>(
                `${ServerEndpoints.whatsapp}`,
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

    async getLikeText(
        likeText: string,
        query: QueryContact,
        pagination: Paginate = { limit: 10, offset: 0 },
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<ConversationMessagingProductContact[]> {
        likeText = encodeURIComponent(likeText);
        return (
            await this.http.get<ConversationMessagingProductContact[]>(
                `${ServerEndpoints.content}/${ServerEndpoints.like}/${likeText}`,
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

    async countLikeText(
        likeText: string,
        query: QueryContact,
        order: DateOrder = {},
        whereDate: WhereDate = {},
    ): Promise<number> {
        likeText = encodeURIComponent(likeText);
        return (
            await this.http.get<number>(
                `/${ServerEndpoints.count}/${ServerEndpoints.content}/${ServerEndpoints.like}/${likeText}`,
                {
                    params: {
                        ...query,
                        ...order,
                        ...whereDate,
                    },
                },
            )
        ).data;
    }

    async unblock(id: string): Promise<MessagingProductContactFields> {
        return (await this.http.delete(`${ServerEndpoints.block}`, { data: { id } })).data;
    }

    async updateLastReadAt(messagingProductContactId: string): Promise<MessagingProductContact> {
        messagingProductContactId = encodeURIComponent(messagingProductContactId);
        return (
            await this.http.put<MessagingProductContact>(
                `last-read-at/${messagingProductContactId}`,
            )
        ).data;
    }
}
