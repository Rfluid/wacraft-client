import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageForwardedHeaderComponent } from "./message-forwarded-header.component";

describe("MessageForwardedHeaderComponent", () => {
    let component: MessageForwardedHeaderComponent;
    let fixture: ComponentFixture<MessageForwardedHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageForwardedHeaderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageForwardedHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
