import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Template } from "../../../core/template/model/template.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TemplateMessageBuilderComponent } from "../template-message-builder/template-message-builder.component";
import { TemplateStoreService } from "../../../core/template/store/template-store.service";
import { MatIconModule } from "@angular/material/icon";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "app-template-details",
    imports: [CommonModule, FormsModule, TemplateMessageBuilderComponent, MatIconModule, TimeoutErrorModalComponent],
    templateUrl: "./template-details.component.html",
    styleUrl: "./template-details.component.scss",
    standalone: true,
})
export class TemplateDetailsComponent implements OnInit {
    template?: Template;
    templateName?: string;

    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    constructor(
        private templateStore: TemplateStoreService,
        private route: ActivatedRoute,
        private logger: NGXLogger,
    ) {}

    ngOnInit(): void {
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async (params) => {
            const templateName = params["template.name"];
            if (!(templateName != this.templateName)) return await this.loadTemplate();
            this.templateName = templateName;
            return await this.loadTemplate();
        });
    }

    async loadTemplate() {
        if (!this.templateName) return (this.template = undefined);
        try {
            this.template = await this.templateStore.getByName(this.templateName);
        } catch (error) {
            this.handleErr("Error loading template", error);
            return;
        }
    }

    // Copy the given value to the clipboard
    async copyToClipboard(value?: string) {
        if (value) {
            await navigator.clipboard.writeText(value);
        }
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
