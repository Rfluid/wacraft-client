import { CommonModule } from "@angular/common";
import { Component, EventEmitter, HostListener, OnInit, Output, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ConversationComponent } from "./conversation/conversation.component";
import { ConversationMessagingProductContact } from "../../core/message/model/conversation.model";
import { MessagingProductContactControllerService } from "../../core/messaging-product/controller/messaging-product-contact-controller.service";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "app-conversations",
    imports: [CommonModule, ConversationComponent],
    templateUrl: "./conversations.component.html",
    styleUrl: "./conversations.component.scss",
    standalone: true,
})
export class ConversationsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private messagingProductController = inject(MessagingProductContactControllerService);
    private router = inject(Router);
    private logger = inject(NGXLogger);

    @Output() searchAtContactId = new EventEmitter<string>();

    messagingProductContacts: ConversationMessagingProductContact[] = [];

    currentMessagingProductContactId = "";

    async ngOnInit() {
        const mpcId = this.route.snapshot.queryParamMap.get("messaging_product_contact.id");
        if (!mpcId) return;
        const mpc = (
            await this.messagingProductController.getWhatsAppContacts(
                { id: mpcId },
                { limit: 1, offset: 0 },
            )
        )[0];
        if (!mpc) return;
        this.getCurrentMessagingProductContactId(mpc);
    }

    // Adds id to the map if it doesn't exist
    addId(params: ConversationMessagingProductContact) {
        if (!this.messagingProductContacts.some(contact => contact.id === params.id))
            this.messagingProductContacts.push(params);
    }

    // Get current mesaging product id
    getCurrentMessagingProductContactId(params: ConversationMessagingProductContact) {
        const paramValue = params.id;

        if (!paramValue) return;

        this.currentMessagingProductContactId = paramValue;
        this.addId(params);
    }

    /** Close / clean-up when Esc is pressed */
    @HostListener("document:keydown.escape")
    private removeQueryParam(): void {
        this.logger.debug("Closing from conversations...");
        this.router.navigate(
            [], // keep current URL
            {
                relativeTo: this.route,
                queryParams: {
                    // null → “delete”
                    ["messaging_product_contact.id"]: null,
                    ["template.name"]: null,
                    ["campaign.id"]: null,
                },
                preserveFragment: true,
                queryParamsHandling: "merge", // leave the rest intact
            },
        );
    }
}
