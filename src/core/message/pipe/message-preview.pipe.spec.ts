import { MessagePreviewPipe } from "./message-preview.pipe";
import { SenderData } from "../model/sender-data.model";
import { ReceiverData } from "../model/receiver-data.model";
import { MessageType, ReceivedMessageType } from "../model/message-type.model";

describe("MessagePreviewPipe", () => {
    const pipe = new MessagePreviewPipe();

    it("text: returns the body", () => {
        const data = { type: MessageType.text, text: { body: "hello" } } as SenderData;
        expect(pipe.transform(data)).toBe("hello");
    });

    it("text: returns empty string when body missing", () => {
        const data = { type: MessageType.text } as SenderData;
        expect(pipe.transform(data)).toBe("");
    });

    it("image / video / audio / sticker / document: returns capitalized type name", () => {
        for (const t of [
            MessageType.image,
            MessageType.video,
            MessageType.audio,
            MessageType.sticker,
            MessageType.document,
        ]) {
            const data = { type: t } as SenderData;
            const expected = t.charAt(0).toUpperCase() + t.slice(1);
            expect(pipe.transform(data)).toBe(expected);
        }
    });

    it("interactive button/list: prefers header.text, then body.text", () => {
        const headerText: SenderData = {
            type: MessageType.interactive,
            interactive: { type: "button", header: { text: "h" }, body: { text: "b" } },
        } as unknown as SenderData;
        expect(pipe.transform(headerText)).toBe("h");

        const bodyOnly: SenderData = {
            type: MessageType.interactive,
            interactive: { type: "list", body: { text: "b" } },
        } as unknown as SenderData;
        expect(pipe.transform(bodyOnly)).toBe("b");
    });

    it("interactive button_reply / list_reply: returns the title", () => {
        const buttonReply = {
            type: MessageType.interactive,
            interactive: { type: "button_reply", button_reply: { title: "yes" } },
        } as unknown as SenderData;
        expect(pipe.transform(buttonReply)).toBe("yes");

        const listReply = {
            type: MessageType.interactive,
            interactive: { type: "list_reply", list_reply: { title: "row1" } },
        } as unknown as SenderData;
        expect(pipe.transform(listReply)).toBe("row1");
    });

    it("location: name → address → 'Location' fallback", () => {
        const named = {
            type: MessageType.location,
            location: { name: "Home", address: "123" },
        } as unknown as SenderData;
        expect(pipe.transform(named)).toBe("Home");

        const addr = {
            type: MessageType.location,
            location: { address: "123 Main" },
        } as unknown as SenderData;
        expect(pipe.transform(addr)).toBe("123 Main");

        const empty = {
            type: MessageType.location,
            location: {},
        } as unknown as SenderData;
        expect(pipe.transform(empty)).toBe("Location");
    });

    it("template: returns template name", () => {
        const data = {
            type: MessageType.template,
            template: { name: "welcome_v2" },
        } as unknown as SenderData;
        expect(pipe.transform(data)).toBe("welcome_v2");
    });

    it("button (received messages): returns button.text", () => {
        const data = {
            type: ReceivedMessageType.button,
            button: { text: "tap" },
        } as unknown as ReceiverData;
        expect(pipe.transform(data)).toBe("tap");
    });

    it("reaction: returns 'Reacted with <emoji>'", () => {
        const data = {
            type: MessageType.reaction,
            reaction: { emoji: "❤️" },
        } as unknown as SenderData;
        expect(pipe.transform(data)).toBe("Reacted with ❤️");
    });

    it("contacts: single contact name", () => {
        const data = {
            type: MessageType.contacts,
            contacts: [{ name: { formatted_name: "Alice" } }],
        } as unknown as SenderData;
        expect(pipe.transform(data)).toBe("Alice");
    });

    it("contacts: multi-contact suffix", () => {
        const data = {
            type: MessageType.contacts,
            contacts: [
                { name: { formatted_name: "Alice" } },
                { name: { formatted_name: "Bob" } },
                { name: { formatted_name: "Carol" } },
            ],
        } as unknown as SenderData;
        expect(pipe.transform(data)).toBe("Alice and 2 more contacts");
    });

    it("returns empty string when type is unrecognized", () => {
        const data = { type: "unknown" } as unknown as SenderData;
        expect(pipe.transform(data)).toBe("");
    });
});
