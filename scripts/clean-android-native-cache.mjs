import { rmSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const targets = [
  "apps/mobile/android/app/.cxx",
  "apps/mobile/android/app/build",
  "apps/mobile/android/.gradle",
  "node_modules/react-native-screens/android/.cxx",
  "node_modules/react-native-screens/android/build",
  "node_modules/react-native-safe-area-context/android/.cxx",
  "node_modules/react-native-safe-area-context/android/build",
  "node_modules/@react-native-async-storage/async-storage/android/.cxx",
  "node_modules/@react-native-async-storage/async-storage/android/build",
  "node_modules/expo/android/.cxx",
  "node_modules/expo/android/build",
  "node_modules/expo-modules-core/android/.cxx",
  "node_modules/expo-modules-core/android/build",
  "node_modules/expo-location/android/.cxx",
  "node_modules/expo-location/android/build",
  "node_modules/expo-font/android/.cxx",
  "node_modules/expo-font/android/build",
  "node_modules/expo-file-system/android/.cxx",
  "node_modules/expo-file-system/android/build",
  "node_modules/expo-asset/android/.cxx",
  "node_modules/expo-asset/android/build",
  "node_modules/expo-constants/android/.cxx",
  "node_modules/expo-constants/android/build",
  "node_modules/expo-keep-awake/android/.cxx",
  "node_modules/expo-keep-awake/android/build",
];

for (const target of targets) {
  const absolute = resolve(root, target);
  const insideRoot = !relative(root, absolute).startsWith("..");

  if (!insideRoot) {
    throw new Error(`Refusing to clean outside project root: ${absolute}`);
  }

  if (!existsSync(absolute)) {
    console.log(`skip ${target}`);
    continue;
  }

  rmSync(absolute, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  console.log(`removed ${target}`);
}
