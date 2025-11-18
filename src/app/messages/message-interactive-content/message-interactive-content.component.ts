import { Component, Input } from "@angular/core";
import { MessageType } from "../../../core/message/model/message-type.model";
import { Conversation } from "../../../core/message/model/conversation.model";
import { CommonModule } from "@angular/common";
import { HeaderType } from "../../../core/message/model/header-type.model";
import {
    InteractiveType,
    ReceivedInteractiveType,
} from "../../../core/message/model/interactive-type.model";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";
import { ReceiverData } from "../../../core/message/model/receiver-data.model";
import { SenderData } from "../../../core/message/model/sender-data.model";
import { MessageMediaContentComponent } from "../message-media-content/message-media-content.component";
import { UseMedia } from "../../../core/message/model/media-data.model";
import { MessageInfoComponent } from "../message-info/message-info.component";
import { MessageForwardedHeaderComponent } from "../message-forwarded-header/message-forwarded-header.component";
import { MessageReplyHeaderComponent } from "../message-reply-header/message-reply-header.component";
import { ListOptionsModalComponent } from "../list-options-modal/list-options-modal.component";

@Component({
    selector: "app-message-interactive-content",
    imports: [
        CommonModule,
        MessageDataPipe,
        MessageMediaContentComponent,
        MessageInfoComponent,
        ListOptionsModalComponent,
        MessageForwardedHeaderComponent,
        MessageReplyHeaderComponent,
    ],
    templateUrl: "./message-interactive-content.component.html",
    styleUrl: "./message-interactive-content.component.scss",
    standalone: true,
})
export class MessageInteractiveContentComponent {
    MessageType = MessageType;
    HeaderType = HeaderType;
    InteractiveType = InteractiveType;
    ReceivedInteractiveType = ReceivedInteractiveType;

    listOptionsModalOpen = false;

    @Input("message") message!: Conversation;
    @Input("isSent") isSent!: boolean;
    @Input("sent") sent: boolean = true;
    @Input("contactName") contactName?: string;

    constructor(private messageDataPipe: MessageDataPipe) {}

    get messageSent(): SenderData {
        const data = this.messageDataPipe.transform(this.message);
        return data as SenderData;
    }

    get messageReceived() {
        const data = this.messageDataPipe.transform(this.message);
        return data as ReceiverData;
    }

    get useMediaData() {
        const data = this.messageSent.interactive?.header;
        if (!data) throw new Error("interactive header not present");

        return data[data.type] as UseMedia;
    }

    get headerTypeAsMessageType(): MessageType {
        switch (this.messageSent.interactive?.header?.type || HeaderType.image) {
            case HeaderType.image:
                return MessageType.image;
            case HeaderType.video:
                return MessageType.video;
            case HeaderType.document:
                return MessageType.document;
            case HeaderType.audio:
                return MessageType.audio;
            case HeaderType.text:
                return MessageType.text;
        }
    }

    openListOptionsModal() {
        this.listOptionsModalOpen = true;
    }

    closeListOptionsModal() {
        this.listOptionsModalOpen = false;
    }

    copyText(text: string) {
        navigator.clipboard.writeText(text);
    }
}
