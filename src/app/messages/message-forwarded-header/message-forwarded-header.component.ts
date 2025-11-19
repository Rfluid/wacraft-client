import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReceivedContext } from "../../../core/message/model/received-context.model";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-message-forwarded-header",
    imports: [CommonModule, MatIconModule],
    templateUrl: "./message-forwarded-header.component.html",
    styleUrl: "./message-forwarded-header.component.scss",
    standalone: true,
})
export class MessageForwardedHeaderComponent {
    @Input() context?: ReceivedContext;
}
