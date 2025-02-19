#! /usr/bin/env node

import { Command } from "commander";
import { input, select, confirm } from "@inquirer/prompts";
import { Chalk } from "chalk";
import { resolve } from "node:path";
import {
    existsSync,
    statSync,
    rmSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    copyFileSync,
    writeFileSync
} from "node:fs";
import { fileURLToPath } from "node:url";
import ora from "ora";

const program = new Command();
const chalk = new Chalk({ level: 2 });

program
    .name("create-silence")
    .description("create a silence template")
    .usage("<command> [options]")
    .version("1.0.0");

program
    .argument("[projectName]", "the project name")
    .option("--template <template>", "the template type")
    .action(init);

program.parse();

type CommandOptions = {
    template?: "javascript" | "typescript";
};
type PromptOptions = {
    projectName?: string;
    overwrite?: boolean;
    rename?: string;
    type?: CommandOptions["template"];
    preprocessor?: "sass" | "less" | "none";
    framework?: "vue" | "react" | "library";
};

async function init(projectName?: string, options?: CommandOptions) {
    process.on("uncaughtException", (error) => {
        if (error instanceof Error && error.name === "ExitPromptError") {
            console.log("👋 until next time!");
        } else {
            console.log(
                chalk.red.bold.italic("An error occurred: " + error.message)
            );
            process.exit(1);
        }
    });

    if (
        options?.template &&
        options.template !== "javascript" &&
        options.template !== "typescript"
    ) {
        console.log(
            chalk.red.bold.italic(
                "Please input correct template, such as javascript or typescript"
            )
        );
        process.exit(0);
    }

    const answers: PromptOptions = {};
    const rootDir = fileURLToPath(new URL("../", import.meta.url));
    const targetDir = process.cwd();

    if (!projectName) {
        answers.projectName = await input({
            message: "Input the project name",
            validate: (value) => {
                if (value.trim() === "") {
                    return "Project name cannot be empty!";
                }
                return true;
            }
        });
    }
    if (existsSync(resolve(targetDir, projectName || answers.projectName!))) {
        answers.overwrite = await confirm({
            message: "The directory already exists, do you want to overwrite it"
        });
    }
    if (answers.overwrite !== undefined && answers.overwrite === false) {
        answers.rename = await input({
            message: "Please edit the project name",
            validate: (value) => {
                if (value.trim() === "") {
                    return "Project name cannot be empty!";
                }
                if (value === projectName || value === answers.projectName) {
                    return "Please change the project name";
                }
                return true;
            },
            default: projectName || answers.projectName
        });
    }
    answers.framework = await select({
        message: "Select a framework",
        choices: ["vue", "react", "library"]
    });
    if (answers.framework !== "library") {
        if (!options?.template) {
            answers.type = await select({
                message: "Select the language type",
                choices: ["javascript", "typescript"]
            });
        }
        answers.preprocessor = await select({
            message: "Select css preprocessor",
            choices: ["sass", "less", "none"]
        });
    }

    console.log("\n");
    const loading = ora("generating template...");
    loading.start();

    const {
        projectName: _projectName = projectName,
        overwrite,
        rename,
        type = options?.template,
        framework,
        preprocessor
    } = answers;

    let name = _projectName!;
    if (overwrite !== undefined) {
        if (overwrite === true) {
            const projectPath = resolve(targetDir, name);
            try {
                rmSync(projectPath, {
                    recursive: true,
                    force: true
                });
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "EBUSY") {
                    loading.fail(
                        chalk.red.bold.italic(
                            "The directory has been opened, please close and try again"
                        )
                    );
                } else if ((error as NodeJS.ErrnoException).code === "EPERM") {
                    loading.fail(
                        chalk.red.bold.italic(
                            "Do not have permission to operate this directory"
                        )
                    );
                } else {
                    loading.fail(
                        chalk.red.bold.italic(
                            "Overwrite the directory failed: " +
                                (error as Error).message
                        )
                    );
                }
                process.exit(0);
            }
        } else {
            name = rename!;
        }
    }

    const projectPath = resolve(targetDir, name);
    const templatePath = resolve(
        rootDir,
        `templates/${framework}${type === "typescript" ? "-" + type : ""}`
    );

    mkdirSync(projectPath, { recursive: true });

    const write = (path: string, content?: string) => {
        const targetPath = resolve(projectPath, path);
        if (content) {
            writeFileSync(targetPath, content);
        } else {
            copy(resolve(templatePath, path), targetPath);
        }
    };

    readdirSync(templatePath).forEach((file) => {
        if (file !== "package.json") write(file);
    });

    const pkg = JSON.parse(
        readFileSync(resolve(templatePath, "package.json"), "utf-8")
    );
    pkg.name = name;

    if (framework !== "library") {
        let config = readFileSync(
            resolve(
                templatePath,
                `silence.config.${type === "javascript" ? "js" : "ts"}`
            ),
            "utf-8"
        );
        if (preprocessor === "sass") {
            pkg.devDependencies["sass"] = "^1.83.4";
            pkg.devDependencies["sass-loader"] = "^16.0.4";
            config = config.replace(
                'preprocessor: "none"',
                'preprocessor: "sass"'
            );
        }
        if (preprocessor === "less") {
            pkg.devDependencies["less"] = "^4.2.2";
            pkg.devDependencies["less-loader"] = "^12.2.0";
            config = config.replace(
                'preprocessor: "none"',
                'preprocessor: "less"'
            );
        }
        write(`silence.config.${type === "javascript" ? "js" : "ts"}`, config);
    }

    write("package.json", JSON.stringify(pkg, null, 4) + "\n");

    loading.succeed("Create project successfully\n");

    console.log("\t" + chalk.green.bold.italic("cd " + name));
    console.log("\t" + chalk.green.bold.italic("npm install"));
    framework !== "library" &&
        console.log("\t" + chalk.green.bold.italic("npm run dev"));
    console.log("\n");
}

function copyDir(srcDir: string, destDir: string) {
    mkdirSync(destDir, { recursive: true });
    for (const file of readdirSync(srcDir)) {
        const srcFile = resolve(srcDir, file);
        const destFile = resolve(destDir, file);
        copy(srcFile, destFile);
    }
}

function copy(src: string, dest: string) {
    const stat = statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
    } else {
        copyFileSync(src, dest);
    }
}
