import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";

import { CampaignControllerService } from "./campaign-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("CampaignControllerService", () => {
    let service: CampaignControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;

    beforeEach(() => {
        http = setupControllerHttp();
        service = TestBed.inject(CampaignControllerService);
    });

    afterEach(() => localStorage.clear());

    it("get GETs root with default pagination", async () => {
        await service.get();
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("");
        expect((args[1] as { params: Record<string, unknown> }).params).toEqual(
            jasmine.objectContaining({ limit: 10, offset: 0 }),
        );
    });

    it("contentLike encodes both segments", async () => {
        await service.contentLike("hello world", "name with space");
        const url = http.get.calls.mostRecent().args[0];
        expect(url).toBe("content/name%20with%20space/like/hello%20world");
    });

    it("create POSTs at root", async () => {
        await service.create({ name: "x" } as never);
        expect(http.post.calls.mostRecent().args[0]).toBe("");
    });

    it("update PATCHes at root", async () => {
        await service.update({ id: "c-1" } as never);
        expect(http.patch.calls.mostRecent().args[0]).toBe("");
    });

    it("delete sends DELETE with body { id }", async () => {
        await service.delete("c-1");
        expect(http.delete).toHaveBeenCalledWith("", { data: { id: "c-1" } });
    });

    it("schedule POSTs to /schedule with id + scheduled_at", async () => {
        await service.schedule("c-1", "2024-01-01");
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toBe("schedule");
        expect(args[1]).toEqual({ id: "c-1", scheduled_at: "2024-01-01" });
    });

    it("unschedule sends DELETE on /schedule with body { id }", async () => {
        await service.unschedule("c-1");
        expect(http.delete).toHaveBeenCalledWith("schedule", { data: { id: "c-1" } });
    });
});
