import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { ConversationBodyComponent } from "./conversation-body.component";

describe("ConversationBodyComponent", () => {
    let component: ConversationBodyComponent;
    let fixture: ComponentFixture<ConversationBodyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, ConversationBodyComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ConversationBodyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
