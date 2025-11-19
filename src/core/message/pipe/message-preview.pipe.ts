import { Pipe, PipeTransform } from "@angular/core";
import { SenderData } from "../model/sender-data.model";
import { ReceiverData } from "../model/receiver-data.model";

@Pipe({
    name: "messagePreview",
    standalone: true,
})
export class MessagePreviewPipe implements PipeTransform {
    transform(data: ReceiverData | SenderData): string {
        let lastMessageText = "";

        switch (data.type) {
            case "text":
                lastMessageText = data?.text?.body || "";
                break;
            case "image":
            case "video":
            case "audio":
            case "sticker":
            case "document":
                lastMessageText = data.type
                    ? data.type.charAt(0).toUpperCase() + data.type.slice(1)
                    : "";
                break;
            case "interactive": {
                const interactiveData = data?.interactive;
                if (!interactiveData) break;
                if (interactiveData.type == "button" || interactiveData.type == "list") {
                    if (interactiveData.header?.text) {
                        lastMessageText = interactiveData.header.text;
                        break;
                    } else if (interactiveData.body?.text) {
                        lastMessageText = interactiveData.body?.text;
                        break;
                    }
                }
                if (interactiveData.type == "button_reply" && interactiveData.button_reply?.title) {
                    lastMessageText = interactiveData.button_reply?.title;
                    break;
                }
                if (interactiveData.type == "list_reply" && interactiveData.list_reply?.title) {
                    lastMessageText = interactiveData.list_reply?.title;
                    break;
                }
                break;
            }
            case "location": {
                const locationData = data?.location;
                if (!locationData) break;
                if (locationData.name) {
                    lastMessageText = locationData.name;
                    break;
                }
                if (locationData.address) {
                    lastMessageText = locationData.address;
                    break;
                }
                lastMessageText = "Location";
                break;
            }
            case "template": {
                const templateData = data?.template;
                if (!templateData) break;
                lastMessageText = templateData.name;
                break;
            }
            case "button": {
                const buttonData = data?.button;
                if (!buttonData) break;
                lastMessageText = buttonData.text || "";
                break;
            }
            case "reaction": {
                const reactionData = data?.reaction;
                if (!reactionData) break;
                lastMessageText = `Reacted with ${reactionData.emoji}`;
                break;
            }
            case "contacts": {
                // console.log("new contact preview");
                const contactsData = data?.contacts;
                if (!contactsData || !contactsData.length) break;
                lastMessageText =
                    (contactsData[0].name?.formatted_name || "") +
                    (contactsData.length > 1
                        ? ` and ${contactsData.length - 1} more contacts`
                        : "");
                break;
            }
        }

        return lastMessageText;
    }
}
