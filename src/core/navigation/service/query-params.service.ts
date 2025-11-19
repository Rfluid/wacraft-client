import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class QueryParamsService {
    private router = inject(Router);

    // Global query params
    public sidebarOpen = false; // Handled by query params.
    closeSidebar() {
        this.router.navigate([], {
            queryParams: {
                sidebar_open: false,
            },
            preserveFragment: true,
            queryParamsHandling: "merge",
        });
    }
    openSidebar() {
        this.router.navigate([], {
            queryParams: {
                sidebar_open: true,
            },
            preserveFragment: true,
            queryParamsHandling: "merge",
        });
    }

    get globalQueryParams() {
        return {
            sidebar_open: this.sidebarOpen,
        };
    }
}
