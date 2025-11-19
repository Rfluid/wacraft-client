import { ButtonSubtype } from "./button-subtype.model";
import { UseMedia } from "./media-data.model";

export enum UseTemplateComponentType {
    header = "HEADER",
    body = "BODY",
    footer = "FOOTER",
    button = "BUTTON",
}

export interface UseTemplateComponent {
    type: UseTemplateComponentType;
    parameters: ComponentParameters[];
    sub_type?: ButtonSubtype; // Required for button components
    index?: string; // Required for button components
}

export interface ComponentParameters {
    type: ParameterType;
    text?: string;
    placeholder?: string;

    image?: UseMedia;
    video?: UseMedia;
    audio?: UseMedia;
    document?: UseMedia;
    sticker?: UseMedia;
    date_time?: {
        fallback_value: string;
    };
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    button?: {
        payload?: string;
        text?: string;
    };
}

export enum ParameterType {
    text = "text",
    currency = "currency",
    date_time = "date_time",
    image = "image",
    video = "video",
    sticker = "sticker",
    document = "document",
    button = "button",
    payload = "payload",
}
