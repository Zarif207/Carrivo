import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = new URL(specifier.slice(2), SRC);
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith(SRC.href) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    base = new URL(specifier, context.parentURL);
  }
  if (base) {
    for (const ext of EXTENSIONS) {
      const candidate = new URL(`${base.href}${ext}`);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
  }
  return next(specifier, context);
}
