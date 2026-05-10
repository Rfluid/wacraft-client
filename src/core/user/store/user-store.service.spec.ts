import { TestBed } from "@angular/core/testing";
import { NGXLogger } from "ngx-logger";

import { UserStoreService } from "./user-store.service";
import { UserControllerService } from "../controller/user-controller.service";
import { User } from "../entity/user.entity";
import { Role } from "../model/role.model";
import { MockLogger, defer, drain } from "../../../testing";

function user(id: string, name = id, email = `${id}@x`, role = Role.user): User {
    return {
        id,
        name,
        email,
        role,
        password: "",
        created_at: new Date(),
        updated_at: new Date(),
    };
}

describe("UserStoreService", () => {
    let store: UserStoreService;
    let ctl: jasmine.SpyObj<UserControllerService>;

    beforeEach(() => {
        ctl = jasmine.createSpyObj<UserControllerService>("UserControllerService", [
            "get",
            "contentLike",
            "getCurrentUser",
        ]);
        ctl.get.and.resolveTo([]);
        ctl.contentLike.and.resolveTo([]);
        ctl.getCurrentUser.and.resolveTo({
            user: user("me"),
            billingEnabled: false,
        } as never);

        TestBed.configureTestingModule({
            providers: [
                UserStoreService,
                { provide: UserControllerService, useValue: ctl },
                { provide: NGXLogger, useClass: MockLogger },
            ],
        });
        store = TestBed.inject(UserStoreService);
    });

    describe("get() pagination", () => {
        it("offsets the next call by current users.length", async () => {
            ctl.get.and.callFake(async (_filter, paginate) => {
                if (paginate?.offset === 0) return [user("u1"), user("u2")];
                return [user("u3")];
            });

            await store.get();
            expect(store.users.map(u => u.id)).toEqual(["u1", "u2"]);

            await store.get();
            expect(store.users.map(u => u.id)).toEqual(["u1", "u2", "u3"]);

            const offsets = ctl.get.calls.allArgs().map(a => a[1]?.offset);
            expect(offsets).toEqual([0, 2]);
        });

        it("sets reachedMaxLimit when no results", async () => {
            ctl.get.and.resolveTo([]);
            await store.get();
            expect(store.reachedMaxLimit).toBe(true);
        });

        it("populates usersById alongside users[]", async () => {
            ctl.get.and.resolveTo([user("u1"), user("u2")]);
            await store.get();
            expect(store.usersById.get("u1")?.id).toBe("u1");
        });

        it("serializes two concurrent get() calls", async () => {
            const gate = defer<User[]>();
            ctl.get.and.callFake(async (_filter, paginate) => {
                if (paginate?.offset === 0) return gate.promise;
                return [user("u3")];
            });

            const p1 = store.get();
            const p2 = store.get();
            await drain();

            gate.resolve([user("u1"), user("u2")]);
            await Promise.all([p1, p2]);

            expect(ctl.get.calls.allArgs().map(a => a[1]?.offset)).toEqual([0, 2]);
            expect(store.users.map(u => u.id)).toEqual(["u1", "u2", "u3"]);
        });
    });

    describe("getCurrent / loadCurrent", () => {
        it("getCurrent stashes the user, marks billingEnabled, and caches in usersById", async () => {
            ctl.getCurrentUser.and.resolveTo({
                user: user("me", "Me", "me@x", Role.admin),
                billingEnabled: true,
            } as never);

            const u = await store.getCurrent();
            expect(u.id).toBe("me");
            expect(store.currentUser.id).toBe("me");
            expect(store.billingEnabled).toBe(true);
            expect(store.usersById.get("me")?.id).toBe("me");
            // Password is scrubbed.
            expect(u.password).toBe("");
        });

        it("loadCurrent skips fetching when currentUser is already set", async () => {
            store.currentUser = user("preset");
            await store.loadCurrent();
            expect(ctl.getCurrentUser).not.toHaveBeenCalled();
        });

        it("loadCurrent swallows errors", async () => {
            ctl.getCurrentUser.and.rejectWith(new Error("net"));
            await store.loadCurrent();
            // No throw.
            expect(store.currentUser).toBeUndefined();
        });
    });

    describe("search pagination", () => {
        beforeEach(() => {
            store.searchValue = "needle";
        });

        it("getInitialSearch resets and appends", async () => {
            store.searchUsers = [user("stale")];
            ctl.contentLike.and.resolveTo([user("u1")]);
            await store.getInitialSearch();
            expect(store.searchUsers.map(u => u.id)).toEqual(["u1"]);
        });

        it("getSearch paginates by current searchUsers.length", async () => {
            ctl.contentLike.and.callFake(async (_q, _mode, _filter, paginate) => {
                if (paginate?.offset === 0) return [user("u1"), user("u2")];
                return [user("u3")];
            });

            await store.getInitialSearch();
            await store.getSearch();
            expect(store.searchUsers.map(u => u.id)).toEqual(["u1", "u2", "u3"]);
            expect(ctl.contentLike.calls.allArgs().map(a => a[3]?.offset)).toEqual([0, 2]);
        });

        it("reachedMaxSearchLimit on empty result", async () => {
            ctl.contentLike.and.resolveTo([]);
            await store.getInitialSearch();
            expect(store.reachedMaxSearchLimit).toBe(true);
        });
    });

    describe("getInitialSearchConcurrent — debounce", () => {
        it("collapses bursts into one trailing run", async () => {
            store.searchValue = "needle";
            const gate1 = defer<User[]>();
            const gate2 = defer<User[]>();
            let n = 0;
            ctl.contentLike.and.callFake(async () => {
                n++;
                return n === 1 ? gate1.promise : gate2.promise;
            });

            store.getInitialSearchConcurrent();
            await drain();
            expect(store.isExecuting).toBe(true);

            store.getInitialSearchConcurrent();
            store.getInitialSearchConcurrent();
            expect(store.pendingExecution).toBe(true);

            gate1.resolve([]);
            await drain();
            expect(n).toBe(2);
            expect(store.pendingExecution).toBe(false);

            gate2.resolve([]);
            await drain();
            expect(store.isExecuting).toBe(false);
        });

        it("does nothing when searchValue is empty", () => {
            store.getInitialSearchConcurrent();
            expect(ctl.contentLike).not.toHaveBeenCalled();
        });
    });

    describe("CRUD under listMutex", () => {
        it("prependUser dedupes and places at front", async () => {
            store.users = [user("u1"), user("u2")];
            await store.prependUser(user("u2", "renamed"));
            expect(store.users.map(u => u.id)).toEqual(["u2", "u1"]);
            expect(store.users[0].name).toBe("renamed");
        });

        it("prependUser mirrors into searchUsers when matchesCurrentSearch", async () => {
            store.searchValue = "alpha";
            store.searchMode = "name";
            await store.prependUser(user("a1", "alpha-pers"));
            expect(store.searchUsers.map(u => u.id)).toEqual(["a1"]);
        });

        it("syncUser replaces in users and searchUsers", async () => {
            store.users = [user("u1", "old")];
            store.searchUsers = [user("u1", "old")];
            await store.syncUser(user("u1", "new"));
            expect(store.users[0].name).toBe("new");
            expect(store.searchUsers[0].name).toBe("new");
        });

        it("syncUser inserts into searchUsers if not present but matchesCurrentSearch", async () => {
            store.searchValue = "alpha";
            store.searchMode = "name";
            store.users = [user("a1", "alpha")];
            await store.syncUser(user("a1", "alpha-renamed"));
            expect(store.searchUsers.map(u => u.id)).toEqual(["a1"]);
        });

        it("removeUser drops from all three stores", async () => {
            store.users = [user("u1"), user("u2")];
            store.searchUsers = [user("u1")];
            store.usersById.set("u1", user("u1"));
            await store.removeUser("u1");
            expect(store.users.map(u => u.id)).toEqual(["u2"]);
            expect(store.searchUsers).toEqual([]);
            expect(store.usersById.has("u1")).toBe(false);
        });
    });

    describe("getById caching", () => {
        it("returns cached user without controller call", async () => {
            store.usersById.set("u1", user("u1"));
            const result = await store.getById("u1");
            expect(result.id).toBe("u1");
            expect(ctl.get).not.toHaveBeenCalled();
        });

        it("fetches and caches on miss", async () => {
            ctl.get.and.resolveTo([user("u9")]);
            const result = await store.getById("u9");
            expect(result.id).toBe("u9");
            expect(store.usersById.get("u9")?.id).toBe("u9");
        });
    });

    describe("matchesCurrentSearch behavior across modes", () => {
        it("name mode matches case-insensitively", async () => {
            store.searchValue = "BoB";
            store.searchMode = "name";
            await store.prependUser(user("u1", "Bob Smith"));
            expect(store.searchUsers.length).toBe(1);
        });

        it("email mode matches case-insensitively", async () => {
            store.searchValue = "ALPHA";
            store.searchMode = "email";
            await store.prependUser(user("u1", "x", "alpha@y"));
            expect(store.searchUsers.length).toBe(1);
        });

        it("never matches when filters are active", async () => {
            store.searchValue = "alpha";
            store.searchMode = "name";
            store.searchFilters = [{ text: "f1" }];
            await store.prependUser(user("u1", "alpha"));
            expect(store.searchUsers.length).toBe(0);
        });
    });
});
