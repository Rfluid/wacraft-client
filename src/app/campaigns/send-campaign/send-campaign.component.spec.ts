import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { SendCampaignComponent } from "./send-campaign.component";

describe("SendCampaignComponent", () => {
    let component: SendCampaignComponent;
    let fixture: ComponentFixture<SendCampaignComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, SendCampaignComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(SendCampaignComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
