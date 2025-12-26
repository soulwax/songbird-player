# Create a self-signed code signing certificate for testing
# WARNING: This is ONLY for testing. Self-signed certs won't eliminate SmartScreen warnings.
# For production, you need a real certificate from DigiCert, Sectigo, etc.

param(
    [string]$CertName = "localhost",
    [string]$Password = "test1234",
    [string]$OutputPath = ".\test-cert.pfx"
)

Write-Host "Creating self-signed test certificate..." -ForegroundColor Yellow
Write-Host "WARNING: This is for TESTING ONLY. Not for production use!" -ForegroundColor Red
Write-Host ""

# Create the certificate
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=$CertName" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature `
    -FriendlyName "Test Code Signing Certificate for $CertName" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(2)

Write-Host "Certificate created with thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# Export to PFX with password
$certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"
$pfxPassword = ConvertTo-SecureString -String $Password -Force -AsPlainText

Export-PfxCertificate -Cert $certPath -FilePath $OutputPath -Password $pfxPassword | Out-Null

Write-Host "Certificate exported to: $OutputPath" -ForegroundColor Green
Write-Host "Password: $Password" -ForegroundColor Yellow
Write-Host ""

# Display certificate details
Write-Host "Certificate Details:" -ForegroundColor Cyan
Write-Host "  Subject: $($cert.Subject)"
Write-Host "  Thumbprint: $($cert.Thumbprint)"
Write-Host "  Valid From: $($cert.NotBefore)"
Write-Host "  Valid To: $($cert.NotAfter)"
Write-Host ""

# Provide Azure Key Vault import command
Write-Host "To import this test certificate to Azure Key Vault, run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  az keyvault certificate import \"
Write-Host "    --vault-name `"darkfloor-signing-kv`" \"
Write-Host "    --name `"localhost-test-cert`" \"
Write-Host "    --file `"$OutputPath`" \"
Write-Host "    --password `"$Password`""
Write-Host ""

Write-Host "Then update your .env.local:" -ForegroundColor Cyan
Write-Host "  AZURE_KEY_VAULT_CERTIFICATE=localhost-test-cert"
Write-Host ""

Write-Host "REMINDER: This will NOT prevent SmartScreen warnings!" -ForegroundColor Red
Write-Host "For production, purchase a real certificate from a trusted CA." -ForegroundColor Yellow
