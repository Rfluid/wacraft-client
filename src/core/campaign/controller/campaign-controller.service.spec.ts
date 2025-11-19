import { TestBed } from "@angular/core/testing";

import { CampaignControllerService } from "./campaign-controller.service";

describe("CampaignControllerService", () => {
    let service: CampaignControllerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CampaignControllerService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
