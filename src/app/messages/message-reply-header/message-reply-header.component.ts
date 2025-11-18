import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MessageFields } from "../../../core/message/entity/message.entity";
import { MessageControllerService } from "../../../core/message/controller/message-controller.service";
import { Conversation } from "../../../core/message/model/conversation.model";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";
import { TemplateInterpolatorService } from "../../../core/template/service/template-interpolator.service";
import { MessageType } from "../../../core/message/model/message-type.model";
import { UseMedia } from "../../../core/message/model/media-data.model";
import { TemplateButton } from "../../../core/template/model/template-component.model";
import { SenderData } from "../../../core/message/model/sender-data.model";
import { Router } from "@angular/router";
import { TemplateStoreService } from "../../../core/template/store/template-store.service";
import { MessageContentPreviewComponent } from "../../messages/message-content-preview/message-content-preview.component";

@Component({
    selector: "app-message-reply-header",
    imports: [CommonModule, MessageDataPipe, MessageContentPreviewComponent],
    templateUrl: "./message-reply-header.component.html",
    styleUrl: "./message-reply-header.component.scss",
    standalone: true,
})
export class MessageReplyHeaderComponent implements OnInit {
    private messageController = inject(MessageControllerService);
    private messageDataPipe = inject(MessageDataPipe);
    private templateInterpolator = inject(TemplateInterpolatorService);
    private templateStore = inject(TemplateStoreService);
    private router = inject(Router);

    @Input() message?: Conversation;
    @Input() sent!: boolean;
    @Input() backgroundColor: "blue" | "gray" = this.sent ? "blue" : "gray";
    @Input() contactName?: string;
    @Input()
    replyToMessage?: MessageFields;
    @Output() asyncContentLoaded = new EventEmitter();

    interpolatedTemplate: {
        headerText: string;
        headerType: MessageType;
        headerUseMedia: UseMedia;
        bodyText: string;
        footerText: string;
        buttons: TemplateButton[];
    } = {
        headerText: "",
        headerType: MessageType.text,
        headerUseMedia: {},
        bodyText: "",
        footerText: "",
        buttons: [],
    };

    async ngOnInit(): Promise<void> {
        await this.setMessage();
        await this.setTemplate();
        this.asyncContentLoaded.emit();
    }

    async setMessage() {
        if (!this.message) return;
        if (!(this.message.receiver_data || this.message.sender_data)) return;

        const messageId =
            this.message?.receiver_data?.context?.id ||
            this.message?.sender_data?.context?.message_id ||
            this.messageDataPipe.transform(this.message).reaction?.message_id;
        if (!messageId) return;

        const messages = await this.messageController.getWamId(messageId);
        if (!messages.length) return;

        this.replyToMessage = messages[0];
    }

    async setTemplate() {
        if (!this.replyToMessage) return;
        const messageData = this.messageDataPipe.transform(this.replyToMessage);
        if (messageData.type !== "template" || !messageData.template) return;

        const templateName = messageData?.template.name;

        const template = await this.templateStore.getByName(templateName);
        if (!template) return;
        const useTemplate = messageData.template;
        this.interpolatedTemplate = this.templateInterpolator.interpolateTemplate(
            template,
            this.replyToMessage,
            () => {
                return useTemplate;
            },
        );
    }

    get headerUseMediaAsSenderData(): SenderData {
        return {
            type: this.interpolatedTemplate.headerType,
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "",
            [this.interpolatedTemplate.headerType]: this.interpolatedTemplate.headerUseMedia,
        };
    }

    // Add function to set the id as messaging_product_contact.id as query parameter
    setIdAsQueryParam() {
        if (!this.replyToMessage) return;
        this.router.navigate([], {
            queryParams: {
                mode: "chat",
                "message.id": this.replyToMessage.id,
                "message.created_at": this.replyToMessage.created_at,
            },
            queryParamsHandling: "merge",
            preserveFragment: true,
        });
    }
}
