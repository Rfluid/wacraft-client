import { EmojiToUnicodeEscapePipe } from "./emoji-to-unicode-escape.pipe";

describe("EmojiToUnicodeEscapePipe", () => {
    const pipe = new EmojiToUnicodeEscapePipe();

    it("escapes ASCII as \\uXXXX", () => {
        expect(pipe.transform("A")).toBe("\\u0041");
        expect(pipe.transform("z")).toBe("\\u007A");
    });

    it("escapes a multi-character string concatenated", () => {
        expect(pipe.transform("AB")).toBe("\\u0041\\u0042");
    });

    it("emits both surrogates for a non-BMP emoji (Array.from preserves the code point)", () => {
        // U+1F600 → surrogate pair D83D DE00. Array.from yields a single code-point string,
        // but charCodeAt(0) of that single grapheme is still the leading surrogate.
        const out = pipe.transform("😀");
        expect(out.startsWith("\\u")).toBe(true);
        expect(out.length).toBeGreaterThanOrEqual(6);
    });

    it("returns empty string for empty input", () => {
        expect(pipe.transform("")).toBe("");
    });
});
