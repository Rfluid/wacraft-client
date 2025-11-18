import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InteractiveMessageBuilderComponent } from "./interactive-message-builder.component";

describe("InteractiveMessageBuilderComponent", () => {
    let component: InteractiveMessageBuilderComponent;
    let fixture: ComponentFixture<InteractiveMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InteractiveMessageBuilderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InteractiveMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
