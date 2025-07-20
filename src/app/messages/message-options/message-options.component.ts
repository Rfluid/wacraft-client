import { CommonModule } from "@angular/common";
import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    ViewChild,
} from "@angular/core";
import { MessageInfoDataComponent } from "../message-info-data/message-info-data.component";
import { Conversation } from "../../../core/message/model/conversation.model";
import { MessageControllerService } from "../../../core/message/controller/message-controller.service";
import { DateOrderEnum } from "../../../core/common/model/date-order.model";
import { NIL as NilUUID } from "uuid";
import { MatIconModule } from "@angular/material/icon";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { NGXLogger } from "ngx-logger";
import { SenderData } from "../../../core/message/model/sender-data.model";
import { MessageType } from "../../../core/message/model/message-type.model";
import { MessageIdPipe } from "../../../core/message/pipe/message-id.pipe";
import { MessageFields } from "../../../core/message/entity/message.entity";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

@Component({
    selector: "app-message-options",
    imports: [
        CommonModule,
        MessageInfoDataComponent,
        MatIconModule,
        PickerModule,
        TimeoutErrorModalComponent,
        MessageDataPipe,
    ],
    templateUrl: "./message-options.component.html",
    styleUrl: "./message-options.component.scss",
    standalone: true,
})
export class MessageOptionsComponent {
    MessageType = MessageType;

    @Input("message") message!: Conversation;

    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;
    @Output("reply") reply = new EventEmitter();
    @Output("close") close = new EventEmitter();
    @Output("reactionSent") reactionSent = new EventEmitter<SenderData>();
    @Input("toPhoneNumber") toPhoneNumberInput!: string;
    @Input("toId") toIdInput!: string;
    @Output("selectMessage") selectMessage = new EventEmitter();

    reaction: string = "";

    showMessageInfo: boolean = false;

    errorStr: string = "";
    errorData: any;

    get senderData(): SenderData {
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            reaction: {
                message_id: this.messageIdPipe.transform(this.message),
                emoji: this.reaction,
            },
            to: this.toPhoneNumberInput,
            type: MessageType.reaction,
        };
    }

    constructor(
        private elementRef: ElementRef,
        private messageController: MessageControllerService,
        private messageIdPipe: MessageIdPipe,
        private logger: NGXLogger,
    ) {}

    replyToMessage(): void {
        this.reply.emit();
        this.close.emit();
    }

    openMessageInfo(): void {
        this.showMessageInfo = true;
    }

    closeMessageInfo(): void {
        this.showMessageInfo = false;
        this.close.emit();
    }

    onSelectMessage(event: MouseEvent) {
        event.stopPropagation(); // ✅ Prevents click from reaching <li>
        this.selectMessage.emit(this.message);
        this.close.emit();
    }

    showEmojiPicker = false;
    toggleEmojiPicker(): void {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    async onEmojiSelect(event: any) {
        this.logger.debug("Emoji selected", event);
        // Send message
        this.reaction = event.emoji.native;
        await this.sendReaction();

        // Close UI helpers
        this.showEmojiPicker = false;
        this.close.emit();
    }

    async sendReaction(): Promise<MessageFields> {
        try {
            this.reactionSent.emit(this.senderData);
            const response = await this.messageController.sendWhatsAppMessage({
                sender_data: this.senderData,
                to_id: this.toIdInput,
            });
            return response;
        } catch (error) {
            this.handleErr("Error sending reaction.", error);
            return Promise.reject(error);
        }
    }

    async markAsRead() {
        try {
            let mpcId: string;
            if (this.message.from_id && this.message.from_id != NilUUID)
                mpcId = this.message.from_id;
            else mpcId = this.message.to_id;

            await this.messageController.markConversationAsReadToUser(
                {
                    from_id: mpcId,
                    id: this.message.id,
                },
                {
                    offset: 0,
                    limit: 1,
                },
                {
                    created_at: DateOrderEnum.desc,
                },
            );
            this.close.emit();
        } catch (error) {
            this.handleErr("Error marking message as read.", error);
            return Promise.reject(error);
        }
    }

    handleErr(message: string, err: any) {
        this.errorData = err?.response?.data;
        this.errorStr = err?.response?.data?.description || message;
        this.logger.error("Async error", err);
        this.errorModal.openModal();
    }

    // Shortcuts
    //
    // Close shortcuts
    @HostListener("document:click", ["$event"])
    private onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) this.close.emit();
    }
    @HostListener("window:keydown.shift.escape", ["$event"])
    private onShiftEscape(event: KeyboardEvent) {
        event.preventDefault();
        this.close.emit();
    }
    // Functional shortcuts
    @HostListener("window:keydown.control.r", ["$event"])
    private onCtrlR(event: KeyboardEvent) {
        event.preventDefault();
        this.replyToMessage();
    }
    @HostListener("window:keydown.control.d", ["$event"])
    private onCtrlD(event: KeyboardEvent) {
        event.preventDefault();
        this.openMessageInfo();
    }
    @HostListener("window:keydown.control.m", ["$event"])
    private onCtrlM(event: KeyboardEvent) {
        event.preventDefault();
        this.markAsRead();
    }
}
