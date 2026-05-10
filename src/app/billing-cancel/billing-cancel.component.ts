import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SidebarLayoutComponent } from "../common/sidebar-layout/sidebar-layout.component";
import { RoutePath } from "../../core/common/constant/route-path.enum";

@Component({
    selector: "app-billing-cancel",
    imports: [CommonModule, RouterModule, SidebarLayoutComponent],
    templateUrl: "./billing-cancel.component.html",
    standalone: true,
})
export class BillingCancelComponent {
    RoutePath = RoutePath;
}
