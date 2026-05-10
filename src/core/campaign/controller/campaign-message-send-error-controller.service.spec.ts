import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { CampaignMessageSendErrorControllerService } from "./campaign-message-send-error-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("CampaignMessageSendErrorControllerService", () => {
    let service: CampaignMessageSendErrorControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(CampaignMessageSendErrorControllerService);
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
});
