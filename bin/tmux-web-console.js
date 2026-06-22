#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const binDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(binDir, "..");

process.chdir(packageRoot);

await import("../dist/server/src/server/index.js");
