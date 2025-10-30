# scripts/test_upload.ps1
# Small PowerShell script to upload a file to the backend and run the pipeline.
param(
  [Parameter(Mandatory=$true)] [string] $FilePath
)

if (!(Test-Path $FilePath)) {
  Write-Error "File not found: $FilePath"
  exit 1
}

Write-Output "Uploading $FilePath to backend..."

$client = New-Object System.Net.Http.HttpClient
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$content = New-Object System.Net.Http.MultipartFormDataContent
$b = New-Object System.Net.Http.ByteArrayContent($bytes)
$b.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/octet-stream')
$content.Add($b, 'file', [System.IO.Path]::GetFileName($FilePath))

$resp = $client.PostAsync('http://localhost:8000/upload', $content).Result
$body = $resp.Content.ReadAsStringAsync().Result
Write-Output "Upload response: $body"

Write-Output "Calling /preprocess..."
$pre = Invoke-RestMethod -Uri http://localhost:8000/preprocess
Write-Output "Preprocess response: $(ConvertTo-Json $pre -Depth 5)"

Write-Output "Calling /load_model..."
$lm = Invoke-RestMethod -Uri http://localhost:8000/load_model
Write-Output "Load model response: $(ConvertTo-Json $lm -Depth 5)"

Write-Output "Calling /inference... (this may take a while)"
$inf = Invoke-RestMethod -Uri http://localhost:8000/inference
Write-Output "Inference response: $(ConvertTo-Json $inf -Depth 5)"

Write-Output "Fetching /results..."
$res = Invoke-RestMethod -Uri http://localhost:8000/results
Write-Output "Results: $(ConvertTo-Json $res -Depth 6)"
