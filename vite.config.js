import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
    const isBrowser = mode.startsWith("browser");
    const isMin = mode.endsWith("-min");

    return {
        build: {
            emptyOutDir: false,
            minify: isMin ? "terser" : false,

            lib: {
                entry: resolve(
                    __dirname,
                    isBrowser
                        ? "src/entry-browser.js"
                        : "src/tournament-bracket.js"
                ),
                name: "tournamentBracket",
                formats: [isBrowser ? "umd" : "es"],
                fileName: () =>
                    isBrowser
                        ? "tournament-bracket.js"
                        : "tournament-bracket.esm.js",
            }
        }
    };
});
