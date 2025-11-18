import { Component, ElementRef, HostBinding, HostListener, Input, ViewChild, OnInit, inject } from "@angular/core";
import { CampaignFields } from "../../../../core/campaign/entity/campaign.entity";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-campaign-preview",
    imports: [CommonModule, RouterModule],
    templateUrl: "./campaign-preview.component.html",
    styleUrl: "./campaign-preview.component.scss",
    standalone: true,
})
export class CampaignPreviewComponent implements OnInit {
    private route = inject(ActivatedRoute);

    @Input() campaign!: CampaignFields;

    isSelected = false;

    ngOnInit() {
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(params => {
            this.isSelected = params["campaign.id"] === this.campaign.id;
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
