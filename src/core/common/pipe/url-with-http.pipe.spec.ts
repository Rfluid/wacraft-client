import { UrlWithHttpPipe } from "./url-with-http.pipe";

describe("UrlWithHttpPipe", () => {
    const pipe = new UrlWithHttpPipe();

    it("emits https:// when secure is true", () => {
        expect(pipe.transform("example.com", true)).toBe("https://example.com");
    });

    it("emits http:// when secure is false", () => {
        expect(pipe.transform("example.com", false)).toBe("http://example.com");
    });
});
