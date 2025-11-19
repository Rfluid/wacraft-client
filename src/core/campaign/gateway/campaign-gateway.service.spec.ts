import { TestBed } from "@angular/core/testing";

import { CampaignGatewayService } from "./campaign-gateway.service";

describe("CampaignGatewayService", () => {
    let service: CampaignGatewayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CampaignGatewayService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
