import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-file-upload",
    imports: [CommonModule, MatIconModule],
    templateUrl: "./file-upload.component.html",
    styleUrl: "./file-upload.component.scss",
    standalone: true,
})
export class FileUploadComponent {
    @Output() change = new EventEmitter<Event>();
    @Input() acceptedFormats?: string = "";
    uploadedFileName: string | null = null;

    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) this.uploadedFileName = input.files[0].name;
        else this.uploadedFileName = null;

        this.change.emit(event);
    }

    clearFile(input: HTMLInputElement) {
        input.value = "";
        this.uploadedFileName = null;
        this.change.emit(new Event("clear"));
    }
}
