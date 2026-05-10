import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { NewContactComponent } from "./new-contact.component";

describe("NewContactComponent", () => {
    let component: NewContactComponent;
    let fixture: ComponentFixture<NewContactComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, NewContactComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(NewContactComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
