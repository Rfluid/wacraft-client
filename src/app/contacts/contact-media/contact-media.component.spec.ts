import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContactMediaComponent } from "./contact-media.component";

describe("ContactMediaComponent", () => {
    let component: ContactMediaComponent;
    let fixture: ComponentFixture<ContactMediaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactMediaComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactMediaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
