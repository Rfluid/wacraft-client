import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from "@angular/core";
import { ConversationHeaderComponent } from "../conversation-header/conversation-header.component";
import { ConversationFooterComponent } from "../conversation-footer/conversation-footer.component";
import { ConversationBodyComponent } from "../conversation-body/conversation-body.component";
import { CommonModule } from "@angular/common";
import { ConversationMessagingProductContact } from "../../../core/message/model/conversation.model";
import { ActivatedRoute } from "@angular/router";
import { UserConversationsStoreService } from "../../../core/message/store/user-conversations-store.service";
import { ContactInfoComponent } from "../../contacts/contact-info/contact-info.component";
import { ContactMediaComponent } from "../../contacts/contact-media/contact-media.component";
import { NGXLogger } from "ngx-logger";
import { MessageActionsFooterComponent } from "../message-actions-footer/message-actions-footer.component";

@Component({
    selector: "app-conversation",
    imports: [
        CommonModule,
        ConversationHeaderComponent,
        ConversationFooterComponent,
        MessageActionsFooterComponent,
        ConversationBodyComponent,
        ContactInfoComponent,
        ContactMediaComponent,
    ],
    templateUrl: "./conversation.component.html",
    styleUrl: "./conversation.component.scss",
    standalone: true,
})
export class ConversationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    userConversationStore = inject(UserConversationsStoreService);
    private logger = inject(NGXLogger);

    @Input()
    messagingProductContact!: ConversationMessagingProductContact;
    @Output()
    searchAtContactId = new EventEmitter<string>();
    @ViewChild("body") body!: ConversationBodyComponent;
    @ViewChild("conversationFooter")
    conversationFooter!: ConversationFooterComponent;

    contactInfoEnabled = false;
    contactMediaEnabled = false;
    isTyping = false;

    onTypingStateChange(isTyping: boolean): void {
        this.isTyping = isTyping;
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const isSelected =
                params["messaging_product_contact.id"] === this.messagingProductContact.id;
            if (!isSelected) {
                return;
            }
            const mode = params["mode"];
            if (!mode || mode === "chat") {
                this.closeContactMedia();
                return this.closeContactInfo();
            }
            this.logger.log(mode);
            if (mode === "contact_info") {
                this.closeContactMedia();
                return this.openContactInfo();
            }
            if (mode === "contact_media") {
                this.closeContactInfo();
                return this.openContactMedia();
            }
            return;
        });
    }

    closeContactInfo() {
        this.contactInfoEnabled = false;
    }

    openContactInfo() {
        this.contactInfoEnabled = true;
    }

    closeContactMedia() {
        this.contactMediaEnabled = false;
    }

    openContactMedia() {
        this.contactMediaEnabled = true;
    }
}
