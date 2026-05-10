import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";
import { MessageIdPipe } from "../../../core/message/pipe/message-id.pipe";

import { MessageOptionsComponent } from "./message-options.component";

describe("MessageOptionsComponent", () => {
    let component: MessageOptionsComponent;
    let fixture: ComponentFixture<MessageOptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageOptionsComponent],
            providers: [MessageIdPipe, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
