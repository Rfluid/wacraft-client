import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { WebhookPreviewComponent } from "./webhook-preview.component";

describe("WebhookPreviewComponent", () => {
    let component: WebhookPreviewComponent;
    let fixture: ComponentFixture<WebhookPreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, WebhookPreviewComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(WebhookPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
