import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { provideRouter } from "@angular/router";

import { MessageContactsContentComponent } from "./message-contacts-content.component";

describe("MessageContactsContentComponent", () => {
    let component: MessageContactsContentComponent;
    let fixture: ComponentFixture<MessageContactsContentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoggerTestingModule, MessageContactsContentComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageContactsContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit("should create", () => {
        expect(component).toBeTruthy();
    });
});
