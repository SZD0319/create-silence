import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index.ts"],
    clean: true,
    declaration: false,
    rollup: {
        emitCJS: true
    },
    failOnWarn: false
});
