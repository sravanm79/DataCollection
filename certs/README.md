# MRCET SSL Certificates

This directory contains SSL certificates for HTTPS configuration.

## Required Files:
1. **mrcet_certificate.pem** - SSL certificate from MRCET
2. **mrcet_private_key.pem** - Private key from MRCET
3. **mrcet_ca_bundle.pem** - CA bundle (if provided by MRCET)

## Instructions:
1. Place your MRCET certificate files in this directory
2. Ensure file permissions are set to 644
3. Update the application configuration to use these certificates

## File Structure:
```
certs/
├── mrcet_certificate.pem
├── mrcet_private_key.pem
└── mrcet_ca_bundle.pem (optional)
