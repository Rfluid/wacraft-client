import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { CampaignDetailsComponent } from "./campaign-details.component";

describe("CampaignDetailsComponent", () => {
    let component: CampaignDetailsComponent;
    let fixture: ComponentFixture<CampaignDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, CampaignDetailsComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
