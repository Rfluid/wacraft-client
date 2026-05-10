import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { CampaignMessageControllerService } from "./campaign-message-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("CampaignMessageControllerService", () => {
    let service: CampaignMessageControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(CampaignMessageControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get / getSent / getUnsent route to root, /sent, /unsent", async () => {
        await service.get();
        await service.getSent();
        await service.getUnsent();
        const urls = http.get.calls.allArgs().map(a => a[0] as string);
        expect(urls[0]).toBe("");
        expect(urls[1]).toBe("sent");
        expect(urls[2]).toBe("unsent");
    });

    it("count / countSent / countUnsent route to /count, /count/sent, /count/unsent", async () => {
        http.get.and.resolveTo({ data: 5 });
        await service.count();
        await service.countSent();
        await service.countUnsent();
        const urls = http.get.calls.allArgs().map(a => a[0] as string);
        expect(urls[0]).toBe("count");
        expect(urls[1]).toBe("count/sent");
        expect(urls[2]).toBe("count/unsent");
    });

    it("create POSTs at root", async () => {
        await service.create({} as never);
        expect(http.post.calls.mostRecent().args[0]).toBe("");
    });

    it("delete sends DELETE with body { id }", async () => {
        await service.delete("m-1");
        expect(http.delete).toHaveBeenCalledWith("", { data: { id: "m-1" } });
    });
});
