import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContactsMessageBuilderComponent } from "./contacts-message-builder.component";

describe("ContactsMessageBuilderComponent", () => {
    let component: ContactsMessageBuilderComponent;
    let fixture: ComponentFixture<ContactsMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactsMessageBuilderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactsMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
