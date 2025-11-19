import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CsvToCampaignComponent } from "./csv-to-campaign.component";

describe("CsvToCampaignComponent", () => {
    let component: CsvToCampaignComponent;
    let fixture: ComponentFixture<CsvToCampaignComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CsvToCampaignComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CsvToCampaignComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
