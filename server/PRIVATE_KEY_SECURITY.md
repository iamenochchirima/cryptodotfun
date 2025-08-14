# Secure Private Key Management

## Problem
The IC private key (`dotfun_admin.pem`) contains sensitive cryptographic material that should never be committed to version control, but is required for the backend server to authenticate with Internet Computer canisters.

## Solution
We've implemented a secure environment variable-based approach that supports multiple methods:

### Method 1: Base64 Encoded (Recommended)
1. Convert your PEM file to base64:
   ```bash
   cat dotfun_admin.pem | base64 -w 0
   ```

2. Add the result to your `.env` file:
   ```env
   IC_PRIVATE_KEY_B64="your_base64_encoded_string_here"
   ```

### Method 2: Plain Text (Legacy Support)
Add the PEM content directly to your `.env` file with escaped newlines:
```env
IC_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\nyour_private_key_content\n-----END EC PRIVATE KEY-----"
```

### Method 3: PEM File (Fallback)
If no environment variables are set, the system falls back to reading from the PEM file specified in `IDENTITY_PEM_PATH`.

## Priority Order
The system checks for credentials in this order:
1. `IC_PRIVATE_KEY_B64` (base64 encoded)
2. `IC_PRIVATE_KEY` (plain text with escaped newlines)
3. PEM file specified in `IDENTITY_PEM_PATH`

## Security Benefits
- ✅ Private keys never committed to git
- ✅ Environment variables are ignored by .gitignore
- ✅ Easy to manage in deployment environments
- ✅ Base64 encoding avoids newline parsing issues
- ✅ Fallback to file-based approach for local development

## Setup Instructions

### For Development
1. Copy `.env.example` to `.env`
2. Generate base64 version of your private key:
   ```bash
   cat dotfun_admin.pem | base64 -w 0
   ```
3. Add the base64 string to `IC_PRIVATE_KEY_B64` in your `.env` file
4. The server will automatically use the environment variable instead of the PEM file

### For Production/Deployment
Set the `IC_PRIVATE_KEY_B64` environment variable in your deployment environment (GitHub Actions, Docker, etc.) with the base64-encoded private key.

## Files to Keep Secure
These files should never be committed and are already in `.gitignore`:
- `.env`
- `.env.local`
- `.env.production`
- `*.pem`
- `*.key`
- `*.p8`
- `*.p12`

## Verification
When the server starts, you'll see one of these log messages:
- `🔐 Loading identity from IC_PRIVATE_KEY_B64 environment variable...` (success)
- `🔐 Loading identity from IC_PRIVATE_KEY environment variable...` (legacy)
- `🔐 Loading identity from PEM file: ./dotfun_admin.pem` (fallback)
