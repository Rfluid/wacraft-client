import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TimeoutErrorModalComponent } from "./timeout-error-modal.component";

describe("TimeoutErrorModalComponent", () => {
    let component: TimeoutErrorModalComponent;
    let fixture: ComponentFixture<TimeoutErrorModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimeoutErrorModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TimeoutErrorModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
