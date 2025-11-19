import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageTypeSelectorComponent } from "./message-type-selector.component";

describe("MessageTypeSelectorComponent", () => {
    let component: MessageTypeSelectorComponent;
    let fixture: ComponentFixture<MessageTypeSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageTypeSelectorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageTypeSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
