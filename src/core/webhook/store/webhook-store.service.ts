import { Injectable } from "@angular/core";
import { WebhookControllerService } from "../controller/webhook-controller.service";
import { Webhook } from "../entity/webhook.entity";
import { Query } from "../model/query.model";
import { DateOrderEnum } from "../../common/model/date-order.model";
import { NGXLogger } from "ngx-logger";

@Injectable({
    providedIn: "root",
})
export class WebhookStoreService {
    private paginationLimit: number = 15;

    public reachedMaxLimit: boolean = false;
    public reachedMaxSearchLimit: boolean = false;
    currentWebhook!: Webhook;

    searchMode: "url" | "http_method" | "event" = "url";

    searchValue: string = "";
    searchFilters: {
        text: string;
        query?: Query;
    }[] = [];

    webhooks: Webhook[] = [];
    searchWebhooks: Webhook[] = [];
    webhooksById = new Map<string, Webhook>();

    public isExecuting = false;
    public pendingExecution = false;

    constructor(
        private webhookController: WebhookControllerService,
        private logger: NGXLogger,
    ) {}

    async get(): Promise<void> {
        const webhooks = await this.webhookController.get(
            undefined,
            {
                limit: this.paginationLimit,
                offset: this.webhooks.length,
            },
            { created_at: DateOrderEnum.desc },
        );

        if (!webhooks.length) {
            this.reachedMaxLimit = true;
            return;
        }

        this.add(webhooks);
    }

    add(webhooks: Webhook[]) {
        this.addWebhooksToWebhooksById(webhooks);
        this.webhooks = [...this.webhooks, ...webhooks];
    }

    addSearch(webhooks: Webhook[]) {
        this.addWebhooksToWebhooksById(webhooks);
        this.searchWebhooks = [...this.searchWebhooks, ...webhooks];
    }

    getInitialSearchConcurrent() {
        if (!this.searchValue) return;

        if (this.isExecuting) {
            // If an execution is already in progress, mark that another execution is pending
            if (!this.pendingExecution) this.pendingExecution = true;
            // Do nothing else to prevent multiple queues
            return;
        }

        // No execution is in progress, so start one
        this.isExecuting = true;

        this.getInitialSearch()
            .then(() => {
                // Execution finished
                this.isExecuting = false;

                // If there's a pending execution, reset the flag and execute again
                if (this.pendingExecution) {
                    this.pendingExecution = false;
                    this.getInitialSearchConcurrent();
                }
            })
            .catch(error => {
                // Handle errors if necessary
                this.logger.error("Error in getInitialSearchConcurrent:", error);
                this.isExecuting = false;

                // Even if there's an error, check for pending execution
                if (this.pendingExecution) {
                    this.pendingExecution = false;
                    this.getInitialSearchConcurrent();
                }
            });
    }

    async getInitialSearch(): Promise<void> {
        this.searchWebhooks = [];

        const webhooks = await this.webhookController.contentLike(
            `%${this.searchValue}%`,
            this.searchMode,
            this.searchFilters.reduce((acc, filter) => {
                return { ...acc, ...filter.query };
            }, {}),
            {
                limit: this.paginationLimit,
                offset: this.searchWebhooks.length,
            },
            { created_at: DateOrderEnum.desc },
        );

        if (!webhooks.length) {
            this.reachedMaxSearchLimit = true;
            return;
        }

        this.addSearch(webhooks);
    }

    async getSearch(): Promise<void> {
        const webhooks = await this.webhookController.contentLike(
            `%${this.searchValue}%`,
            "url",
            this.searchFilters.reduce((acc, filter) => {
                return { ...acc, ...filter.query };
            }, {}),
            {
                limit: this.paginationLimit,
                offset: this.searchWebhooks.length,
            },
            { created_at: DateOrderEnum.desc },
        );

        if (!webhooks.length) {
            this.reachedMaxSearchLimit = true;
            return;
        }

        this.addSearch(webhooks);
    }

    async addFilter(filter: { text: string; query?: Query }) {
        this.searchFilters.push(filter);
        await this.getInitialSearch();
    }

    async removeFilter(filter: { text: string; query?: Query }) {
        this.searchFilters = this.searchFilters.filter(
            searchFilter => searchFilter.text !== filter.text,
        );
        await this.getInitialSearch();
    }

    async addWebhooksToWebhooksById(webhooks: Webhook[]) {
        webhooks.forEach(u => {
            this.webhooksById.set(u.id, u);
        });
    }

    async getById(id: string): Promise<Webhook> {
        const webhook = this.webhooksById.get(id);
        if (webhook) return webhook;
        const newWebhook = (await this.webhookController.get({ id: id }))[0];
        this.webhooksById.set(id, newWebhook);
        return newWebhook;
    }
}
