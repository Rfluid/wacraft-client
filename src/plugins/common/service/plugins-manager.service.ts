import { Injectable } from "@angular/core";
import { Plugin } from "../model/plugin.model";
import { pluginsConfig } from "../../../plugins-config/plugins-config.development";
import { exampleSpecs } from "../../example/example.plugin";

@Injectable({
    providedIn: "root",
})
export class PluginsManagerService {
    public plugins: Plugin[] = [];

    loadPlugins() {
        if (pluginsConfig.example) this.loadPlugin(exampleSpecs);
    }

    loadPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }
}
