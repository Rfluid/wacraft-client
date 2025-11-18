import { Component, Input, OnInit } from "@angular/core";
import { Conversation } from "../../../core/message/model/conversation.model";
import { CommonModule } from "@angular/common";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";
import { MessageType } from "../../../core/message/model/message-type.model";
import { GoogleMapsModule } from "@angular/google-maps";

@Component({
    selector: "app-message-location-content",
    imports: [CommonModule, MessageDataPipe, GoogleMapsModule],
    templateUrl: "./message-location-content.component.html",
    styleUrl: "./message-location-content.component.scss",
    standalone: true,
})
export class MessageLocationContentComponent implements OnInit {
    MessageType = MessageType;

    @Input("message") message!: Conversation;
    @Input("isSent") isSent!: boolean;
    @Input("sent") sent: boolean = true;

    options?: google.maps.MapOptions;
    markerPosition?: google.maps.LatLngLiteral;

    constructor(private messageDataPipe: MessageDataPipe) {}

    ngOnInit() {
        const latitude = this.messageDataPipe.transform(this.message)?.location?.latitude || 0;
        const longitude = this.messageDataPipe.transform(this.message)?.location?.longitude || 0;

        // Set map options
        this.options = {
            center: { lat: latitude, lng: longitude },
            zoom: 16,
        };

        // Set the marker position
        this.markerPosition = { lat: latitude, lng: longitude };
    }
}
