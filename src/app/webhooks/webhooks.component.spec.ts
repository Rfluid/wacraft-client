import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { WebhooksComponent } from "./webhooks.component";

describe("WebhooksComponent", () => {
    let component: WebhooksComponent;
    let fixture: ComponentFixture<WebhooksComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, WebhooksComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(WebhooksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
