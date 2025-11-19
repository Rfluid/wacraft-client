import { TestBed } from "@angular/core/testing";

import { CampaignMessageControllerService } from "./campaign-message-controller.service";

describe("CampaignMessageControllerService", () => {
    let service: CampaignMessageControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CampaignMessageControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
