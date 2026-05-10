import { UrlWithWsPipe } from "./url-with-ws.pipe";

describe("UrlWithWsPipe", () => {
    const pipe = new UrlWithWsPipe();

    it("emits wss:// when secure is true", () => {
        expect(pipe.transform("server.example", true)).toBe("wss://server.example");
    });

    it("emits ws:// when secure is false", () => {
        expect(pipe.transform("server.example", false)).toBe("ws://server.example");
    });
});
