import { NIL as NilUUID } from "uuid";

import { MessagingProductContactFromMessagePipe } from "./messaging-product-contact-from-message.pipe";
import { Conversation } from "../model/conversation.model";

describe("MessagingProductContactFromMessagePipe", () => {
    const pipe = new MessagingProductContactFromMessagePipe();

    it("returns conversation.from when from_id is set and non-NIL", () => {
        const conv = {
            from_id: "real-id",
            from: { id: "from-mpc" },
            to: { id: "to-mpc" },
        } as unknown as Conversation;
        expect(pipe.transform(conv).id).toBe("from-mpc");
    });

    it("returns conversation.to when from_id is the NIL UUID", () => {
        const conv = {
            from_id: NilUUID,
            from: { id: "from-mpc" },
            to: { id: "to-mpc" },
        } as unknown as Conversation;
        expect(pipe.transform(conv).id).toBe("to-mpc");
    });

    it("returns conversation.to when from_id is missing", () => {
        const conv = {
            to: { id: "to-mpc" },
        } as unknown as Conversation;
        expect(pipe.transform(conv).id).toBe("to-mpc");
    });
});
