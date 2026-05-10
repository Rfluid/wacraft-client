import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { MessagingProductControllerService } from "./messaging-product-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("MessagingProductControllerService", () => {
    let service: MessagingProductControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(MessagingProductControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs root with default pagination of 10 and merged params", async () => {
        await service.get({ id: "x" } as never, { limit: 5, offset: 2 });
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ id: "x", limit: 5, offset: 2 }),
        );
    });
});
