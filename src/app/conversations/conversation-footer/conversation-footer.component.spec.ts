import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { ConversationFooterComponent } from "./conversation-footer.component";

describe("ConversationFooterComponent", () => {
    let component: ConversationFooterComponent;
    let fixture: ComponentFixture<ConversationFooterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, ConversationFooterComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ConversationFooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
