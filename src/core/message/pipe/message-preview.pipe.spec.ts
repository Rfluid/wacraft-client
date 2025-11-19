import { MessagePreviewPipe } from "./message-preview.pipe";

describe("MessagePreviewPipe", () => {
    it("create an instance", () => {
        const pipe = new MessagePreviewPipe();
        expect(pipe).toBeTruthy();
    });
});
