import { CapitalizeFirstLetterPipe } from "./capitalize-first-letter.pipe";

describe("CapitalizeFirstLetterPipe", () => {
    const pipe = new CapitalizeFirstLetterPipe();

    it("uppercases the first character", () => {
        expect(pipe.transform("hello")).toBe("Hello");
    });

    it("preserves an already-uppercase first character", () => {
        expect(pipe.transform("Hello")).toBe("Hello");
    });

    it("does not change the rest of the string", () => {
        expect(pipe.transform("hELLO")).toBe("HELLO");
    });

    it("returns falsy inputs unchanged", () => {
        expect(pipe.transform("")).toBe("");
        expect(pipe.transform(null as unknown as string)).toBe(null as unknown as string);
        expect(pipe.transform(undefined as unknown as string)).toBe(undefined as unknown as string);
    });

    it("handles a single character", () => {
        expect(pipe.transform("x")).toBe("X");
    });
});
