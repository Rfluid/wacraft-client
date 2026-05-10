import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { WebhookDetailsComponent } from "./webhook-details.component";

describe("WebhookDetailsComponent", () => {
    let component: WebhookDetailsComponent;
    let fixture: ComponentFixture<WebhookDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, WebhookDetailsComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(WebhookDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
