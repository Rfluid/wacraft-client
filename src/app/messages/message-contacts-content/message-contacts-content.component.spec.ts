import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageContactsContentComponent } from "./message-contacts-content.component";

describe("MessageContactsContentComponent", () => {
    let component: MessageContactsContentComponent;
    let fixture: ComponentFixture<MessageContactsContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageContactsContentComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageContactsContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
