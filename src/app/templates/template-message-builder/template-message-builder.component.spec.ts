import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TemplateMessageBuilderComponent } from "./template-message-builder.component";

describe("TemplateMessageBuilderComponent", () => {
    let component: TemplateMessageBuilderComponent;
    let fixture: ComponentFixture<TemplateMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TemplateMessageBuilderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TemplateMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
