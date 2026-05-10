import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { TemplatePreviewComponent } from "./template-preview.component";

describe("TemplatePreviewComponent", () => {
    let component: TemplatePreviewComponent;
    let fixture: ComponentFixture<TemplatePreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, TemplatePreviewComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(TemplatePreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
