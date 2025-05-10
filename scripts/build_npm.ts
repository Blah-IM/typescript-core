import { build, emptyDir } from "@deno/dnt";
import denoJson from "../deno.json" with { type: "json" };

await emptyDir("./npm");

await build({
  entryPoints: [
    { name: "./crypto", path: "crypto/mod.ts" },
    { name: "./identity", path: "identity/mod.ts" },
    { name: "./richText", path: "richText/mod.ts" },
  ],
  outDir: "./npm",
  importMap: "deno.json",
  compilerOptions: {
    lib: ["ESNext", "DOM"],
  },
  shims: {
    deno: {
      test: "dev",
    },
    crypto: false,
    webSocket: true,
  },
  package: {
    // package.json properties
    name: "@blah-im/core",
    version: denoJson.version,
    description: "Core logic & types for Blah IM.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/Blah-IM/typescript-core.git",
    },
    bugs: {
      url: "https://github.com/Blah-IM/typescript-core/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
