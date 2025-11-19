import { Component, Input } from "@angular/core";
import { ContactData } from "../../../core/message/model/contact-data.model";
import { MessageContactsModalComponent } from "../message-contacts-modal/message-contacts-modal.component";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-message-contacts-content",
    imports: [MessageContactsModalComponent, CommonModule],
    templateUrl: "./message-contacts-content.component.html",
    styleUrl: "./message-contacts-content.component.scss",
    standalone: true,
})
export class MessageContactsContentComponent {
    @Input() contacts!: ContactData[];

    modalVisible = false;
    openModal() {
        this.modalVisible = true;
    }
    closeModal() {
        this.modalVisible = false;
    }
}
