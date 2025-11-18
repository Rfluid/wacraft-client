import { Plugin } from "../common/model/plugin.model";

export const exampleSpecs: Plugin = {
    name: "VMlav",
    path: "example",
    moduleLoader: () => import("./example.module").then(m => m.PluginExampleModule),
};
