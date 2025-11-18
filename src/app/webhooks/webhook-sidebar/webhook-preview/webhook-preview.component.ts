import {
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnInit,
    ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Webhook } from "../../../../core/webhook/entity/webhook.entity";

@Component({
    selector: "app-webhook-preview",
    imports: [CommonModule, RouterModule],
    templateUrl: "./webhook-preview.component.html",
    styleUrl: "./webhook-preview.component.scss",
    standalone: true,
})
export class WebhookPreviewComponent implements OnInit {
    @Input("webhook") webhook!: Webhook;

    isSelected: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(params => {
            this.isSelected = params["webhook.id"] === this.webhook.id;
        });
    }

    /* ---------------- focus handling ------------------ */
    /** `ChatsSidebarComponent` toggles this to make just ONE row tabbable */
    @HostBinding("attr.tabindex") tabIndex = -1;
    /** used only for a visual ring */
    @HostBinding("class.focus-ring") isFocused = false;

    /** reference to the root anchor */
    @ViewChild("rootAnchor", { static: true })
    anchor!: ElementRef<HTMLAnchorElement>;

    /** Press Enter or Space ⇒ click the anchor */
    @HostListener("keydown.enter", ["$event"])
    handleKey(e: KeyboardEvent) {
        e.preventDefault(); // avoid page scroll on Space
        this.anchor.nativeElement.click();
    }
}
