import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SmallButtonComponent } from "../../common/small-button/small-button.component";
import { WebhookLogFields } from "../../../core/webhook/entity/webhook-log.entity";
import { DateOrder, DateOrderEnum } from "../../../core/common/model/date-order.model";
import { WebhookLogsControllerService } from "../../../core/webhook/controller/webhook-logs-controller.service";
import { Paginate } from "../../../core/common/model/paginate.model";
import { WhereDate } from "../../../core/common/model/where-date.model";
import { NGXLogger } from "ngx-logger";
import { NgxJsonViewerModule } from "ngx-json-viewer";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";

@Component({
    selector: "app-webhook-logs",
    imports: [CommonModule, FormsModule, SmallButtonComponent, NgxJsonViewerModule, TimeoutErrorModalComponent],
    templateUrl: "./webhook-logs.component.html",
    styleUrl: "./webhook-logs.component.scss",
    standalone: true,
})
export class WebhookLogsComponent implements OnInit {
    @ViewChild("scrollAnchor", { static: false }) scrollAnchor!: ElementRef;

    webhookId?: string;
    logs: WebhookLogFields[] = [];
    limit: number = 20;
    isLoading: boolean = false;
    reachedEnd: boolean = false;
    expandedLogIndex: number | null = null; // Tracks the expanded log
    getPromise: Promise<void> = Promise.resolve();

    // Filters
    httpResponseCode?: number;
    createdAtGte?: string;
    createdAtLte?: string;
    dateOrder: DateOrderEnum = DateOrderEnum.desc;

    DateOrderEnum = DateOrderEnum; // For template access

    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    constructor(
        private whLogsController: WebhookLogsControllerService,
        private route: ActivatedRoute,
        private logger: NGXLogger,
    ) {}

    async ngOnInit(): Promise<void> {
        this.watchQueryParams();
        await this.getPromise.then(() => {
            this.getPromise = this.loadLogs();
        });
    }

    // Toggle expand/collapse of a specific log entry
    toggleExpand(index: number): void {
        this.expandedLogIndex = this.expandedLogIndex === index ? null : index;
    }

    // Load logs with infinite scroll and filters
    async loadLogs(): Promise<void> {
        if (this.isLoading || this.reachedEnd) return; // Prevent multiple triggers while loading

        this.isLoading = true;

        try {
            const query = {
                webhook_id: this.webhookId,
                http_response_code: this.httpResponseCode,
            };
            const pagination: Paginate = {
                limit: this.limit,
                offset: this.logs.length,
            };
            const order: DateOrder = { created_at: this.dateOrder };
            const whereDate: WhereDate = {
                created_at_geq: this.createdAtGte ? new Date(this.createdAtGte) : undefined,
                created_at_leq: this.createdAtLte ? new Date(this.createdAtLte) : undefined,
            };

            const newLogs = await this.whLogsController.get(query, pagination, order, whereDate);
            if (newLogs.length < this.limit) {
                this.reachedEnd = true; // No more data to load
            }

            this.logs = [...this.logs, ...newLogs]; // Append new logs
        } catch (error) {
            this.handleErr("Error loading webhook logs", error);
        } finally {
            this.isLoading = false;
        }
    }

    // Apply filters and reset the logs list
    async applyFilters(): Promise<void> {
        this.logs = []; // Clear existing logs
        this.reachedEnd = false; // Reset pagination
        await this.loadLogs();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async (params) => {
            const webhookId = params["webhook.id"];
            if (webhookId !== this.webhookId) {
                this.webhookId = webhookId;
                this.logs = []; // Reset logs when changing webhook
                this.reachedEnd = false;
                await this.loadLogs();
            }
        });
    }
    // Clear all filter inputs
    clearFilters(): void {
        this.httpResponseCode = undefined;
        this.createdAtGte = undefined;
        this.createdAtLte = undefined;
        this.dateOrder = DateOrderEnum.desc;

        this.applyFilters(); // Reapply filters after clearing
    }

    // Format JSON data for display with indentation
    formatJson(data: any): string {
        return data ? JSON.stringify(data, null, 4) : "null";
    }

    onScroll(event: Event): void {
        const element = event.target as HTMLElement;
        if (
            // Check if the user has scrolled to the bottom of the element
            !(
                (element.scrollHeight - element.scrollTop <= element.clientHeight + 100)
                // Check if some request is being performed
            ) ||
            this.isLoading
        )
            return;

        this.getPromise.then(() => {
            this.getPromise = this.loadLogs();
        });
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
