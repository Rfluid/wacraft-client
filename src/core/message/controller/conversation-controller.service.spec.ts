import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";

import { ConversationControllerService } from "./conversation-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";

describe("ConversationControllerService", () => {
    let service: ConversationControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("accessToken", "tok");
        http = jasmine.createSpyObj<AxiosInstance>("AxiosInstance", ["get", "post"], {
            interceptors: { response: { use: () => 0 } } as never,
            defaults: { headers: {} },
        } as never);
        http.get.and.resolveTo({ data: [] });
        spyOn(axios, "create").and.returnValue(http);

        TestBed.configureTestingModule({
            providers: [
                ConversationControllerService,
                { provide: AuthService, useValue: { token: new Subject<string>() } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged: new Subject() },
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: jasmine.createSpy("navigate"),
                        events: new Subject(),
                        url: "/",
                    },
                },
            ],
        });
        service = TestBed.inject(ConversationControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("get GETs root with merged params", async () => {
        await service.get({ id: "x" } as never, { limit: 5, offset: 0 });
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ id: "x", limit: 5, offset: 0 }),
        );
    });

    it("count GETs /count", async () => {
        http.get.and.resolveTo({ data: 17 });
        const n = await service.count();
        expect(http.get).toHaveBeenCalledWith("count", jasmine.any(Object));
        expect(n).toBe(17);
    });

    it("getByMessagingProductContact builds the MPC-scoped path", async () => {
        await service.getByMessagingProductContact("mpc-1");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("messaging-product-contact/mpc-1");
    });

    it("countByMessagingProductContact builds the count + MPC path", async () => {
        http.get.and.resolveTo({ data: 99 });
        const n = await service.countByMessagingProductContact("mpc-1");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("count/messaging-product-contact/mpc-1");
        expect(n).toBe(99);
    });

    it("conversationContentLike encodes the likeText into the path", async () => {
        await service.conversationContentLike("mpc-1", "hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("messaging-product-contact/mpc-1/content/like/hello%20world");
    });

    it("countConversationContentLike encodes likeText and prefixes /count", async () => {
        http.get.and.resolveTo({ data: 5 });
        await service.countConversationContentLike("mpc-1", "hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("count/messaging-product-contact/mpc-1/content/like/hello%20world");
    });
});
