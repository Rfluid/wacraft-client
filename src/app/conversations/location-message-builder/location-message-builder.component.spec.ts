import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { LocationMessageBuilderComponent } from "./location-message-builder.component";

describe("LocationMessageBuilderComponent", () => {
    let component: LocationMessageBuilderComponent;
    let fixture: ComponentFixture<LocationMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, LocationMessageBuilderComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(LocationMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
