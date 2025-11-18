import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WebhookLogsComponent } from "./webhook-logs.component";

describe("WebhookLogsComponent", () => {
    let component: WebhookLogsComponent;
    let fixture: ComponentFixture<WebhookLogsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WebhookLogsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(WebhookLogsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
