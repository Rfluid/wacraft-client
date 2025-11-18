import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { SmallButtonComponent } from "../../common/small-button/small-button.component";
import { MediaPreviewComponent } from "../contact-info/media-preview/media-preview.component";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
    Conversation,
    ConversationMessagingProductContact,
} from "../../../core/message/model/conversation.model";
import { CommonModule } from "@angular/common";
import { MediaMode } from "./enum/media-mode.enum";
import { ConversationControllerService } from "../../../core/message/controller/conversation-controller.service";
import { DateOrderEnum } from "../../../core/common/model/date-order.model";
import { CapitalizeFirstLetterPipe } from "../../../core/common/pipe/capitalize-first-letter.pipe";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";
import { NGXLogger } from "ngx-logger";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";

@Component({
    selector: "app-contact-media",
    imports: [
        CommonModule,
        SmallButtonComponent,
        MediaPreviewComponent,
        CapitalizeFirstLetterPipe,
        RouterModule,
        TimeoutErrorModalComponent,
    ],
    templateUrl: "./contact-media.component.html",
    styleUrl: "./contact-media.component.scss",
    standalone: true,
})
export class ContactMediaComponent implements OnInit {
    MediaMode = MediaMode;
    mediaModes = Object.values(MediaMode) as MediaMode[];

    @Input()
    messagingProductContact!: ConversationMessagingProductContact;

    currentMediaMode: MediaMode = MediaMode.image;

    // Pagination parameters and media content
    mediaLimit = 40;
    media = new Map<MediaMode, Conversation[]>(Object.values(MediaMode).map(value => [value, []])); // Media content
    scrolling = new Map<MediaMode, boolean>(Object.values(MediaMode).map(value => [value, false])); // Scrolling status
    reachedMaxMediaLimit = new Map<MediaMode, boolean>(
        Object.values(MediaMode).map(value => [value, false]),
    );

    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private conversationController: ConversationControllerService,
        private queryParamsService: QueryParamsService,
        private logger: NGXLogger,
    ) {}

    ngOnInit(): void {
        this.watchQueryParams();
    }

    async getMedia(mode: MediaMode) {
        this.scrolling.set(mode, true);

        try {
            // New media
            const newMedia = await this.conversationController.conversationContentLike(
                this.messagingProductContact.id,
                `"type"\\s*:\\s*"(${mode})"`,
                undefined,
                {
                    limit: this.mediaLimit,
                    offset: (this.media.get(mode) as Conversation[])?.length,
                },
                { created_at: DateOrderEnum.desc },
            );
            if (newMedia.length === 0) {
                this.reachedMaxMediaLimit.set(mode, true);
                this.scrolling.set(mode, false);
                return;
            }
            this.media.get(mode)?.push(...newMedia);
        } catch (error) {
            this.handleErr("Error getting media", error);
        } finally {
            this.scrolling.set(mode, false);
        }
    }

    onScroll(event: Event, mode: MediaMode) {
        const element = event.target as HTMLElement;

        if (
            element.scrollHeight - element.scrollTop <= element.clientHeight + 100 &&
            !this.scrolling.get(mode) &&
            !this.reachedMaxMediaLimit.get(mode)
        )
            return this.getMedia(mode);

        return;
    }

    async selectMediaMode(mode: MediaMode) {
        await this.router.navigate([], {
            queryParams: {
                "contact_media.mode": mode,
                ...this.queryParamsService.globalQueryParams,
            },
            queryParamsHandling: "merge",
        });
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async params => {
            const messagingProductContactId = params["messaging_product_contact.id"];
            if (
                !messagingProductContactId ||
                messagingProductContactId != this.messagingProductContact.id ||
                params["mode"] != "contact_media"
            )
                return;
            const currentModeKey = params["contact_media.mode"];
            if (!currentModeKey) return this.selectMediaMode(MediaMode.image);
            const currentModeKeyConverted = currentModeKey as keyof typeof MediaMode;
            const currentMode = MediaMode[currentModeKeyConverted];
            this.currentMediaMode = currentMode;

            if (!this.scrolling.get(currentMode) && !this.reachedMaxMediaLimit.get(currentMode))
                await this.getMedia(currentMode);
            return;
        });
    }

    errorStr = "";
    errorData: any;
    handleErr(message: string, err: any) {
        this.errorData = err?.response?.data;
        this.errorStr = err?.response?.data?.description || message;
        this.logger.error("Async error", err);
        this.errorModal.openModal();
    }
}
