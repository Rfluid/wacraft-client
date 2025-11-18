import { Conversation } from "../../../core/message/model/conversation.model";

export class ConversationWithUnread {
    message: Conversation;
    unread = 0;

    constructor(message: Conversation) {
        this.message = message;
    }

    increaseUnread(): void {
        this.unread++;
    }

    resetUnread(): void {
        this.unread = 0;
    }

    replaceUnread(unread: number): void {
        this.unread = unread;
    }
}
