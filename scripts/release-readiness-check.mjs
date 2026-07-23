import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  ".env.example",
  "docs/RELEASE.md",
  "docs/SECURITY.md",
  "docs/OPTIMIZATION.md",
  "scripts/load-test-plan.md",
  "apps/mobile/src/infrastructure/offline/OfflineRideQueue.ts",
  "apps/mobile/src/infrastructure/offline/OfflineRideQueueStore.ts",
  "supabase/functions/health-check/index.ts"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of required) {
  assert(existsSync(path.join(root, file)), `Missing release artifact: ${file}`);
}

const envExample = readFileSync(path.join(root, ".env.example"), "utf8");
for (const key of ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"]) {
  assert(envExample.includes(key), `Missing environment key in .env.example: ${key}`);
}

const releaseDoc = readFileSync(path.join(root, "docs/RELEASE.md"), "utf8");
for (const section of ["Release Gates", "Rollback", "Operational Checks"]) {
  assert(releaseDoc.includes(section), `Missing release section: ${section}`);
}

const offlineStore = readFileSync(
  path.join(root, "apps/mobile/src/infrastructure/offline/OfflineRideQueueStore.ts"),
  "utf8"
);
assert(
  offlineStore.includes("AsyncStorageOfflineRideQueueStore"),
  "Missing durable AsyncStorage offline queue store."
);

console.log(
  JSON.stringify(
    {
      status: "ok",
      releaseArtifacts: required.length,
      environmentKeys: 2
    },
    null,
    2
  )
);
