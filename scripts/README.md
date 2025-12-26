# Scripts Documentation

This directory contains utility scripts for the darkfloor.art project.

## SSL Certificate Generation

### `generate-ssl-cert.js`

Automatically generates the PostgreSQL SSL certificate file (`certs/ca.pem`) from the `DB_SSL_CA` environment variable.

**When it runs:**
- Before `dev` (via `predev` hook)
- Before `build` (via `prebuild` hook)
- Before `start` (via `prestart` hook)

**Manual usage:**
```bash
npm run generate:ssl
```

**How it works:**
1. Reads `DB_SSL_CA` from `.env` or `.env.local`
2. Creates the `certs/` directory if it doesn't exist
3. Writes the certificate content to `certs/ca.pem`

**For Vercel deployment:**

Add the certificate to your Vercel environment variables:

1. Go to your Vercel project settings → Environment Variables
2. Add a new variable:
   - **Name:** `DB_SSL_CA`
   - **Value:** Your full PEM certificate (including BEGIN/END lines)
   - **Environments:** Production, Preview, Development

The certificate will be automatically generated during the build process.

**Security notes:**
- The `certs/` directory is gitignored - certificates are never committed
- Certificates are generated from environment variables at runtime
- The generated `ca.pem` file is only used for PostgreSQL SSL connections

## Other Scripts

- `server.js` - Custom Next.js server with logging
- `load-env-build.js` - Loads environment variables for Electron builds
- `download-node.js` - Downloads Node.js binary for Electron packaging
- `gen-version.js` / `set-version.js` / `reset-version.js` - Version management utilities
