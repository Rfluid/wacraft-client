import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageDataPipe } from "../../../core/message/pipe/message-data.pipe";

import { MessageInteractiveContentComponent } from "./message-interactive-content.component";

describe("MessageInteractiveContentComponent", () => {
    let component: MessageInteractiveContentComponent;
    let fixture: ComponentFixture<MessageInteractiveContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageInteractiveContentComponent],
            providers: [MessageDataPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageInteractiveContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
