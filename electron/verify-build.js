const fs = require("fs");
const path = require("path");

console.log("🔍 Checking Next.js build output...\n");

const checks = [
  {
    name: "Standalone server",
    path: ".next/standalone/server.js",
    required: true,
  },
  {
    name: "Standalone package.json",
    path: ".next/standalone/package.json",
    required: true,
  },
  {
    name: "Static files",
    path: ".next/static",
    required: true,
  },
  {
    name: "Build manifest",
    path: ".next/build-manifest.json",
    required: false,
  },
];

let allGood = true;

checks.forEach((check) => {
  const fullPath = path.join(__dirname, "..", check.path);
  const exists = fs.existsSync(fullPath);

  const icon = exists ? "✅" : check.required ? "❌" : "⚠️";
  console.log(`${icon} ${check.name}`);
  console.log(`   ${fullPath}`);

  if (!exists && check.required) {
    allGood = false;
  }

  if (exists) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath);
      console.log(`   (${files.length} files/folders)`);
    } else {
      console.log(`   (${(stats.size / 1024).toFixed(2)} KB)`);
    }
  }
  console.log("");
});

if (allGood) {
  console.log("✅ All required files present! Build looks good.\n");
  console.log("Next steps:");
  console.log("  1. Run: npm run electron:build:win");
  console.log("  2. Check: dist/win-unpacked/Starchild Music.exe");
  console.log("  3. Run the .exe and check DevTools console for logs\n");
} else {
  console.log("❌ Build verification failed!\n");
  console.log("The standalone server was not created. This means:");
  console.log("  1. ELECTRON_BUILD=true environment variable may not be set");
  console.log("  2. Next.js build may have failed");
  console.log("  3. The output mode in next.config.js may be wrong\n");
  console.log("To fix:");
  console.log('  1. Check next.config.js has: output: "standalone"');
  console.log("  2. Run: cross-env ELECTRON_BUILD=true next build");
  console.log("  3. Run this script again: node electron/verify-build.js\n");
}

process.exit(allGood ? 0 : 1);
