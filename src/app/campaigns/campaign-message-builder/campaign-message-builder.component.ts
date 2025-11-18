import { Component, EventEmitter, Output, ViewChild } from "@angular/core";
import { CampaignMessageControllerService } from "../../../core/campaign/controller/campaign-message-controller.service";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import * as Papa from "papaparse";
import { TimeoutErrorModalComponent } from "../../common/timeout-error-modal/timeout-error-modal.component";
import { FileUploadComponent } from "../../common/file-upload/file-upload.component";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "app-campaign-message-builder",
    imports: [
        CommonModule,
        FormsModule,
        MatTooltipModule,
        TimeoutErrorModalComponent,
        FileUploadComponent,
    ],
    templateUrl: "./campaign-message-builder.component.html",
    styleUrl: "./campaign-message-builder.component.scss",
    standalone: true,
})
export class CampaignMessageBuilderComponent {
    campaignId?: string;
    selectedFile?: File;
    error?: string;
    successes: number = 0;
    errors: number = 0;
    uploadFileType: "json" | "csv" = "csv";

    @Output("messagesAdded") messagesAdded = new EventEmitter();
    @ViewChild("errorModal") errorModal!: TimeoutErrorModalComponent;

    constructor(
        private campaignMessagesController: CampaignMessageControllerService,
        private route: ActivatedRoute,
        private logger: NGXLogger,
    ) {}

    async ngOnInit(): Promise<void> {
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async params => {
            const campaignId = params["campaign.id"];
            if (campaignId !== this.campaignId) {
                this.campaignId = campaignId;
            }
        });
    }

    async onFileSelected(event: Event) {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length <= 0) return (this.selectedFile = undefined);

        this.selectedFile = target.files[0];
        this.successes = 0;
        this.errors = 0;
    }

    cancel() {
        this.selectedFile = undefined;
        this.successes = 0;
        this.errors = 0;
    }

    // Existing readFile function
    async readFile(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const content = event.target.result;
                    resolve(JSON.parse(content));
                } catch (err) {
                    this.handleErr("Failed to read file", err);
                    reject(err);
                }
            };
            reader.onerror = () => {
                reject("Error reading file");
            };
            reader.readAsText(file);
        });
    }

    // Helper function to unflatten objects with dot notation keys, parsing arrays from JSON strings
    unflattenObject(data: any): any {
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const keys = key.split(".");
                keys.reduce((acc, part, index) => {
                    if (index === keys.length - 1) {
                        const value = data[key];
                        // Attempt to parse JSON strings to reconstruct arrays
                        try {
                            const parsed = JSON.parse(value);
                            acc[part] = Array.isArray(parsed) ? parsed : parsed;
                        } catch {
                            acc[part] = value;
                        }
                    } else {
                        if (!acc[part]) {
                            acc[part] = {};
                        }
                        return acc[part];
                    }
                }, result);
            }
        }
        return result;
    }

    async add() {
        this.error = ""; // Reset error
        this.successes = 0;
        this.errors = 0;

        if (!this.selectedFile) {
            this.error = "Please select a file.";
            return;
        }
        if (!this.campaignId) {
            this.error = "Campaign ID is required.";
            return;
        }

        switch (this.uploadFileType) {
            case "json":
                try {
                    const jsonData = await this.readFile(this.selectedFile);
                    if (!jsonData) {
                        this.error = "Invalid file format.";
                        return;
                    } else if (!Array.isArray(jsonData)) {
                        this.error = "Invalid file format. JSON must be an array.";
                        return;
                    }
                    await Promise.all(
                        jsonData.map(async (data: any) => {
                            if (!data.to) {
                                this.errors++;
                                return;
                            }
                            try {
                                await this.campaignMessagesController.create({
                                    campaign_id: this.campaignId as string,
                                    sender_data: {
                                        messaging_product: "whatsapp",
                                        recipient_type: "individual",
                                        ...data,
                                    },
                                });
                                this.successes++;
                            } catch {
                                this.errors++;
                            }
                        }),
                    );
                } catch (err) {
                    this.handleErr("Error parsing JSON file.", err);
                    return;
                }
                break;

            case "csv":
                try {
                    const csvContent = await this.readFileAsText(this.selectedFile);
                    const parsed = Papa.parse(csvContent, {
                        header: true,
                        skipEmptyLines: true,
                    });

                    if (parsed.errors.length > 0) {
                        this.logger.error("Parsing errors:", parsed.errors);
                        this.error = "Error parsing CSV file.";
                        return;
                    }

                    const jsonData = parsed.data as any[];

                    if (!Array.isArray(jsonData)) {
                        this.error = "Invalid CSV format.";
                        return;
                    }

                    // Unflatten each object if necessary
                    const processedData = jsonData.map(item => {
                        const unflatten = this.unflattenObject(item);
                        unflatten.to = `${unflatten.to}`;
                        return unflatten;
                    });

                    await Promise.all(
                        processedData.map(async (data: any) => {
                            if (!data.to) {
                                this.errors++;
                                return;
                            }
                            try {
                                await this.campaignMessagesController.create({
                                    campaign_id: this.campaignId as string,
                                    sender_data: {
                                        messaging_product: "whatsapp",
                                        recipient_type: "individual",
                                        ...data,
                                    },
                                });
                                this.successes++;
                            } catch {
                                this.errors++;
                            }
                        }),
                    );
                } catch (err) {
                    this.handleErr("Error processing CSV file.", err);
                    return;
                }
                break;

            default:
                this.error = "Unsupported file type.";
                return;
        }

        this.messagesAdded.emit();
    }

    // Helper function to read file as text (for CSV)
    readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: any) => {
                resolve(event.target.result);
            };
            reader.onerror = () => {
                reject("Error reading file");
            };
            reader.readAsText(file);
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
