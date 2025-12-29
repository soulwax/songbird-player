#!/usr/bin/env node
// File: scripts/generate-ssl-cert.js

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables in priority order (matching scripts/server.js)
const projectRoot = path.resolve(__dirname, "..");
const nodeEnv = process.env.NODE_ENV || "development";
const isDev = nodeEnv === "development";

if (isDev) {
  // DEVELOPMENT MODE: Load .env.development
  dotenv.config({ path: path.resolve(projectRoot, ".env.development") });
} else {
  // PRODUCTION MODE: Load .env.local > .env.production > .env
  dotenv.config({ path: path.resolve(projectRoot, ".env.local") });
  dotenv.config({ path: path.resolve(projectRoot, ".env.production") });
  dotenv.config({ path: path.resolve(projectRoot, ".env") });
}

async function generateSSLCert() {
  const certContent = process.env.DB_SSL_CA;

  if (!certContent) {
    console.warn("⚠️  DB_SSL_CA environment variable not set");
    console.log("   Skipping SSL certificate generation");
    return;
  }

  console.log("🔐 Generating PostgreSQL SSL certificate...");

  const certsDir = path.resolve(projectRoot, "certs");
  const certPath = path.resolve(certsDir, "ca.pem");

  try {
    // Ensure certs directory exists
    await mkdir(certsDir, { recursive: true });

    // Write certificate to file
    // Remove quotes if they exist (from .env wrapping)
    const cleanCert = certContent.replace(/^["']|["']$/g, "");
    await writeFile(certPath, cleanCert, "utf8");

    console.log(`✅ SSL certificate written to: ${certPath}`);
  } catch (error) {
    console.error("❌ Failed to generate SSL certificate:", error);
    process.exit(1);
  }
}

// Run the script
generateSSLCert();
