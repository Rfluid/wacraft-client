import { Pipe, PipeTransform } from "@angular/core";
import { MessageFields } from "../entity/message.entity";

@Pipe({
    name: "messageId",
    standalone: true,
})
export class MessageIdPipe implements PipeTransform {
    transform(conversation: MessageFields): string {
        const messageId =
            conversation.receiver_data?.id || conversation.product_data?.messages[0].id;

        if (!messageId) throw new Error("Message ID not found");

        return messageId;
    }
}
