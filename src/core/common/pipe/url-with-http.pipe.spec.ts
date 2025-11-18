import { UrlWithHttpPipe } from "./url-with-http.pipe";

describe("UrlWithHttpPipe", () => {
    it("create an instance", () => {
        const pipe = new UrlWithHttpPipe();
        expect(pipe).toBeTruthy();
    });
});
