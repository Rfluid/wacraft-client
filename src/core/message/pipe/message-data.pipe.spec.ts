import { MessageDataPipe } from "./message-data.pipe";

describe("MessageDataPipe", () => {
    it("create an instance", () => {
        const pipe = new MessageDataPipe();
        expect(pipe).toBeTruthy();
    });
});
