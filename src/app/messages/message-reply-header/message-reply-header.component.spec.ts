import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

import { MessageReplyHeaderComponent } from "./message-reply-header.component";

describe("MessageReplyHeaderComponent", () => {
    let component: MessageReplyHeaderComponent;
    let fixture: ComponentFixture<MessageReplyHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageReplyHeaderComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageReplyHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
