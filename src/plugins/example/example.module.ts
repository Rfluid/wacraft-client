import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { routes } from "./example.routes";
import { CampaignsComponent } from "./campaigns/campaigns.component";

@NgModule({
    imports: [CommonModule, CampaignsComponent, RouterModule.forChild(routes)],
    declarations: [],
    exports: [RouterModule],
})
export class PluginExampleModule {}
