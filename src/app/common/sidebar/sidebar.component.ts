import { CommonModule } from "@angular/common";
import { Component, HostListener, Input, OnInit } from "@angular/core";
import { SmallButtonComponent } from "../small-button/small-button.component";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { UserControllerService } from "../../../core/user/controller/user-controller.service";
import { Role } from "../../../core/user/model/role.model";
import { QueryParamsService } from "../../../core/navigation/service/query-params.service";
import { UserStoreService } from "../../../core/user/store/user-store.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RoutePath } from "../../app.routes";
import { HomeFragment } from "../../home/model/home-fragment.model";
import { NavItem } from "./model/nav-item.model";
import { ShortcutsComponent } from "../../shortcuts/shortcuts.component";
import { environment } from "../../../environments/environment";

@Component({
    selector: "app-sidebar",
    imports: [
        CommonModule,
        SmallButtonComponent,
        MatTooltipModule,
        RouterModule,
        ShortcutsComponent,
    ],
    templateUrl: "./sidebar.component.html",
    styleUrl: "./sidebar.component.scss",
    standalone: true,
})
export class SidebarComponent implements OnInit {
    // Global variables that are used in HTML and we need to define here.
    environment = environment;
    Role = Role;
    HomeFragment: typeof HomeFragment = HomeFragment;
    RoutePath = RoutePath;

    @Input() activePage: RoutePath | HomeFragment = RoutePath.home;

    // URL handled variables.

    constructor(
        private route: ActivatedRoute,
        public queryParamsService: QueryParamsService,
        public userController: UserControllerService,
        public userStore: UserStoreService,
        private router: Router,
    ) {}

    async ngOnInit() {
        this.watchQueryParams();
    }

    watchQueryParams() {
        // Watch for sidebar query param and update.
        this.route.queryParams.subscribe(async params => {
            this.queryParamsService.sidebarOpen = params["sidebar_open"] !== "false";
        });
    }

    get isCollapsed(): boolean {
        return [RoutePath.account, RoutePath.automation].includes(this.activePage as RoutePath);
    }

    get navItems(): NavItem[] {
        return [
            {
                route: ["/", RoutePath.home],
                fragment: HomeFragment.chats,
                visible: () => true,
            },
            {
                route: ["/", RoutePath.home],
                fragment: HomeFragment.templates,
                visible: () => true,
            },
            {
                route: ["/", RoutePath.home],
                fragment: HomeFragment.campaigns,
                visible: () => true,
            },
            {
                route: ["/", RoutePath.automation],
                visible: () =>
                    !!this.userStore.currentUser &&
                    [Role.admin, Role.developer, Role.automation].includes(
                        this.userStore.currentUser.role,
                    ),
            },
            {
                route: ["/", RoutePath.webhooks],
                visible: () =>
                    !!this.userStore.currentUser &&
                    [Role.admin, Role.developer, Role.automation].includes(
                        this.userStore.currentUser.role,
                    ),
            },
            {
                route: ["/", RoutePath.users],
                visible: () =>
                    !!this.userStore.currentUser && this.userStore.currentUser.role === Role.admin,
            },
            {
                route: ["/", RoutePath.account],
                visible: () => true, // “account” goes at the bottom
            },
        ].filter(x => x.visible());
    }

    showShortcuts = false;
    @HostListener("window:keydown", ["$event"])
    handleHotkeys(e: KeyboardEvent) {
        // ignore while typing in inputs/textareas/content-editable
        if ((e.ctrlKey || e.metaKey) && e.key === "/") {
            e.preventDefault();
            this.showShortcuts = !this.showShortcuts;
            return;
        }
        const t = e.target as HTMLElement;
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) {
            return;
        }

        const idx = Number(e.key); // “1”, “2”, …
        if (idx === 0)
            return this.queryParamsService.sidebarOpen
                ? this.queryParamsService.closeSidebar()
                : this.queryParamsService.openSidebar();
        if (!idx) return;
        if (idx > this.navItems.length) return;

        e.preventDefault();
        const item = this.navItems[idx - 1];
        this.router.navigate(item.route, {
            fragment: item.fragment,
            queryParams: this.queryParamsService.globalQueryParams,
            queryParamsHandling: "replace",
        });
    }
}
