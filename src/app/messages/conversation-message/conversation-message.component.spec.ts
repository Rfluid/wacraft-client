import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

import { ConversationMessageComponent } from "./conversation-message.component";

describe("ConversationMessageComponent", () => {
    let component: ConversationMessageComponent;
    let fixture: ComponentFixture<ConversationMessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, ConversationMessageComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ConversationMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
