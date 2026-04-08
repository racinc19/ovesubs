# ovesubs

Static site deploy for the Oak Valley Estates subcontractor portal.

## Requirements

- Node.js (for `npx`)

## Deploy

### Deploy to Cloudflare Pages (ovesubs.pages.dev)

1. Create `./.env.cloudflare` with:

```
CLOUDFLARE_API_TOKEN=YOUR_TOKEN_HERE
```

2. Ensure the site output exists at `Deploy/site_ove`.

3. Run:

```
./deploy_ovesubs.ps1
```

## Notes

- Cloudflare Pages project name: `ovesubs`
- Default URL: https://ovesubs.pages.dev
