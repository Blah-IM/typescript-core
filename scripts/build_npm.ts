import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@blah-im/core",
    version: Deno.args[0],
    description: "Core logic & types for Blah IM.",
    license: "GPL-3.0-only",
    repository: {
      type: "git",
      url: "git+https://github.com/blah-im/typescript-core.git",
    },
    bugs: {
      url: "https://github.com/blah-im/typescript-core/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
