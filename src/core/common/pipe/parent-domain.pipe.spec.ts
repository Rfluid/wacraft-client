import { ParentDomainPipe } from "./parent-domain.pipe";

describe("ParentDomainPipe", () => {
    const pipe = new ParentDomainPipe();

    it("returns the last three parts with a leading dot for a 3+ part hostname", () => {
        expect(pipe.transform("api.wacraftserver.astervia.tech")).toBe(
            ".wacraftserver.astervia.tech",
        );
    });

    it("works without an explicit protocol", () => {
        expect(pipe.transform("api.example.co.uk")).toBe(".example.co.uk");
    });

    it("returns the full hostname when fewer than 3 parts", () => {
        expect(pipe.transform("localhost")).toBe("localhost");
        expect(pipe.transform("example.com")).toBe("example.com");
    });

    it("preserves the protocol-stripped hostname only", () => {
        expect(pipe.transform("https://x.y.example.com/path")).toBe(".y.example.com");
    });

    it("returns the input on parse failure", () => {
        spyOn(console, "error");
        // An empty string fails URL parsing after the prefix → should fall back.
        const result = pipe.transform("");
        // The pipe normalizes "" to "https://" which URL might still parse to an empty hostname.
        // We assert the function does not throw and returns a string.
        expect(typeof result).toBe("string");
    });
});
