import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
    Conversation,
    ConversationMessagingProductContact,
} from "../../../../core/message/model/conversation.model";
import { MessageDataPipe } from "../../../../core/message/pipe/message-data.pipe";
import { StatusGatewayService } from "../../../../core/status/gateway/status-gateway.service";
import { MessageContentPreviewComponent } from "../../../messages/message-content-preview/message-content-preview.component";

@Component({
    selector: "app-conversation-preview",
    imports: [CommonModule, MessageContentPreviewComponent, MessageDataPipe],
    templateUrl: "./conversation-preview.component.html",
    styleUrl: "./conversation-preview.component.scss",
    standalone: true,
})
export class ConversationPreviewComponent implements OnInit {
    @Input("messagingProductContact")
    messagingProductContact!: ConversationMessagingProductContact;

    @Input("messageId") messageId?: string;
    @Input("lastMessage") lastMessage!: Conversation;
    @Input("date") date!: Date;
    @Input("unread") unread: number = 0;
    @Input("selected") selected: boolean = false;

    @Output("select") select = new EventEmitter<ConversationMessagingProductContact>();
    @Output("unSelect") unSelect = new EventEmitter<ConversationMessagingProductContact>();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private statusGateway: StatusGatewayService,
    ) {}

    async ngOnInit() {}

    handleClick() {
        if (this.selected) {
            this.unSelect.emit(this.messagingProductContact);
            return;
        }
        this.select.emit(this.messagingProductContact);
    }
}
