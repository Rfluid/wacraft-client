import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageTemplateContentComponent } from "./message-template-content.component";

describe("MessageTemplateContentComponent", () => {
    let component: MessageTemplateContentComponent;
    let fixture: ComponentFixture<MessageTemplateContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageTemplateContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageTemplateContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
