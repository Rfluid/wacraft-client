import { Component, ElementRef, HostBinding, HostListener, Input, ViewChild } from "@angular/core";
import { Template } from "../../../core/template/model/template.model";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
    selector: "app-template-preview",
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: "./template-preview.component.html",
    styleUrl: "./template-preview.component.scss",
    standalone: true,
})
export class TemplatePreviewComponent {
    @Input("template") template!: Template;

    isSelected: boolean = false;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.watchQueryParams();
    }

    watchQueryParams() {
        this.route.queryParams.subscribe(params => {
            this.isSelected = params["template.name"] === this.template.name;
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
