import { defineConfig } from "silence-cli";
import { fileURLToPath } from "node:url";

export default defineConfig({
    entry: fileURLToPath(new URL("./src/main.js", import.meta.url)),
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    devServer: {
        hot: true,
        historyApiFallback: true
    },
    framework: "react",
    css: {
        preprocessor: "none"
    }
});
