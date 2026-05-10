import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { ConversationsComponent } from "./conversations.component";

describe("ConversationsComponent", () => {
    let component: ConversationsComponent;
    let fixture: ComponentFixture<ConversationsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, ConversationsComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ConversationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
