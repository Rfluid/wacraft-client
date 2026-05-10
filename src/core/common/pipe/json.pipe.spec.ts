import { JsonPipe } from "./json.pipe";

describe("JsonPipe", () => {
    const pipe = new JsonPipe();

    it("pretty-prints objects with 4-space indentation", () => {
        expect(pipe.transform({ a: 1, b: { c: 2 } })).toBe(
            '{\n    "a": 1,\n    "b": {\n        "c": 2\n    }\n}',
        );
    });

    it("returns the empty-string fallback for undefined", () => {
        // JSON.stringify(undefined) returns undefined → falls through to String(value ?? "").
        expect(pipe.transform(undefined)).toBe("");
    });

    it("renders null as the literal string 'null'", () => {
        expect(pipe.transform(null)).toBe("null");
    });

    it("falls back to String() when JSON.stringify throws (e.g. circular)", () => {
        const a: Record<string, unknown> = {};
        a["self"] = a;
        const result = pipe.transform(a);
        expect(typeof result).toBe("string");
        expect(result).toContain("[object Object]");
    });

    it("renders primitives as JSON literals", () => {
        expect(pipe.transform("x")).toBe('"x"');
        expect(pipe.transform(42)).toBe("42");
        expect(pipe.transform(true)).toBe("true");
    });
});
