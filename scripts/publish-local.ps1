param(
    [string]$ProjectRoot = "C:\Users\jonat\OneDrive\Bureaublad\wd-2",
    [string]$ThemeSlug = "wd-infra",
    [string]$LocalSitePublic = "C:\Users\jonat\Local Sites\wd-infra\app\public",
    [string]$LocalSitesJson = "C:\Users\jonat\AppData\Roaming\Local\sites.json"
)

$ErrorActionPreference = "Stop"

function Assert-InsidePath {
    param(
        [string]$Path,
        [string]$Parent
    )

    $resolvedParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
    $resolvedPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\') + '\'

    if (-not $resolvedPath.StartsWith($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Pad valt buiten toegestaan doel: $Path"
    }
}

function Patch-ThemeAssets {
    param([string]$AssetsPath)

    $cssFiles = Get-ChildItem -Path $AssetsPath -File -Filter "index-*.css"
    foreach ($file in $cssFiles) {
        $text = Get-Content -LiteralPath $file.FullName -Raw
        $text = $text.Replace('url(/assets/', 'url(')
        $text = $text.Replace('url("/assets/', 'url("')
        $text = $text.Replace("url('/assets/", "url('")
        Set-Content -LiteralPath $file.FullName -Value $text -NoNewline
    }
}

function Copy-BuiltThemeAssets {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Build assets map bestaat niet: $Source"
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null

    Get-ChildItem -Path $Source -File |
        Where-Object { $_.Name -like "index-*.js" -or $_.Name -like "index-*.css" } |
        ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Destination $_.Name) -Force
        }
}

function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Bronmap bestaat niet: $Source"
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null

    $robocopyArgs = @(
        $Source,
        $Destination,
        "/MIR",
        "/XD",
        ".git",
        ".github",
        "node_modules",
        "/XF",
        ".DS_Store",
        "/R:2",
        "/W:1",
        "/NFL",
        "/NDL",
        "/NJH",
        "/NJS",
        "/NP"
    )

    & robocopy @robocopyArgs | Out-Null
    $exitCode = $LASTEXITCODE

    if ($exitCode -ge 8) {
        throw "Robocopy mislukt met exitcode $exitCode"
    }
}

function New-ThemeZip {
    param(
        [string]$SourceDirectory,
        [string]$DestinationPath
    )

    if (Test-Path -LiteralPath $DestinationPath) {
        Remove-Item -LiteralPath $DestinationPath -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $sourceRoot = [System.IO.Path]::GetFullPath($SourceDirectory).TrimEnd('\')
    $rootName = Split-Path -Path $sourceRoot -Leaf
    $zip = [System.IO.Compression.ZipFile]::Open($DestinationPath, [System.IO.Compression.ZipArchiveMode]::Create)

    try {
        Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
            $fullName = [System.IO.Path]::GetFullPath($_.FullName)
            $relative = $fullName.Substring($sourceRoot.Length).TrimStart('\', '/')
            $entryName = ($rootName + '/' + $relative.Replace('\', '/')).TrimStart('/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip,
                $_.FullName,
                $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    }
    finally {
        $zip.Dispose()
    }
}

function Activate-Theme {
    param(
        [string]$WpPath,
        [string]$Theme,
        [string]$SitesJson
    )

    $wpCommand = Get-Command wp -ErrorAction SilentlyContinue
    if ($wpCommand) {
        & $wpCommand.Source theme activate $Theme --path="$WpPath" | Out-Host
        return
    }

    if (-not (Test-Path -LiteralPath $SitesJson)) {
        Write-Warning "Kan Local sites.json niet vinden; theme is gepubliceerd maar niet automatisch geactiveerd."
        return
    }

    $sites = Get-Content -LiteralPath $SitesJson -Raw | ConvertFrom-Json
    $site = $sites.PSObject.Properties |
        ForEach-Object { $_.Value } |
        Where-Object { $_.domain -eq "wd-infra.local" -or $_.name -eq "WD Infra" } |
        Select-Object -First 1

    if (-not $site) {
        Write-Warning "Local-site wd-infra.local niet gevonden in sites.json; theme is gepubliceerd maar niet automatisch geactiveerd."
        return
    }

    $mysqlPort = $site.services.mysql.ports.MYSQL[0]
    $mysqlExe = Get-ChildItem "C:\Users\jonat\AppData\Roaming\Local\lightning-services" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -like "*mysql-8.0.35*" } |
        Select-Object -First 1

    if (-not $mysqlExe) {
        Write-Warning "mysql.exe niet gevonden; theme is gepubliceerd maar niet automatisch geactiveerd."
        return
    }

    $sql = "UPDATE wp_options SET option_value='$Theme' WHERE option_name IN ('template','stylesheet'); UPDATE wp_options SET option_value='Devtec Website Theme' WHERE option_name='current_theme';"
    & $mysqlExe.FullName --host=127.0.0.1 --port=$mysqlPort --user=root --password=root local --execute=$sql | Out-Host
}

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
    throw "ProjectRoot bestaat niet: $ProjectRoot"
}

$themeSource = Join-Path $ProjectRoot "wp-thema\$ThemeSlug"
$distAssets = Join-Path $ProjectRoot "dist\assets"
$themeAssets = Join-Path $themeSource "assets"
$zipPath = Join-Path $ProjectRoot "wp-thema\$ThemeSlug.zip"
$themeStyle = Join-Path $themeSource "style.css"
$themesRoot = Join-Path $LocalSitePublic "wp-content\themes"
$localThemeDestination = Join-Path $themesRoot $ThemeSlug

Assert-InsidePath -Path $localThemeDestination -Parent $themesRoot

Push-Location $ProjectRoot
try {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) {
        $npm = Get-Command npm -ErrorAction Stop
    }

    & $npm.Source run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build mislukt met exitcode $LASTEXITCODE"
    }

    if (Test-Path -LiteralPath $themeAssets) {
        Remove-Item -LiteralPath $themeAssets -Recurse -Force
    }

    Copy-BuiltThemeAssets -Source $distAssets -Destination $themeAssets
    Patch-ThemeAssets -AssetsPath $themeAssets

    New-ThemeZip -SourceDirectory $themeSource -DestinationPath $zipPath

    $themeVersion = "unknown"
    if (Test-Path -LiteralPath $themeStyle) {
        $versionMatch = Select-String -LiteralPath $themeStyle -Pattern "^\s*Version:\s*(.+?)\s*$" | Select-Object -First 1
        if ($versionMatch) {
            $themeVersion = $versionMatch.Matches[0].Groups[1].Value.Trim()
        }
    }

    $versionedZipPath = Join-Path $ProjectRoot "wp-thema\$ThemeSlug-v$themeVersion.zip"
    if (Test-Path -LiteralPath $versionedZipPath) {
        Remove-Item -LiteralPath $versionedZipPath -Force
    }
    Copy-Item -LiteralPath $zipPath -Destination $versionedZipPath -Force

    Sync-Directory -Source $themeSource -Destination $localThemeDestination
    Activate-Theme -WpPath $LocalSitePublic -Theme $ThemeSlug -SitesJson $LocalSitesJson

    Write-Output "Theme bijgewerkt: $themeSource"
    Write-Output "Zip bijgewerkt: $zipPath"
    Write-Output "Versie-zip bijgewerkt: $versionedZipPath"
    Write-Output "Gepubliceerd naar: $localThemeDestination"
}
finally {
    Pop-Location
}
