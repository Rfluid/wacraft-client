import { UrlWithWsPipe } from "./url-with-ws.pipe";

describe("UrlWithWsPipe", () => {
    it("create an instance", () => {
        const pipe = new UrlWithWsPipe();
        expect(pipe).toBeTruthy();
    });
});
