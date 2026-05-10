import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { MessagingProductContactControllerService } from "./messaging-product-contact-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("MessagingProductContactControllerService", () => {
    let service: MessagingProductContactControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(MessagingProductContactControllerService);
    });

    afterEach(() => localStorage.clear());

    it("delete sends DELETE with body { id }", async () => {
        await service.delete("c-1");
        expect(http.delete).toHaveBeenCalledWith("", { data: { id: "c-1" } });
    });

    it("block PATCHes /block with body { id }", async () => {
        await service.block("c-1");
        expect(http.patch).toHaveBeenCalledWith("block", { id: "c-1" });
    });

    it("createWhatsAppContact POSTs to /whatsapp", async () => {
        await service.createWhatsAppContact({} as never);
        expect(http.post.calls.mostRecent().args[0]).toBe("whatsapp");
    });

    it("getWhatsAppContacts GETs /whatsapp with default pagination", async () => {
        await service.getWhatsAppContacts({} as never);
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("whatsapp");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 10, offset: 0 }),
        );
    });

    it("getLikeText URL-encodes likeText into the path", async () => {
        await service.getLikeText("hello world", {} as never);
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("content/like/hello%20world");
    });

    it("countLikeText prefixes /count and encodes the text", async () => {
        http.get.and.resolveTo({ data: 42 });
        const out = await service.countLikeText("hello world", {} as never);
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("/count/content/like/hello%20world");
        expect(out).toBe(42);
    });

    it("unblock sends DELETE on /block with body { id }", async () => {
        await service.unblock("c-1");
        expect(http.delete).toHaveBeenCalledWith("block", { data: { id: "c-1" } });
    });

    it("updateLastReadAt PUTs to last-read-at/{encoded id}", async () => {
        await service.updateLastReadAt("a/b");
        expect(http.put).toHaveBeenCalledWith("last-read-at/a%2Fb");
    });
});
