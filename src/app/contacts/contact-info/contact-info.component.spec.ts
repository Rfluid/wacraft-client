import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { ContactInfoComponent } from "./contact-info.component";

describe("ContactInfoComponent", () => {
    let component: ContactInfoComponent;
    let fixture: ComponentFixture<ContactInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, ContactInfoComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
