#!/usr/bin/env node
// File: scripts/generate-ssl-cert.js
// Generates certs/ca.pem from DB_SSL_CA environment variable

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const projectRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.resolve(projectRoot, ".env") });

// Also load from .env.local if it exists (for production builds)
dotenv.config({ path: path.resolve(projectRoot, ".env.local") });

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
