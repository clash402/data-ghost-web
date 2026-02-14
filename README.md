# Data Ghost Web

This repository contains the web interface for Data Ghost.

Core system design, architecture, and documentation live here:
<https://github.com/clash402/data-ghost-api>

## Environment

Set API base URL behavior with the following variables:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_LOCAL_API_IN_PROD=false
```

- `NEXT_PUBLIC_API_BASE_URL`
  - Used directly in non-production environments.
  - In production, if this is missing or points to localhost, the app falls back to `https://data-ghost-api.fly.dev`.
- `NEXT_PUBLIC_USE_LOCAL_API_IN_PROD`
  - Set to `true` to force `http://localhost:8000` even when `NODE_ENV=production` (useful for local production-mode testing).
  - Default should remain `false` for normal production behavior.
