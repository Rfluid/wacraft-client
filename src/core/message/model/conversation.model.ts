import { Contact } from "../../contact/entity/contact.entity";
import { MessagingProductContactFields } from "../../messaging-product/entity/messaging-product-contact.entity";
import { StatusFields } from "../../status/entity/status.entity";
import { MessageFields } from "../entity/message.entity";

export interface ConversationMessagingProductContact extends MessagingProductContactFields {
    contact: Contact;
}

export interface Conversation extends MessageFields {
    from?: ConversationMessagingProductContact;
    to?: ConversationMessagingProductContact;
    statuses?: StatusFields[];
}
