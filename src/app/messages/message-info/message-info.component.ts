import { CommonModule } from "@angular/common";
import { Component, HostListener, Input, TemplateRef } from "@angular/core";
import { Conversation } from "../../../core/message/model/conversation.model";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
    selector: "app-message-info",
    imports: [CommonModule, MatIconModule, MatTooltipModule],
    templateUrl: "./message-info.component.html",
    styleUrl: "./message-info.component.scss",
    standalone: true,
})
export class MessageInfoComponent {
    @Input() message!: Conversation;
    @Input() sent = true;

    constructor() {}

    showErrorModal = false;

    get error() {
        return this.message?.statuses?.[0]?.product_data?.errors?.[0] ?? null;
    }

    toggleErrorModal() {
        this.showErrorModal = !this.showErrorModal;
    }

    closeErrorModal() {
        this.showErrorModal = false;
    }

    @HostListener("window:keydown.shift.escape", ["$event"])
    private closeOnShiftEscape(event: KeyboardEvent) {
        event.preventDefault();
        this.closeErrorModal();
    }
}
