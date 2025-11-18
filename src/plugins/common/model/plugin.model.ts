import { PluginExampleModule } from "../../example/example.module";

export interface Plugin {
    name: string;
    path: string; // base path in router
    moduleLoader: () => Promise<PluginExampleModule>; // for loadChildren
}
