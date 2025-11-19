import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageContactsModalComponent } from "./message-contacts-modal.component";

describe("MessageContactsModalComponent", () => {
    let component: MessageContactsModalComponent;
    let fixture: ComponentFixture<MessageContactsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageContactsModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageContactsModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
