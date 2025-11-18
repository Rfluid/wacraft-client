import { Component, EventEmitter, Input, Output, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CampaignGatewayService } from "../../../core/campaign/gateway/campaign-gateway.service";
import { CampaignResults } from "../../../core/campaign/model/campaign-results.model";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    NgApexchartsModule,
    ApexTheme,
    ApexFill,
    ApexLegend,
    ApexYAxis,
    ApexTitleSubtitle,
} from "ng-apexcharts";
import { LocalSettingsService } from "../../local-settings.service";
import { ThemeMode } from "../../../core/common/model/theme-modes.model";

@Component({
    selector: "app-send-campaign",
    imports: [MatProgressSpinnerModule, CommonModule, NgApexchartsModule],
    templateUrl: "./send-campaign.component.html",
    styleUrl: "./send-campaign.component.scss",
    standalone: true,
})
export class SendCampaignComponent implements OnInit {
    // @ViewChild("chart") chart!: ChartComponent;

    campaignId?: string;
    @Input() total = 0;
    batchSize: number = this.total;
    sent = 0;
    errors = 0;
    success = 0;

    loading = false;
    sending = false;

    @Output() done = new EventEmitter<void>();

    constructor(
        private campaignGateway: CampaignGatewayService,
        private route: ActivatedRoute,
        private localSettings: LocalSettingsService,
    ) {}

    async ngOnInit(): Promise<void> {
        const themeMode = this.localSettings.themeMode;
        this.chartOptions.theme.mode = themeMode === ThemeMode.system ? undefined : themeMode;
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(async params => {
            this.loading = true;

            const campaignId = params["campaign.id"];
            if (campaignId !== this.campaignId) {
                this.campaignId = campaignId;
                this.total = 0;
                this.batchSize = 0;
                this.sent = 0;
                this.errors = 0;
                this.success = 0;
                this.setChartSeries();
                this.campaignGateway.connectToCampaign(campaignId);

                this.campaignGateway.watchCampaign(
                    (result: CampaignResults) => {
                        if (!result?.total) {
                            this.loading = false;
                            return;
                        }

                        this.sending = true;

                        this.total = result.total;
                        this.batchSize = result.total;
                        this.sent = result.sent;
                        this.errors = result.errors;
                        this.success = result.successes;
                        this.setChartSeries();

                        if (this.total === this.sent) {
                            this.sending = false;
                            this.done.emit();
                        }
                    },
                    (result: string) => {
                        switch (result) {
                            case "not sending":
                                this.sending = false;
                                this.done.emit();
                                break;
                            case "sending":
                                this.sending = true;
                                break;
                        }
                    },
                );
            }

            this.loading = false;
        });
    }

    send() {
        this.sending = true;
        this.campaignGateway.send();
    }

    cancel() {
        this.campaignGateway.cancel();
    }

    chartOptions: {
        chart: ApexChart;
        theme: ApexTheme;
        series: ApexAxisChartSeries;
        fill: ApexFill;
        xaxis: ApexXAxis;
        yaxis: ApexYAxis;
        legend: ApexLegend;
        title: ApexTitleSubtitle;
    } = {
        chart: {
            height: 350,
            type: "bar",
            stacked: true,
            toolbar: {
                show: true,
            },
            zoom: {
                enabled: true,
            },
            background: "rgba(255, 255, 255, 0)",
        },
        theme: {
            mode: "dark",
        },
        series: [
            {
                name: "Total in the batch",
                data: [0, this.batchSize, 0],
                color: "#CCC",
            },
            {
                name: "Handled",
                data: [0, 0, this.sent],
                color: "#1E40AF",
            },
            {
                name: "Errors",
                data: [this.errors, 0, 0],
                color: "#FF3333",
            },
            {
                name: "Successes",
                data: [this.success, 0, 0],
                color: "#33FF33",
            },
        ],
        xaxis: {
            categories: ["Results", "Total", "Handled"],
        },
        yaxis: {
            max: this.batchSize,
        },
        legend: {
            position: "right",
            offsetY: 40,
        },
        fill: {
            opacity: 1,
        },
        title: {
            text: "Campaign progress",
        },
    };
    setChartSeries() {
        this.chartOptions.yaxis.max = this.batchSize;
        this.chartOptions.series = [
            {
                name: "Total in the batch",
                data: [0, this.batchSize, 0],
                color: "#CCC",
            },
            {
                name: "Handled",
                data: [0, 0, this.sent],
                color: "#1E40AF",
            },
            {
                name: "Errors",
                data: [this.errors, 0, 0],
                color: "#FF3333",
            },
            {
                name: "Successes",
                data: [this.success, 0, 0],
                color: "#33FF33",
            },
        ];
    }
}
