import { Component, HostListener } from "@angular/core";
import { QueryParamsService } from "../../core/navigation/service/query-params.service";
import { SidebarComponent } from "../common/sidebar/sidebar.component";
import { CommonModule } from "@angular/common";
import { RoutePath } from "../app.routes";
import { WebhookSidebarComponent } from "./webhook-sidebar/webhook-sidebar.component";
import { WebhookDetailsComponent } from "./webhook-details/webhook-details.component";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
    selector: "app-webhooks",
    imports: [CommonModule, SidebarComponent, WebhookSidebarComponent, WebhookDetailsComponent],
    templateUrl: "./webhooks.component.html",
    styleUrl: "./webhooks.component.scss",
    standalone: true,
})
export class WebhooksComponent {
    RoutePath = RoutePath;

    constructor(
        public queryParamsService: QueryParamsService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    /** Close / clean-up when Esc is pressed */
    @HostListener("window:keydown.escape")
    private removeQueryParam(): void {
        this.router.navigate(
            [], // keep current URL
            {
                relativeTo: this.route,
                queryParams: {
                    // null → “delete”
                    ["webhook.id"]: null,
                },
                preserveFragment: true,
                queryParamsHandling: "merge", // leave the rest intact
            },
        );
    }
}
