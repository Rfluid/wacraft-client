import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

import { MessageTemplateContentComponent } from "./message-template-content.component";

describe("MessageTemplateContentComponent", () => {
    let component: MessageTemplateContentComponent;
    let fixture: ComponentFixture<MessageTemplateContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageTemplateContentComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageTemplateContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
