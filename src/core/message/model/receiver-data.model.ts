import { ButtonData } from "./button-data.model";
import { ContactData } from "./contact-data.model";
import { ReceivedInteractive } from "./interactive.model";
import { LocationData } from "./location-data.model";
import { UseMedia } from "./media-data.model";
import { ReceivedMessageType } from "./message-type.model";
import { ReactionData } from "./reaction-data.model";
import { ReceivedContext } from "./received-context.model";
import { TextData } from "./text-data.model";
import { UseTemplate } from "./use-template.model";

export interface ReceiverData {
    id: string;

    type: ReceivedMessageType;
    text?: TextData;
    context?: ReceivedContext;

    image?: UseMedia;
    video?: UseMedia;
    audio?: UseMedia;
    document?: UseMedia;
    sticker?: UseMedia;

    reaction?: ReactionData;

    interactive?: ReceivedInteractive;
    template?: UseTemplate;
    location?: LocationData;

    contacts?: ContactData[];

    button?: ButtonData;

    [key: string]: unknown;
}
