import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WebhookSidebarComponent } from "./webhook-sidebar.component";

describe("WebhookSidebarComponent", () => {
    let component: WebhookSidebarComponent;
    let fixture: ComponentFixture<WebhookSidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WebhookSidebarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(WebhookSidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
