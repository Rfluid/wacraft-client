import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LocationMessageBuilderComponent } from "./location-message-builder.component";

describe("LocationMessageBuilderComponent", () => {
    let component: LocationMessageBuilderComponent;
    let fixture: ComponentFixture<LocationMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LocationMessageBuilderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LocationMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
