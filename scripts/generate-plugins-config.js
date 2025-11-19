const fs = require("fs");
const path = require("path");

const targetPath = path.join(__dirname, "../src/plugins-config/plugins-config.ts");

// Check if environment.ts already exists
if (fs.existsSync(targetPath)) {
    console.log("plugins-config.ts already exists.");
}

// Template for the environment.ts file
const pluginsConfigFile = `
export const environment = {
    example: ${process.env.EXAMPLE_PLUGIN == "true"},
};
`;

// Write the environment.ts file
fs.writeFile(targetPath, pluginsConfigFile, err => {
    if (err) {
        console.error("Error writing plugins-config.ts:", err);
        process.exit(1);
    }
    console.log(`Plugins configuration successfully written to ${targetPath}`);
});
