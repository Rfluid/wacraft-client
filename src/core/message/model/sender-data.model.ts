import { ContactData } from "./contact-data.model";
import { Context } from "./context.model";
import { InteractiveData } from "./interactive-data.model";
import { compareInteractive, Interactive } from "./interactive.model";
import { compareLocationData, LocationData } from "./location-data.model";
import { compareUseMedia, UseMedia } from "./media-data.model";
import { MessageType } from "./message-type.model";
import { compareReactionData, ReactionData } from "./reaction-data.model";
import { compareTextData, TextData } from "./text-data.model";
import { compareUseTemplate, UseTemplate } from "./use-template.model";

export interface SenderData {
    messaging_product: string;
    recipient_type: string;
    to: string;
    context?: Context;

    type: MessageType;
    text?: TextData;

    image?: UseMedia;
    video?: UseMedia;
    audio?: UseMedia;
    document?: UseMedia;
    sticker?: UseMedia;

    reaction?: ReactionData;

    interactive?: InteractiveData;

    location?: LocationData;

    template?: UseTemplate;

    contacts?: ContactData[];
}

export function compareSenderData(obj1: SenderData, obj2: SenderData): boolean {
    if (obj1.type !== obj2.type) return false;

    switch (obj1.type) {
        case MessageType.text:
            if (!obj1[obj1.type] || !obj2[obj2.type]) return false;

            return compareTextData(obj1[obj1.type] as TextData, obj2[obj2.type] as TextData);
        case MessageType.location: {
            const location1 = obj1[obj1.type] as LocationData;
            const location2 = obj2[obj2.type] as LocationData;
            if (!location1 || !location2) return false;
            return compareLocationData(location1, location2);
        }
        case MessageType.image:
        case MessageType.video:
        case MessageType.audio:
        case MessageType.document:
        case MessageType.sticker: {
            const data1 = obj1[obj1.type] as UseMedia;
            const data2 = obj2[obj2.type] as UseMedia;
            if (!data1 || !data2) return false;

            return compareUseMedia(data1, data2);
        }
        case MessageType.template: {
            const template1 = obj1[obj1.type] as UseTemplate;
            const template2 = obj2[obj2.type] as UseTemplate;
            if (!template1 || !template2) return false;

            return compareUseTemplate(template1, template2);
        }
        case MessageType.reaction: {
            const reaction1 = obj1[obj1.type] as ReactionData;
            const reaction2 = obj2[obj2.type] as ReactionData;
            if (!reaction1 || !reaction2) return false;
            return compareReactionData(reaction1, reaction2);
        }
        case MessageType.interactive: {
            const interactive1 = obj1[obj1.type] as Interactive;
            const interactive2 = obj2[obj2.type] as Interactive;

            if (!interactive1 || !interactive2) return false;

            return compareInteractive(interactive1, interactive2);
        }
    }

    return true;
}

export function emptySenderData(): SenderData {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "",
        type: MessageType.text,
    };
}
