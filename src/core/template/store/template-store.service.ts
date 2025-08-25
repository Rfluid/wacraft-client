import { Injectable } from "@angular/core";
import { TemplateControllerService } from "../controller/template-controller.service";
import { Template } from "../model/template.model";
import { TemplateQueryParams } from "../model/template-query-params.model";
import { TemplateSummary } from "../model/template-summary.model";
import { MutexSwapper } from "../../synch/mutex-swapper/mutex-swapper";

@Injectable({
    providedIn: "root",
})
export class TemplateStoreService {
    public searchValue: string = "";
    private templatesPaginationLimit: number = 15;
    private nextAfterTemplate?: string;
    private nextAfterTemplateSearch?: string;

    private templateMutexSwapper = new MutexSwapper<string>();

    public searchMode: "name" | "category" | "language" | "content" = "name";

    public searchFilters: {
        text: string;
        query?: TemplateQueryParams;
    }[] = [];

    public templates: Template[] = [];
    public searchTemplates: Template[] = [];

    public isExecuting = false;
    public pendingExecution = false;

    public templatesByName = new Map<string, Template>();

    constructor(private templateController: TemplateControllerService) {}

    async getByName(templateName: string): Promise<Template> {
        await this.templateMutexSwapper.acquire(templateName);
        const template = this.templatesByName.get(templateName);
        if (template) {
            await this.templateMutexSwapper.release(templateName);
            return template;
        }
        const newTemplate = (
            await this.templateController.get({
                name: templateName,
                limit: 1,
            })
        ).data[0];
        this.templatesByName.set(templateName, newTemplate);
        await this.templateMutexSwapper.release(templateName);
        return newTemplate;
    }

    async get(): Promise<void> {
        const data = await this.templateController.get({
            limit: this.templatesPaginationLimit,
            after: this.nextAfterTemplate,
            summary: [TemplateSummary.total_count],
        });
        const templates = data.data;
        if (
            !data.summary?.total_count ||
            (data.summary?.total_count && this.templates.length >= data?.summary?.total_count)
        )
            return;
        this.nextAfterTemplate = data.paging.cursors.after;

        await this.addTemplates(templates);
    }

    async addTemplates(templates: Template[]) {
        await this.addTemplatesToTemplatesByName(templates);
        this.templates = [...this.templates, ...templates];
    }

    async getSearchTemplates(): Promise<void> {
        const data = await this.templateController.get({
            limit: this.templatesPaginationLimit,
            after: this.nextAfterTemplateSearch,
            [this.searchMode]: this.searchValue,
            summary: [TemplateSummary.total_count],
        });
        const templates = data.data;
        if (
            !data.summary?.total_count ||
            (data.summary?.total_count && this.searchTemplates.length >= data?.summary?.total_count)
        ) {
            return;
        }

        this.nextAfterTemplateSearch = data.paging.cursors.after;

        await this.addSearchTemplates(templates);
    }

    async addSearchTemplates(templates: Template[]) {
        await this.addTemplatesToTemplatesByName(templates);
        this.searchTemplates = [...this.searchTemplates, ...templates];
    }

    async getInitialSearchTemplates(): Promise<void> {
        this.searchTemplates = [];

        const data = await this.templateController.get({
            [this.searchMode]: this.searchValue,
            limit: this.templatesPaginationLimit,
            summary: [TemplateSummary.total_count],
        });
        const templates = data.data;
        if (
            !data.summary?.total_count ||
            (data.summary?.total_count && this.searchTemplates.length >= data?.summary?.total_count)
        )
            return;
        this.nextAfterTemplateSearch = data.paging.cursors.after;

        await this.addSearchTemplates(templates);
    }

    async addFilter(filter: { text: string; query?: TemplateQueryParams }) {
        this.searchFilters.push(filter);
        await this.getInitialSearchTemplates();
    }

    async removeFilter(filter: { text: string; query?: TemplateQueryParams }) {
        this.searchFilters = this.searchFilters.filter(
            searchFilter => searchFilter.text !== filter.text,
        );
        await this.getInitialSearchTemplates();
    }

    getInitialSearchTemplatesConcurrent() {
        if (!this.searchValue) return;

        if (this.isExecuting) {
            // If an execution is already in progress, mark that another execution is pending
            if (!this.pendingExecution) this.pendingExecution = true;
            // Do nothing else to prevent multiple queues
            return;
        }

        // No execution is in progress, so start one
        this.isExecuting = true;

        this.getInitialSearchTemplates()
            .then(() => {
                // Execution finished
                this.isExecuting = false;

                // If there's a pending execution, reset the flag and execute again
                if (this.pendingExecution) {
                    this.pendingExecution = false;
                    this.getInitialSearchTemplatesConcurrent();
                }
            })
            .catch(error => {
                this.isExecuting = false;

                // Even if there's an error, check for pending execution
                if (this.pendingExecution) {
                    this.pendingExecution = false;
                    this.getInitialSearchTemplatesConcurrent();
                }
            });
    }

    async addTemplatesToTemplatesByName(templates: Template[]) {
        templates.forEach(async template => {
            await this.templateMutexSwapper.acquire(template.name);
            this.templatesByName.set(template.name, template);
            await this.templateMutexSwapper.release(template.name);
        });
    }
}
