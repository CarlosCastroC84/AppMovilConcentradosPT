const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const pluginBuildFiles = [
  "node_modules/@capacitor/haptics/android/build.gradle",
  "node_modules/@capacitor/keyboard/android/build.gradle",
];

const from = /getDefaultProguardFile\((['"])proguard-android\.txt\1\)/g;
const to = "getDefaultProguardFile('proguard-android-optimize.txt')";

let touched = 0;

for (const relativePath of pluginBuildFiles) {
  const fullPath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const original = fs.readFileSync(fullPath, "utf8");
  const updated = original.replace(from, to);

  if (updated !== original) {
    fs.writeFileSync(fullPath, updated, "utf8");
    touched += 1;
    console.log(`patched: ${relativePath}`);
  } else {
    console.log(`ok: ${relativePath}`);
  }
}

if (touched === 0) {
  console.log("No Capacitor ProGuard patches were needed.");
}
