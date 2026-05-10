import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { WebhookLogsControllerService } from "./webhook-logs-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("WebhookLogsControllerService", () => {
    let service: WebhookLogsControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(WebhookLogsControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs root with default pagination 10 and merged params", async () => {
        await service.get({ webhook_id: "w-1" } as never, { limit: 5, offset: 2 });
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ webhook_id: "w-1", limit: 5, offset: 2 }),
        );
    });
});
