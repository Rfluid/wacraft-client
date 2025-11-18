import { Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { userGuard } from "./../core/auth/guard/user.guard";
import { HomeComponent } from "./home/home.component";
import { PluginsManagerService } from "../plugins/common/service/plugins-manager.service";
import { AccountComponent } from "./account/account.component";
import { WebhooksComponent } from "./webhooks/webhooks.component";
import { UsersComponent } from "./users/users.component";
import { AutomationComponent } from "./automation/automation.component";
import { environment } from "../environments/environment";

export enum RoutePath {
    home = "home",
    account = "account",
    auth = "auth",
    login = "login",
    webhooks = "webhooks",
    users = "users",
    automation = "automation",
}

export const routes: Routes = [
    {
        path: `${RoutePath.auth}/${RoutePath.login}`,
        component: LoginComponent,
    },
    {
        path: RoutePath.home,
        component: HomeComponent,
        canActivate: [userGuard],
    },
    {
        path: RoutePath.account,
        component: AccountComponent,
        canActivate: [userGuard],
    },
    {
        path: RoutePath.webhooks,
        component: WebhooksComponent,
        canActivate: [userGuard],
    },
    {
        path: RoutePath.users,
        component: UsersComponent,
        canActivate: [userGuard],
    },
    environment.isLite
        ? {
              path: RoutePath.automation,
              pathMatch: "full",
          }
        : {
              path: RoutePath.automation,
              component: AutomationComponent,
              canActivate: [userGuard],
          },
    {
        path: "",
        redirectTo: RoutePath.home,
        pathMatch: "full",
    },
];

export function routesWithPluginsFactory(pluginManager: PluginsManagerService): Routes {
    pluginManager.loadPlugins(); // If synchronous

    const pluginRoutes = pluginManager.plugins.map(plugin => ({
        path: plugin.path,
        loadChildren: plugin.moduleLoader,
    }));

    return [...routes, ...pluginRoutes];
}
