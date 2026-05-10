import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { CampaignMessageBuilderComponent } from "./campaign-message-builder.component";

describe("CampaignMessageBuilderComponent", () => {
    let component: CampaignMessageBuilderComponent;
    let fixture: ComponentFixture<CampaignMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, CampaignMessageBuilderComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
