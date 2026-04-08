$envFile = Join-Path $PSScriptRoot ".env.cloudflare"
if (Test-Path $envFile) {
    $line = Get-Content $envFile | Select-Object -First 1
    if ($line -match 'CLOUDFLARE_API_TOKEN=(.+)') { $env:CLOUDFLARE_API_TOKEN = $matches[1].Trim() }
}

npx wrangler pages deploy "Deploy/site_ove" --project-name=ove-subs
