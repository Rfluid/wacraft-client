import { Injectable, inject } from "@angular/core";
import { MessageControllerService } from "../controller/message-controller.service";

@Injectable({
    providedIn: "root",
})
export class MessageStoreService {
    private messageController = inject(MessageControllerService);
}
