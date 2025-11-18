import { CommonModule } from "@angular/common";
import { Component, Input, ViewChild, ContentChild, TemplateRef } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-small-button",
    imports: [CommonModule, MatIconModule],
    templateUrl: "./small-button.component.html",
    styleUrls: ["./small-button.component.scss"],
    standalone: true,
})
export class SmallButtonComponent {
    @Input("src") src: string = "";
    @Input("matIcon") matIcon: string = "";
    @Input("matSymbol") matSymbol: string = "";
    @Input("active") active: boolean = false;
    @Input("width") width: string = "40px";
    @ViewChild("button") button!: HTMLButtonElement;
    @ContentChild(TemplateRef) customContent!: TemplateRef<any>;

    changeActive() {
        this.active = !this.active;
    }
}
