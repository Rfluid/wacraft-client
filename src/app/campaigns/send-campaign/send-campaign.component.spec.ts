import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SendCampaignComponent } from "./send-campaign.component";

describe("SendCampaignComponent", () => {
    let component: SendCampaignComponent;
    let fixture: ComponentFixture<SendCampaignComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SendCampaignComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SendCampaignComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
