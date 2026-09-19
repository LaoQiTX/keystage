$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$package = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $PSScriptRoot 'extension/package.json') | ConvertFrom-Json
$manifestPath = Join-Path $PSScriptRoot 'extension.vsixmanifest'
[xml]$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestPath
$manifest.PackageManifest.Metadata.Identity.Version = $package.version
$manifest.PackageManifest.Metadata.Identity.Publisher = $package.publisher
$manifest.Save($manifestPath)
$destination = Join-Path $PSScriptRoot ("code-demo-typer-" + $package.version + '.vsix')
$stream = [IO.File]::Open($destination, [IO.FileMode]::Create)
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in @('extension/package.json', 'extension/extension.js', 'extension/replay.js', 'extension/presets.js', 'extension/manager.js', 'extension.vsixmanifest', '[Content_Types].xml')) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $PSScriptRoot $name), $name, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    foreach ($name in @('README.md', 'CHANGELOG.md', 'LICENSE')) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $PSScriptRoot $name), ('extension/' + $name), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Output $destination
