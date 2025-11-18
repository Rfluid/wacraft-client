import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren, inject } from "@angular/core";
import {
    Conversation,
    ConversationMessagingProductContact,
} from "../../../core/message/model/conversation.model";
import { DateOrderEnum } from "../../../core/common/model/date-order.model";
import { CommonModule } from "@angular/common";
import { ConversationControllerService } from "../../../core/message/controller/conversation-controller.service";
import { ActivatedRoute } from "@angular/router";
import { LocalSettingsService } from "../../local-settings.service";
import { UserConversationsStoreService } from "../../../core/message/store/user-conversations-store.service";
import { Subject } from "rxjs";
import { ConversationMessageComponent } from "../../messages/conversation-message/conversation-message.component";
import { TypingBalloonComponent } from "../../messages/typing-balloon/typing-balloon.component";
import { NGXLogger } from "ngx-logger";
import { SenderData } from "../../../core/message/model/sender-data.model";
import { KeyboardNavigableList } from "../../common/keyboard/keyboard-navigable-list.base";

@Component({
    selector: "app-conversation-body",
    imports: [CommonModule, ConversationMessageComponent, TypingBalloonComponent],
    templateUrl: "./conversation-body.component.html",
    styleUrl: "./conversation-body.component.scss",
    standalone: true,
})
export class ConversationBodyComponent extends KeyboardNavigableList implements OnInit {
    private conversationController = inject(ConversationControllerService);
    private localSettings = inject(LocalSettingsService);
    private route = inject(ActivatedRoute);
    userConversationStore = inject(UserConversationsStoreService);
    private logger = inject(NGXLogger);

    private scrollingUp = false;
    private scrollingDown = false;

    @ViewChild("mainList") mainList!: ElementRef;

    @Input()
    messagingProductContact!: ConversationMessagingProductContact;
    @Input() contactName!: string;
    @Input() isTyping = false;

    @Output() reply = new EventEmitter<Conversation>();
    @Output() reactionSent = new EventEmitter<SenderData>();

    constructor() {
        super(undefined, ";");
    }

    async ngOnInit(): Promise<void> {
        await this.userConversationStore.initConditionally(
            this.route,
            this.messagingProductContact.id,
        );

        const sub = this.userConversationStore.newBottomMessageFromConversations.get(
            this.messagingProductContact.id,
        ) as Subject<Conversation>;
        sub.subscribe(_ => {
            this.scrollIfAtBottom();
        });

        this.watchQueryParams();
    }

    async getTopConversations(): Promise<void> {
        this.logger.debug("Getting top conversations");
        this.scrollingUp = true;

        await this.userConversationStore.getTop(this.messagingProductContact.id);
        // this.restoreScrollPosition();

        this.scrollingUp = false;
    }

    async getBottomConversations(): Promise<void> {
        this.logger.debug("Getting bottom conversations");
        this.scrollingDown = true;

        await this.userConversationStore.getBottom(this.messagingProductContact.id);

        this.scrollingDown = false;
    }

    scrollIfAtBottom(): void {
        const element = this.mainList.nativeElement;
        const isAtBottom = element.offsetHeight + element.scrollTop >= element.scrollHeight - 5;

        if (isAtBottom) this.scrollToBottom();
    }

    scrollToBottom(): void {
        // Scroll to the bottom of the chatFeed element
        this.mainList.nativeElement.scroll({
            top: this.mainList.nativeElement.scrollHeight,
            left: 0,
        });
    }

    async onScroll(event: Event) {
        const element = event.target as HTMLElement;
        // For column-reverse, scrollTop === 0 means visual bottom
        const isNearToVisualBottom = Math.abs(element.scrollTop) <= 100;
        const isNearToVisualTop =
            element.clientHeight - element.scrollTop >= // Use - element.scrollTop because of column-reverse (it makes this variable negative)
            element.scrollHeight - 100;
        if (
            isNearToVisualTop &&
            !(await this.userConversationStore.getReachedMaxLimit(
                this.messagingProductContact.id,
            )) &&
            !this.scrollingUp
        )
            return await this.getTopConversations();

        if (
            (await this.userConversationStore.getOffset(this.messagingProductContact.id)) !== 0 &&
            isNearToVisualBottom &&
            !this.scrollingDown
        )
            return await this.getBottomConversations();

        return;
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async params => {
            // Getting parameters
            const messagingProductContactId = params["messaging_product_contact.id"];
            if (
                !messagingProductContactId ||
                messagingProductContactId != this.messagingProductContact.id
            )
                return;
            const messageId = params["message.id"];
            const createdAt = params["message.created_at"];

            // Handling mark as read
            if (this.localSettings.autoMarkAsRead)
                this.userConversationStore.markAsRead(messagingProductContactId);

            // The case where we are not searching for a specific message
            if (!messageId && !createdAt) {
                if (
                    // If the history is empty, we need to load the top conversations
                    (this.userConversationStore.messageHistory.get(this.messagingProductContact.id)
                        ?.length || 0) === 0
                )
                    return await this.getTopConversations();
                if (
                    // If we have an offset, we need to clear it, clear the history and load the top conversations
                    await this.userConversationStore.getOffset(messagingProductContactId)
                ) {
                    await Promise.all([
                        this.userConversationStore.setOffset(messagingProductContactId, 0),
                        this.userConversationStore.resetHistory(this.messagingProductContact.id),
                    ]);
                    return await this.getTopConversations();
                }
            }

            // When searching for a specific message
            await Promise.all([
                this.userConversationStore.setOffset(
                    messagingProductContactId,
                    (await this.conversationController.countByMessagingProductContact(
                        this.messagingProductContact.id,
                        undefined,
                        undefined,
                        { created_at: DateOrderEnum.desc },
                        { created_at_geq: new Date(createdAt) },
                    )) +
                        this.userConversationStore.paginationLimit -
                        1,
                ),
                this.userConversationStore.resetHistory(this.messagingProductContact.id),
            ]);

            return await this.getBottomConversations();
        });
    }

    public selectedMessages: Conversation[] = [];
    appendMessage(message: Conversation) {
        this.selectedMessages = [...this.selectedMessages, message];
    }
    removeMessage(messageId: string) {
        this.selectedMessages = this.selectedMessages.filter(m => m.id !== messageId);
    }
    toggleSelection(message: Conversation) {
        const messageId = message.id;
        const selected = this.selectedMessages.some(m => m.id === messageId);
        if (!selected) return this.appendMessage(message);
        this.removeMessage(messageId);
    }
    isMessageSelected(message: Conversation): boolean {
        return this.selectedMessages.some(m => m.id === message.id);
    }
    clickMessage(message: Conversation) {
        if (!this.selectedMessages.length) return;
        this.toggleSelection(message);
    }
    public clearSelectedMessages() {
        this.selectedMessages = [];
    }

    // Flag to prevent multiple adjustments
    onAsyncContentLoaded(): void {}

    @ViewChildren(ConversationMessageComponent, { read: ElementRef })
    protected rows!: QueryList<ElementRef<HTMLElement>>;

    protected onEnter(i: number) {}
}
