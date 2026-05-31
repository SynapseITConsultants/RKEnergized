# Tiny static-file HTTP server on http://localhost:8123/
# Serves the parent directory of this script. No dependencies.

$port = 8123
$root = Split-Path -Parent $PSScriptRoot

$mime = @{
  ".html"="text/html; charset=utf-8";".htm"="text/html; charset=utf-8"
  ".css"="text/css; charset=utf-8";".js"="application/javascript; charset=utf-8"
  ".json"="application/json; charset=utf-8";".png"="image/png"
  ".jpg"="image/jpeg";".jpeg"="image/jpeg";".gif"="image/gif"
  ".svg"="image/svg+xml";".ico"="image/x-icon";".webp"="image/webp"
  ".woff"="font/woff";".woff2"="font/woff2";".txt"="text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
      $file = Join-Path $root $rel
      if (Test-Path $file -PathType Container) { $file = Join-Path $file "index.html" }

      if ((Test-Path $file -PathType Leaf)) {
        $resolved = (Resolve-Path $file).Path
        $rootPath = (Resolve-Path $root).Path
        if (-not $resolved.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
          $res.StatusCode = 403
        } else {
          $ext = [IO.Path]::GetExtension($resolved).ToLower()
          $ct = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
          $bytes = [IO.File]::ReadAllBytes($resolved)
          $res.ContentType = $ct
          $res.ContentLength64 = $bytes.Length
          $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $res.StatusCode = 404
        $msg = [Text.Encoding]::UTF8.GetBytes("404 Not Found: /$rel")
        $res.ContentType = "text/plain; charset=utf-8"
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
