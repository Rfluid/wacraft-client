import { MessageIdPipe } from "./message-id.pipe";

describe("MessageIdPipe", () => {
    it("create an instance", () => {
        const pipe = new MessageIdPipe();
        expect(pipe).toBeTruthy();
    });
});
