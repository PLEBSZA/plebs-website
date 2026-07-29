import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageJson = require.resolve("neonctl/package.json");
const cli = join(dirname(packageJson), "bin", "cli.js");

const fileArgIndex = process.argv.indexOf("--file");
const payload =
  fileArgIndex >= 0
    ? readFileSync(process.argv[fileArgIndex + 1], "utf8")
    : process.argv[2];

if (!payload) {
  console.error("Usage: node scripts/neon-init-step.mjs --file <path.json>");
  process.exit(1);
}

JSON.parse(payload);

const result = spawnSync(process.execPath, [cli, "init", "--agent", "--data", payload], {
  encoding: "utf8",
  env: process.env,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
