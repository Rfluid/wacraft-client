import { Component, ElementRef, EventEmitter, HostListener, Output } from "@angular/core";
import { RouterModule } from "@angular/router";
import {
    contactDetailsQueryParams,
    contactMediaQueryParams,
} from "../constant/query-params.constant";

@Component({
    selector: "app-options",
    imports: [RouterModule],
    templateUrl: "./options.component.html",
    styleUrl: "./options.component.scss",
    standalone: true,
})
export class OptionsComponent {
    @Output() close = new EventEmitter<void>();

    constructor(private elementRef: ElementRef) {}

    contactDetailsQueryParams = contactDetailsQueryParams;

    contactMediaQueryParams = contactMediaQueryParams;

    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent) {
        const clickedInside = this.elementRef.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.close.emit();
        }
    }
}
