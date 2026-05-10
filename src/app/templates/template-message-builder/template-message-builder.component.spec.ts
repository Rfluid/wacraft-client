import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { TemplateMessageBuilderComponent } from "./template-message-builder.component";

describe("TemplateMessageBuilderComponent", () => {
    let component: TemplateMessageBuilderComponent;
    let fixture: ComponentFixture<TemplateMessageBuilderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, TemplateMessageBuilderComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(TemplateMessageBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
