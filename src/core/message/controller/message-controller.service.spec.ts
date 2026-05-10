import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import axios, { AxiosInstance } from "axios";
import { Subject } from "rxjs";

import { MessageControllerService } from "./message-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";

describe("MessageControllerService", () => {
    let service: MessageControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("accessToken", "tok");
        http = jasmine.createSpyObj<AxiosInstance>(
            "AxiosInstance",
            ["get", "post", "put", "delete"],
            {
                interceptors: { response: { use: () => 0 } } as never,
                defaults: { headers: {} },
            } as never,
        );
        http.get.and.resolveTo({ data: [] });
        http.post.and.resolveTo({ data: { success: true } });
        spyOn(axios, "create").and.returnValue(http);

        TestBed.configureTestingModule({
            providers: [
                MessageControllerService,
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
        service = TestBed.inject(MessageControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("sendWhatsAppMessage POSTs to /whatsapp", async () => {
        await service.sendWhatsAppMessage({} as never);
        expect(http.post).toHaveBeenCalledWith("whatsapp", {});
    });

    it("contentLike URL-encodes the likeText into the path", async () => {
        await service.contentLike("hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("/content/like/hello%20world");
    });

    it("contentLike merges query/pagination/order into params", async () => {
        await service.contentLike("x", { id: "y" } as never, { limit: 5, offset: 0 });
        const params = (http.get.calls.mostRecent().args[1] as { params: Record<string, unknown> })
            .params;
        expect(params).toEqual(jasmine.objectContaining({ id: "y", limit: 5, offset: 0 }));
    });

    it("contentKeyLike encodes both keyName and likeText", async () => {
        await service.contentKeyLike("key with space", "hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("content/key%20with%20space/like/hello%20world");
    });

    it("getWamId encodes the wamId into the path", async () => {
        await service.getWamId("WAM:abc/def");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("whatsapp/wam-id/WAM%3Aabc%2Fdef");
    });

    it("markConversationAsReadToUser POSTs with no body and merged params", async () => {
        await service.markConversationAsReadToUser({}, { limit: 1, offset: 0 });
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toBe("whatsapp/mark-as-read");
        expect(args[1]).toBeUndefined();
        expect((args[2] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 1, offset: 0 }),
        );
    });

    it("sendTypingToUser POSTs to /whatsapp/send-typing", async () => {
        await service.sendTypingToUser();
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toBe("whatsapp/send-typing");
    });

    it("count GETs the count endpoint with merged query/order/whereDate", async () => {
        http.get.and.resolveTo({ data: 42 });
        const n = await service.count({ id: "x" } as never, {}, {});
        expect(http.get).toHaveBeenCalledWith(
            "count",
            jasmine.objectContaining({
                params: jasmine.objectContaining({ id: "x" }),
            }),
        );
        expect(n).toBe(42);
    });

    it("countContentLike encodes the likeText", async () => {
        await service.countContentLike("hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("/count/content/like/hello%20world");
    });

    it("countContentKeyLike encodes both segments", async () => {
        await service.countContentKeyLike("key/with-slash", "hello world");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("/count/content/key%2Fwith-slash/like/hello%20world");
    });
});
