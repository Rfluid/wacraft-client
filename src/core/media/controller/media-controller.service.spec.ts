import { TestBed } from "@angular/core/testing";
import { AxiosInstance } from "axios";
import { DomSanitizer } from "@angular/platform-browser";

import { MediaControllerService } from "./media-controller.service";
import { setupControllerHttp } from "../../../testing";

describe("MediaControllerService", () => {
    let service: MediaControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;
    let sanitizer: jasmine.SpyObj<DomSanitizer>;
    let createObjectURLSpy: jasmine.Spy;

    beforeEach(() => {
        http = setupControllerHttp();
        sanitizer = jasmine.createSpyObj<DomSanitizer>("DomSanitizer", ["sanitize"]);
        sanitizer.sanitize.and.returnValue("blob:safe-url");
        createObjectURLSpy = spyOn(window.URL, "createObjectURL").and.returnValue(
            "blob:original-url",
        );
        TestBed.overrideProvider(DomSanitizer, { useValue: sanitizer });
        service = TestBed.inject(MediaControllerService);
    });

    afterEach(() => localStorage.clear());

    it("getMediaUrl GETs the path/{mediaId}", async () => {
        await service.getMediaUrl("media-1");
        const url = http.get.calls.mostRecent().args[0] as string;
        expect(url).toContain("media-1");
    });

    it("downloadMediaById GETs the /download/{id} blob and produces a SafeUrl", async () => {
        const blob = new Blob(["x"]);
        http.get.and.resolveTo({ data: blob });
        const url = await service.downloadMediaById("media-1");
        const args = http.get.calls.mostRecent().args;
        expect(args[0]).toBe("/download/media-1");
        expect((args[1] as { responseType: string }).responseType).toBe("blob");
        expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
        expect(sanitizer.sanitize).toHaveBeenCalled();
        expect(url).toBe("blob:safe-url");
    });

    it("downloadMediaByInfo POSTs to /media-info/download with the media info", async () => {
        http.post.and.resolveTo({ data: new Blob() });
        await service.downloadMediaByInfo({ id: "x" } as never);
        expect(http.post.calls.mostRecent().args[0]).toBe("/media-info/download");
    });

    it("uploadMedia POSTs FormData with multipart/form-data header", async () => {
        http.post.and.resolveTo({ data: { id: "uploaded" } });
        const file = new File(["x"], "f.png");
        const out = await service.uploadMedia(file, "image/png");
        expect(out).toEqual({ id: "uploaded" });
        const args = http.post.calls.mostRecent().args;
        expect(args[0]).toBe("/upload");
        expect((args[1] as FormData) instanceof FormData).toBe(true);
        expect((args[2] as { headers: Record<string, string> }).headers).toEqual(
            jasmine.objectContaining({ "Content-Type": "multipart/form-data" }),
        );
    });
});
