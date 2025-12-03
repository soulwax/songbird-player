# Electron Setup for Starchild Music

## What Was

The error "ReferenceError: process is not defined in ES module scope" occurred because:

1. Your `package.json` has `"type": "module"`, making all `.js` files ES modules
2. Electron's main process file was missing or incorrectly configured

## Solution Applied

1. Created `electron/main.cjs` - Main process file using CommonJS (`.cjs` extension explicitly marks it as CommonJS, avoiding ES module conflicts)
2. Created `electron/preload.cjs` - Preload script for secure renderer communication
3. Created `electron/types.d.ts` - TypeScript definitions for Electron API
4. Updated `package.json` to point to `main.cjs` instead of `main.js`

## What can

### Development

```bash
npm run electron:dev
```

This starts both the Next.js dev server and Electron, with hot reload enabled.

### Production Build

For Windows:

```bash
npm run electron:build:win
```

For macOS:

```bash
npm run electron:build:mac
```

For Linux:

```bash
npm run electron:build:linux
```

## Important Notes

### Static vs Server Mode

Currently, your Next.js is configured to use `standalone` mode for Electron builds when `ELECTRON_BUILD=true`. However, the build scripts don't set this variable yet.

**If you need server-side features (tRPC, API routes, SSR):**

- Keep standalone mode
- Update build scripts to set `ELECTRON_BUILD=true`
- Update electron-builder `files` config to include `.next/standalone/**/*`

**If you want a simpler static build (no server-side features):**

- Change `next.config.js` output to `'export'`
- This creates static HTML in `out/` directory (which electron-builder expects)

### Next Steps

1. Rebuild your Electron app with the new configuration
2. Test the .exe - the error should be resolved
3. If using server features, update the build configuration as noted above

## File Structure

```sh
electron/
├── main.cjs       # Main process (CommonJS to avoid ES module issues)
├── preload.cjs    # Preload script for security
└── types.d.ts     # TypeScript definitions
```

## Security Notes

The preload script enables secure communication between Electron and your Next.js renderer:

- `contextIsolation: true` - Prevents renderer from directly accessing Node.js
- `sandbox: true` - Additional security layer
- Preload script exposes only specific, safe APIs to the renderer

## Accessing Electron APIs in Your Next.js Code

In your React components, you can access Electron APIs:

```typescript
// Check if running in Electron
if (typeof window !== 'undefined' && window.electron) {
  console.log('Platform:', window.electron.platform);
  
  // Send message to main process
  window.electron.send('toMain', { data: 'hello' });
  
  // Receive messages from main process
  window.electron.receive('fromMain', (data) => {
    console.log('Received:', data);
  });
}
```
