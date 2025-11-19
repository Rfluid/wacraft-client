import { EmojiToUnicodeEscapePipe } from "./emoji-to-unicode-escape.pipe";

describe("EmojiToUnicodeEscapePipe", () => {
    it("create an instance", () => {
        const pipe = new EmojiToUnicodeEscapePipe();
        expect(pipe).toBeTruthy();
    });
});
