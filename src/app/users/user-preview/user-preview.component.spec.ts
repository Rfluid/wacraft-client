import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { UserPreviewComponent } from "./user-preview.component";

describe("UserPreviewComponent", () => {
    let component: UserPreviewComponent;
    let fixture: ComponentFixture<UserPreviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, UserPreviewComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(UserPreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
