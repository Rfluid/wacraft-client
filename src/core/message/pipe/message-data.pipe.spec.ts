import { NIL as NilUUID } from "uuid";

import { MessageDataPipe } from "./message-data.pipe";
import { MessageFields } from "../entity/message.entity";

describe("MessageDataPipe", () => {
    const pipe = new MessageDataPipe();

    it("returns receiver_data when from_id is set and non-NIL (incoming message)", () => {
        const msg = {
            from_id: "contact-mpc",
            sender_data: { type: "text" },
            receiver_data: { type: "text", text: { body: "from contact" } },
        } as unknown as MessageFields;
        expect(pipe.transform(msg)).toEqual(
            jasmine.objectContaining({ text: { body: "from contact" } }),
        );
    });

    it("returns sender_data when from_id is the NIL UUID (outgoing message)", () => {
        const msg = {
            from_id: NilUUID,
            sender_data: { type: "text", text: { body: "we sent" } },
            receiver_data: { type: "text" },
        } as unknown as MessageFields;
        expect(pipe.transform(msg)).toEqual(
            jasmine.objectContaining({ text: { body: "we sent" } }),
        );
    });

    it("returns sender_data when from_id is missing", () => {
        const msg = {
            sender_data: { type: "text", text: { body: "no from_id" } },
        } as unknown as MessageFields;
        expect(pipe.transform(msg)).toEqual(
            jasmine.objectContaining({ text: { body: "no from_id" } }),
        );
    });
});
