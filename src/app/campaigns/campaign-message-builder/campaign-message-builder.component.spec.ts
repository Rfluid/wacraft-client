import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CampaignMessageBuilderComponent } from "./campaign-message-builder.component";

describe("CampaignMessageBuilderComponent", () => {
    let component: CampaignMessageBuilderComponent;
    let fixture: ComponentFixture<CampaignMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CampaignMessageBuilderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
