import { MessageIdPipe } from "./message-id.pipe";
import { MessageFields } from "../entity/message.entity";

describe("MessageIdPipe", () => {
    const pipe = new MessageIdPipe();

    function withReceiverId(id: string): MessageFields {
        return { receiver_data: { id } } as unknown as MessageFields;
    }
    function withProductId(id: string): MessageFields {
        return { product_data: { messages: [{ id }] } } as unknown as MessageFields;
    }

    it("prefers receiver_data.id when present", () => {
        const fields = withReceiverId("rcv-1");
        // Even if product_data also has an id, receiver_data wins.
        (fields as { product_data?: unknown }).product_data = { messages: [{ id: "prod-1" }] };
        expect(pipe.transform(fields)).toBe("rcv-1");
    });

    it("falls back to product_data.messages[0].id", () => {
        expect(pipe.transform(withProductId("prod-9"))).toBe("prod-9");
    });

    it("throws when neither id is available", () => {
        expect(() => pipe.transform({} as unknown as MessageFields)).toThrowError(
            /Message ID not found/,
        );
    });
});
