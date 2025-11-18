import { Injectable, Pipe, PipeTransform } from "@angular/core";
import { Conversation, ConversationMessagingProductContact } from "../model/conversation.model";
import { NIL as NilUUID } from "uuid";

@Injectable({
    providedIn: "root",
})
@Pipe({
    name: "messagingProductContactFromMessage",
    standalone: true,
})
export class MessagingProductContactFromMessagePipe implements PipeTransform {
    transform(conversation: Conversation): ConversationMessagingProductContact {
        if (conversation.from_id && conversation.from_id != NilUUID)
            return conversation.from as ConversationMessagingProductContact;
        return conversation.to as ConversationMessagingProductContact;
    }
}
