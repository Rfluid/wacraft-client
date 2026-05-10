import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import axios, { AxiosInstance } from "axios";

import { UserControllerService } from "./user-controller.service";
import { AuthService } from "../../auth/service/auth.service";
import { WorkspaceContextService } from "../../workspace/store/workspace-context.service";
import { Role } from "../model/role.model";
import { User } from "../entity/user.entity";

describe("UserControllerService", () => {
    let service: UserControllerService;
    let http: jasmine.SpyObj<AxiosInstance>;
    let router: jasmine.SpyObj<Router>;

    const sampleUser: User = {
        id: "u1",
        name: "Alice",
        email: "alice@x",
        password: "",
        role: Role.user,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("accessToken", "tok");

        http = jasmine.createSpyObj<AxiosInstance>(
            "AxiosInstance",
            ["get", "post", "put", "delete"],
            {
                interceptors: {
                    response: { use: () => 0 },
                    request: { use: () => 0 },
                } as never,
                defaults: { headers: {} },
            } as never,
        );
        // Default OK responses
        http.get.and.resolveTo({ data: [], headers: {} });
        http.post.and.resolveTo({ data: undefined });
        http.put.and.resolveTo({ data: undefined });
        http.delete.and.resolveTo({ data: undefined });

        spyOn(axios, "create").and.returnValue(http);

        router = jasmine.createSpyObj<Router>("Router", ["navigate"], {
            events: new Subject<unknown>(),
            url: "/somewhere",
        } as never);
        const authToken = new Subject<string>();
        const workspaceChanged = new Subject<string>();

        TestBed.configureTestingModule({
            providers: [
                UserControllerService,
                { provide: AuthService, useValue: { token: authToken } },
                {
                    provide: WorkspaceContextService,
                    useValue: { currentWorkspaceId: null, workspaceChanged },
                },
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(UserControllerService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe("get", () => {
        it("issues GET on the root path with merged query/pagination/order/whereDate params", async () => {
            http.get.and.resolveTo({ data: [sampleUser], headers: {} });
            const result = await service.get(
                { id: "u1" },
                { limit: 5, offset: 10 },
                { created_at: "asc" as never },
                { created_at_geq: "2020-01-01" as never },
            );
            expect(result).toEqual([sampleUser]);
            expect(http.get).toHaveBeenCalledWith("", {
                params: {
                    id: "u1",
                    limit: 5,
                    offset: 10,
                    created_at: "asc",
                    created_at_geq: "2020-01-01",
                },
            });
        });

        it("uses defaults when no args are passed", async () => {
            await service.get();
            expect(http.get).toHaveBeenCalledWith("", {
                params: { limit: 10, offset: 0 },
            });
        });
    });

    describe("getCurrentUser", () => {
        it("returns user and detects billingEnabled when x-ratelimit-limit header is present", async () => {
            http.get.and.resolveTo({
                data: sampleUser,
                headers: { "x-ratelimit-limit": "1000" },
            });
            const result = await service.getCurrentUser();
            expect(result.user).toEqual(sampleUser);
            expect(result.billingEnabled).toBe(true);
            expect(http.get).toHaveBeenCalledWith("me");
        });

        it("returns billingEnabled=false when the header is absent", async () => {
            http.get.and.resolveTo({ data: sampleUser, headers: {} });
            const result = await service.getCurrentUser();
            expect(result.billingEnabled).toBe(false);
        });
    });

    describe("contentLike", () => {
        it("URL-encodes both likeKey and likeText into the path", async () => {
            await service.contentLike("hello world", "name");
            const args = http.get.calls.mostRecent().args;
            expect(args[0]).toBe("content/name/like/hello%20world");
        });

        it("forwards query / pagination / order / whereDate as merged params", async () => {
            await service.contentLike("x", "name", { foo: "bar" } as never, {
                limit: 5,
                offset: 0,
            });
            const args = http.get.calls.mostRecent().args;
            expect(args[1]?.params).toEqual(
                jasmine.objectContaining({ foo: "bar", limit: 5, offset: 0 }),
            );
        });
    });

    describe("create / update / delete", () => {
        it("create POSTs the payload at root", async () => {
            http.post.and.resolveTo({ data: sampleUser });
            const out = await service.create({
                name: "Alice",
                email: "alice@x",
                password: "p",
            } as never);
            expect(out).toEqual(sampleUser);
            expect(http.post).toHaveBeenCalledWith("", jasmine.any(Object));
        });

        it("update PUTs at root", async () => {
            await service.update({ id: "u1" } as never);
            expect(http.put).toHaveBeenCalledWith("", { id: "u1" });
        });

        it("updateCurrentUser PUTs at /me", async () => {
            await service.updateCurrentUser({} as never);
            expect(http.put).toHaveBeenCalledWith("me", {} as never);
        });

        it("delete sends DELETE with body { id }", async () => {
            await service.delete("u1");
            expect(http.delete).toHaveBeenCalledWith("", { data: { id: "u1" } });
        });

        it("deleteCurrentUser DELETEs /me", async () => {
            await service.deleteCurrentUser();
            expect(http.delete).toHaveBeenCalledWith("me");
        });
    });
});
