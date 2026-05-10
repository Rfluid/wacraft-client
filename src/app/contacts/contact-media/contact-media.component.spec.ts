import { TestBed } from "@angular/core/testing";
import { LoggerTestingModule } from "ngx-logger/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { runInInjectionContext, EnvironmentInjector } from "@angular/core";
import { Subject } from "rxjs";

import { ContactMediaComponent } from "./contact-media.component";
import { ConversationControllerService } from "../../../core/message/controller/conversation-controller.service";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";
import { MediaMode } from "./enum/media-mode.enum";

const scrollEv = (el: { scrollHeight: number; scrollTop: number; clientHeight: number }) =>
    ({ target: el }) as unknown as Event;
const nearBottom = () => ({ scrollHeight: 1000, scrollTop: 950, clientHeight: 100 });
const farFromBottom = () => ({ scrollHeight: 10_000, scrollTop: 0, clientHeight: 100 });

describe("ContactMediaComponent — per-mode scroll", () => {
    let component: ContactMediaComponent;
    let convoCtl: jasmine.SpyObj<ConversationControllerService>;

    beforeEach(() => {
        convoCtl = jasmine.createSpyObj<ConversationControllerService>(
            "ConversationControllerService",
            ["conversationContentLike"],
        );
        convoCtl.conversationContentLike.and.resolveTo([] as never);

        TestBed.configureTestingModule({
            imports: [LoggerTestingModule],
            providers: [
                { provide: ConversationControllerService, useValue: convoCtl },
                { provide: QueryParamsService, useValue: { globalQueryParams: {} } },
                {
                    provide: ActivatedRoute,
                    useValue: { queryParams: new Subject() },
                },
                { provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
            ],
        });

        component = runInInjectionContext(
            TestBed.inject(EnvironmentInjector),
            () => new ContactMediaComponent(),
        );
        component.messagingProductContact = { id: "mpc-1" } as never;
    });

    it("does nothing far from bottom", () => {
        component.onScroll(scrollEv(farFromBottom()), MediaMode.image);
        expect(convoCtl.conversationContentLike).not.toHaveBeenCalled();
    });

    it("calls getMedia for the requested mode near bottom", () => {
        component.onScroll(scrollEv(nearBottom()), MediaMode.image);
        expect(convoCtl.conversationContentLike).toHaveBeenCalled();
    });

    it("does not fetch when reachedMaxMediaLimit for that mode", () => {
        component.reachedMaxMediaLimit.set(MediaMode.image, true);
        component.onScroll(scrollEv(nearBottom()), MediaMode.image);
        expect(convoCtl.conversationContentLike).not.toHaveBeenCalled();
    });

    it("does not fetch when already scrolling for that mode", () => {
        component.scrolling.set(MediaMode.image, true);
        component.onScroll(scrollEv(nearBottom()), MediaMode.image);
        expect(convoCtl.conversationContentLike).not.toHaveBeenCalled();
    });

    it("scroll for one mode does not affect another mode's fetch state", () => {
        component.reachedMaxMediaLimit.set(MediaMode.image, true);
        component.onScroll(scrollEv(nearBottom()), MediaMode.video);
        expect(convoCtl.conversationContentLike).toHaveBeenCalled();
    });
});
