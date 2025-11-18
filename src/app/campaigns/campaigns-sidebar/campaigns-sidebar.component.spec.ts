import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CampaignsSidebarComponent } from "./campaigns-sidebar.component";

describe("CampaignsSidebarComponent", () => {
    let component: CampaignsSidebarComponent;
    let fixture: ComponentFixture<CampaignsSidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CampaignsSidebarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignsSidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
