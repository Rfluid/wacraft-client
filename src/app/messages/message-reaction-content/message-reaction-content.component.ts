import { Component, Input } from "@angular/core";
import { Conversation } from "../../../core/message/model/conversation.model";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";
import { MessageContentPreviewComponent } from "../../messages/message-content-preview/message-content-preview.component";

@Component({
    selector: "app-message-reaction-content",
    imports: [MessageDataPipe, MessageContentPreviewComponent],
    templateUrl: "./message-reaction-content.component.html",
    styleUrl: "./message-reaction-content.component.scss",
    standalone: true,
})
export class MessageReactionContentComponent {
    @Input() message!: Conversation;
    @Input() isSent!: boolean;
    @Input() sent = true;
}
