import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CampaignPreviewComponent } from "./campaign-preview.component";

describe("CampaignPreviewComponent", () => {
    let component: CampaignPreviewComponent;
    let fixture: ComponentFixture<CampaignPreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CampaignPreviewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
