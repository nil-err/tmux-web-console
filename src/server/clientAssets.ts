import path from "node:path";

export function resolveClientDist(projectRoot = process.cwd()): string {
  return path.join(projectRoot, "dist/client");
}
