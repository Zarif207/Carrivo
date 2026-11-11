// Lets node --test import src modules the way Next resolves them: the "@/" alias and extensionless
// relative imports (both resolve to .ts/.tsx files). Type-only imports are erased by Node anyway.
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
