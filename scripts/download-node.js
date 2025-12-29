#!/usr/bin/env node
// File: scripts/download-node.js

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NODE_VERSION = "20.18.2"; // LTS version matching your dev environment
const PLATFORM = process.platform; // 'win32', 'darwin', 'linux'
const ARCH = process.arch; // 'x64', 'arm64'

const OUTPUT_DIR = path.join(__dirname, "..", "resources", "node");

/**
 * Download a file from URL to destination
 * @param {string} url
 * @param {string} dest
 * @returns {Promise<void>}
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error("Redirect location not found"));
          return;
        }
        file.close();
        fs.unlinkSync(dest);
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

/**
 * Extract zip file (Windows)
 * Uses tar.exe which is available on Windows 10+ (built-in)
 * @param {string} zipPath
 * @param {string} outputDir
 */
async function extractZip(zipPath, outputDir) {
  console.log(`Extracting: ${zipPath}`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Try using tar.exe first (available on Windows 10+)
    // tar.exe can extract zip files on Windows
    await execAsync(`tar -xf "${zipPath}" -C "${outputDir}"`, {
      windowsHide: true,
    });
    console.log("Extraction complete (using tar)");
  } catch (tarError) {
    console.log("tar extraction failed, trying alternative method...");

    // Fallback: Try using tar without -C flag
    try {
      const originalDir = process.cwd();
      process.chdir(outputDir);
      await execAsync(`tar -xf "${zipPath}"`, { windowsHide: true });
      process.chdir(originalDir);
      console.log("Extraction complete (using tar, alternative method)");
    } catch (altError) {
      // If tar fails, provide helpful error message
      throw new Error(
        `Failed to extract zip file. Please install 7-Zip or update to Windows 10+.\n` +
        `Tar error: ${tarError.message}\n` +
        `Alternative error: ${altError.message}`
      );
    }
  }
}

/**
 * Extract tar.gz file (macOS/Linux)
 * @param {string} tarPath
 * @param {string} outputDir
 */
async function extractTarGz(tarPath, outputDir) {
  console.log(`Extracting: ${tarPath}`);
  try {
    await execAsync(`tar -xzf "${tarPath}" -C "${outputDir}"`, {
      windowsHide: true,
    });
    console.log("Extraction complete");
  } catch (error) {
    throw new Error(`Failed to extract: ${error.message}`);
  }
}

/**
 * Main function to download and prepare Node.js
 */
async function main() {
  console.log("\n=== Downloading Node.js Runtime ===");
  console.log(`Platform: ${PLATFORM}`);
  console.log(`Architecture: ${ARCH}`);
  console.log(`Node Version: ${NODE_VERSION}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Determine download URL and file extension
  let downloadUrl;
  let fileName;
  let extractedDirName;

  if (PLATFORM === "win32") {
    // Windows
    fileName = `node-v${NODE_VERSION}-win-${ARCH}.zip`;
    extractedDirName = `node-v${NODE_VERSION}-win-${ARCH}`;
    downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/${fileName}`;
  } else if (PLATFORM === "darwin") {
    // macOS
    fileName = `node-v${NODE_VERSION}-darwin-${ARCH}.tar.gz`;
    extractedDirName = `node-v${NODE_VERSION}-darwin-${ARCH}`;
    downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/${fileName}`;
  } else if (PLATFORM === "linux") {
    // Linux
    fileName = `node-v${NODE_VERSION}-linux-${ARCH}.tar.gz`;
    extractedDirName = `node-v${NODE_VERSION}-linux-${ARCH}`;
    downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/${fileName}`;
  } else {
    console.error(`Unsupported platform: ${PLATFORM}`);
    process.exit(1);
  }

  // Create resources directory
  const resourcesDir = path.join(__dirname, "..", "resources");
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }

  // Check if Node.js is already downloaded
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log("Node.js runtime already exists, skipping download");
    console.log(`Location: ${OUTPUT_DIR}\n`);
    return;
  }

  // Download Node.js
  const downloadPath = path.join(resourcesDir, fileName);

  try {
    await downloadFile(downloadUrl, downloadPath);

    // Extract based on platform
    const tempExtractDir = path.join(resourcesDir, "temp-node");
    if (!fs.existsSync(tempExtractDir)) {
      fs.mkdirSync(tempExtractDir, { recursive: true });
    }

    if (PLATFORM === "win32") {
      await extractZip(downloadPath, tempExtractDir);
    } else {
      await extractTarGz(downloadPath, tempExtractDir);
    }

    // Move extracted directory to final location
    const extractedPath = path.join(tempExtractDir, extractedDirName);
    if (fs.existsSync(extractedPath)) {
      fs.renameSync(extractedPath, OUTPUT_DIR);
    } else {
      throw new Error(`Extracted directory not found: ${extractedPath}`);
    }

    // Cleanup
    console.log("Cleaning up temporary files...");
    fs.unlinkSync(downloadPath);
    fs.rmSync(tempExtractDir, { recursive: true, force: true });

    console.log("\n✓ Node.js runtime downloaded and prepared successfully");
    console.log(`Location: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error("\n✗ Error downloading Node.js:", error.message);
    process.exit(1);
  }
}

main();
