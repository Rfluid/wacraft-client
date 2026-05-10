import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { WebhookControllerService } from "./webhook-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("WebhookControllerService", () => {
    let service: WebhookControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(WebhookControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs root with default pagination 10", async () => {
        await service.get();
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 10, offset: 0 }),
        );
    });

    it("create POSTs at root", async () => {
        await service.create({ url: "x" } as never);
        expect(http.post.calls.mostRecent().args[0]).toBe("");
    });

    it("delete sends DELETE with body { id }", async () => {
        await service.delete("w-1");
        expect(http.delete).toHaveBeenCalledWith("", { data: { id: "w-1" } });
    });

    it("update PUTs at root", async () => {
        await service.update({ id: "w-1" } as never);
        expect(http.put.calls.mostRecent().args[0]).toBe("");
    });

    it("contentLike encodes both likeText and likeKey", async () => {
        await service.contentLike("hello world", "url with space");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("content/url%20with%20space/like/hello%20world");
    });

    it("test POSTs to /test with webhook_id and payload", async () => {
        await service.test("w-1", { foo: "bar" });
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toBe("/test");
        expect(args[1]).toEqual({ webhook_id: "w-1", payload: { foo: "bar" } });
    });
});
