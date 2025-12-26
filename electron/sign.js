// File: electron/sign.js
// Windows code signing using @electron/windows-sign

const { sign } = require('@electron/windows-sign');
const path = require('path');

/**
 * Custom signing function for electron-builder using @electron/windows-sign
 * Supports both local certificates and Azure Key Vault
 *
 * Environment variables:
 * - WINDOWS_CERTIFICATE_FILE: Path to .pfx/.p12 certificate (for local signing)
 * - WINDOWS_CERTIFICATE_PASSWORD: Certificate password
 * - WINDOWS_TIMESTAMP_URL: Timestamp server URL (default: http://timestamp.digicert.com)
 *
 * Azure Key Vault (alternative to local certificate):
 * - AZURE_KEY_VAULT_URI: Azure Key Vault URI
 * - AZURE_KEY_VAULT_CERTIFICATE: Certificate name in Key Vault
 * - AZURE_KEY_VAULT_CLIENT_ID: Azure AD application ID
 * - AZURE_KEY_VAULT_CLIENT_SECRET: Azure AD application secret
 * - AZURE_KEY_VAULT_TENANT_ID: Azure AD tenant ID
 *
 * @param {Object} configuration - Signing configuration from electron-builder
 * @param {string} configuration.path - Path to the file to sign
 * @param {string} configuration.hash - Hash algorithm (sha1 or sha256)
 * @param {boolean} configuration.isNest - Whether this is a nested signing
 */
module.exports = async function (configuration) {
  const filePath = configuration.path;
  const hash = configuration.hash || 'sha256';

  // Check for Azure Key Vault configuration
  const azureKeyVaultUri = process.env.AZURE_KEY_VAULT_URI;
  const certificateFile = process.env.WINDOWS_CERTIFICATE_FILE;

  // If neither is configured, skip signing
  if (!azureKeyVaultUri && !certificateFile) {
    console.log('⚠️  No signing configuration found. Skipping code signing.');
    console.log('   For local signing: Set WINDOWS_CERTIFICATE_FILE');
    console.log('   For Azure Key Vault: Set AZURE_KEY_VAULT_URI and related vars');
    return;
  }

  console.log(`🔐 Signing: ${path.basename(filePath)}`);

  try {
    // Build signing options
    const signOptions = {
      appDirectory: path.dirname(filePath),
      signWithParams: undefined,
    };

    if (azureKeyVaultUri) {
      // Azure Key Vault signing
      console.log('   Using Azure Key Vault signing');

      if (!process.env.AZURE_KEY_VAULT_CERTIFICATE) {
        throw new Error('AZURE_KEY_VAULT_CERTIFICATE is required when using Azure Key Vault');
      }
      if (!process.env.AZURE_KEY_VAULT_CLIENT_ID) {
        throw new Error('AZURE_KEY_VAULT_CLIENT_ID is required when using Azure Key Vault');
      }
      if (!process.env.AZURE_KEY_VAULT_CLIENT_SECRET) {
        throw new Error('AZURE_KEY_VAULT_CLIENT_SECRET is required when using Azure Key Vault');
      }
      if (!process.env.AZURE_KEY_VAULT_TENANT_ID) {
        throw new Error('AZURE_KEY_VAULT_TENANT_ID is required when using Azure Key Vault');
      }

      const timestampUrl = process.env.WINDOWS_TIMESTAMP_URL || 'http://timestamp.digicert.com';

      // Azure signtool parameters (don't include /fd - electron-builder adds it via signingHashAlgorithms)
      signOptions.signWithParams = `/tr ${timestampUrl} /td sha256 /kvu ${azureKeyVaultUri} /kvc ${process.env.AZURE_KEY_VAULT_CERTIFICATE} /kvi ${process.env.AZURE_KEY_VAULT_CLIENT_ID} /kvs ${process.env.AZURE_KEY_VAULT_CLIENT_SECRET} /kvt ${process.env.AZURE_KEY_VAULT_TENANT_ID}`;
    } else {
      // Local certificate signing
      console.log('   Using local certificate signing');

      const certificatePassword = process.env.WINDOWS_CERTIFICATE_PASSWORD;
      const timestampUrl = process.env.WINDOWS_TIMESTAMP_URL || 'http://timestamp.digicert.com';

      // Build signtool parameters for local certificate (don't include /fd - electron-builder adds it via signingHashAlgorithms)
      signOptions.signWithParams = `/f "${certificateFile}" ${certificatePassword ? `/p "${certificatePassword}"` : ''} /tr ${timestampUrl} /td sha256`;
    }

    // Sign the file
    await sign(signOptions);

    console.log('✅ Code signing successful');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Code signing failed:', err.message);

    // Only throw in CI environments to prevent local development issues
    if (process.env.CI) {
      throw err;
    } else {
      console.warn('⚠️  Continuing without code signature (not in CI environment)');
    }
  }
};
