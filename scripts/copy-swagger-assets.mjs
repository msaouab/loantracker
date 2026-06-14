// Copies Swagger UI assets from the swagger-ui-dist dependency into public/swagger
// so the API docs are served same-origin (no external CDN / supply-chain risk).
// Runs on postinstall and before build.
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const srcDir = dirname(require.resolve("swagger-ui-dist/swagger-ui.css"));
const outDir = join(process.cwd(), "public", "swagger");

const files = [
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
];

await mkdir(outDir, { recursive: true });
await Promise.all(
  files.map((file) => copyFile(join(srcDir, file), join(outDir, file)))
);

console.log(`Copied ${files.length} Swagger UI assets to public/swagger/`);
