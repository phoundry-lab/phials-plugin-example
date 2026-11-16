import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRelease } from "./release.logic";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = await verifyRelease(root);
console.log(
  `Verified ${inventory.identity.id}@${inventory.identity.version}: ${inventory.candidate.sha256}`,
);
