import { TestBed } from "@angular/core/testing";

import { CampaignMessageSendErrorControllerService } from "./campaign-message-send-error-controller.service";

describe("CampaignMessageSendErrorControllerService", () => {
    let service: CampaignMessageSendErrorControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CampaignMessageSendErrorControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
