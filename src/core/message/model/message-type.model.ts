export enum MessageType {
    text = "text",
    image = "image",
    audio = "audio",
    video = "video",
    document = "document",
    sticker = "sticker",
    template = "template",
    reaction = "reaction",
    location = "location",
    interactive = "interactive",
    contacts = "contacts",
}

export enum ReceivedMessageType {
    text = "text",
    image = "image",
    audio = "audio",
    video = "video",
    document = "document",
    sticker = "sticker",
    template = "template",
    reaction = "reaction",
    location = "location",
    interactive = "interactive",
    button = "button",
    contacts = "contacts",
}

export enum MediaType {
    image = "image",
    video = "video",
    audio = "audio",
    sticker = "sticker",
    document = "document",
}

export function isMediaType(type?: MessageType | ReceivedMessageType | string): boolean {
    if (!type) return false;
    return (
        type === MessageType.image ||
        type === MessageType.video ||
        type === MessageType.audio ||
        type === MessageType.sticker ||
        type === MessageType.document
    );
}
