import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from "@angular/core";
import { MessageType } from "../../../core/message/model/message-type.model";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "app-message-type-selector",
    imports: [CommonModule, MatIconModule],
    templateUrl: "./message-type-selector.component.html",
    styleUrl: "./message-type-selector.component.scss",
    standalone: true,
})
export class MessageTypeSelectorComponent {
    private elementRef = inject(ElementRef);
    private logger = inject(NGXLogger);

    MessageType = MessageType;

    @Input() messageType!: MessageType | "raw";
    @Output() selectedType = new EventEmitter<MessageType | "raw">();
    @Output() close = new EventEmitter<void>();

    selectType(type: MessageType | "raw") {
        this.logger.debug("Selected type", type);
        this.messageType = type;
        this.selectedType.emit(type);
    }

    //Shortcuts
    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent) {
        const clickedInside = this.elementRef.nativeElement.contains(event.target);
        if (!clickedInside) this.close.emit();
    }
    @HostListener("window:keydown.shift.escape", ["$event"])
    private closeOnShiftEscape(event: KeyboardEvent) {
        event.preventDefault();
        this.close.emit();
    }
}
