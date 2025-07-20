import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { SenderData } from "../../../core/message/model/sender-data.model";
import { MessageType } from "../../../core/message/model/message-type.model";
import { MessageControllerService } from "../../../core/message/controller/message-controller.service";
import { MessageFields } from "../../../core/message/entity/message.entity";
import { SmallButtonComponent } from "../../common/small-button/small-button.component";
import { MediaControllerService } from "../../../core/media/controller/media-controller.service";
import { FormsModule, NgForm } from "@angular/forms";
import { InteractiveMessageBuilderComponent } from "../interactive-message-builder/interactive-message-builder.component";
import { LocationMessageBuilderComponent } from "../location-message-builder/location-message-builder.component";
import { MessageReplyHeaderComponent } from "../../messages/message-reply-header/message-reply-header.component";
import {
    Conversation,
    ConversationMessagingProductContact,
} from "../../../core/message/model/conversation.model";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";
import { MatIconModule } from "@angular/material/icon";
import { MediaMessageFileUploadComponent } from "../../messages/media-message-file-upload/media-message-file-upload.component";
import { MessageTypeSelectorComponent } from "../../messages/message-type-selector/message-type-selector.component";
import { NGXLogger } from "ngx-logger";
import { ContactsMessageBuilderComponent } from "../contacts-message-builder/contacts-message-builder.component";
import { ContactsModalComponent } from "../../contacts/contact-modal/contacts-modal.component";

@Component({
    selector: "app-message-actions-footer",
    imports: [
        CommonModule,
        SmallButtonComponent,
        FormsModule,
        TimeoutErrorModalComponent,
        MatIconModule,
        ContactsModalComponent,
    ],
    templateUrl: "./message-actions-footer.component.html",
    styleUrl: "./message-actions-footer.component.scss",
})
export class MessageActionsFooterComponent {
    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    @Input("messages") messages!: Conversation[];

    @Output("clear") clear = new EventEmitter();
    @Output("sent") sent = new EventEmitter<[SenderData, string]>();

    constructor(
        private messageController: MessageControllerService,
        private mediaController: MediaControllerService,
        private logger: NGXLogger,
    ) {}

    async sendMessagesToContacts(contacts: ConversationMessagingProductContact[]) {
        await Promise.all(
            this.messages.map(message => this.sendMessageToContacts(contacts, message)),
        );
    }

    async sendMessageToContacts(
        contacts: ConversationMessagingProductContact[],
        message: Conversation,
    ) {
        const sendPromises = contacts.map(contact => {
            const sender_data = {
                ...(message?.sender_data ?? message?.receiver_data),
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: contact.product_details.phone_number,
            } as SenderData;
            const to_id = contact.id;
            const promise = this.messageController
                .sendWhatsAppMessage({
                    to_id,
                    sender_data,
                })
                .catch(err => this.handleErr(`Failed to send message to ${to_id}`, err));
            this.sent.emit([sender_data, to_id]);
            return promise;
        });
        await Promise.all(sendPromises);
    }

    isForwardModalOpen: boolean = false;
    closeModal() {
        this.isForwardModalOpen = false;
    }

    errorStr: string = "";
    errorData: any;
    handleErr(message: string, err: any) {
        this.errorData = err?.response?.data;
        this.errorStr = err?.response?.data?.description || message;
        this.logger.error("Async error", err);
        this.errorModal.openModal();
    }
}
