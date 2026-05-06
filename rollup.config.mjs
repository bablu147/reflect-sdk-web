import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
  // IIFE for <script> tag usage (window.ReflectWeb)
  {
    input: "src/index.ts",
    output: {
      file: "dist/reflect-web.umd.js",
      format: "iife",
      name: "_RW",
      sourcemap: true,
      footer: "window.ReflectWeb=_RW.ReflectWeb;",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
  // ESM for bundlers
  {
    input: "src/index.ts",
    output: {
      file: "dist/reflect-web.esm.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
];
