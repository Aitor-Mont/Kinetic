$filePath = "src\app\pages\dashboard\dashboard.component.html"
$lines = Get-Content $filePath
$controlFlow = @()

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    # Buscar bloques de control de flujo
    if ($line -match '^\s*@if\s*\(') {
        $controlFlow += [PSCustomObject]@{ Line = $lineNum; Type = "OPEN_IF"; Content = $line.Trim() }
    }
    elseif ($line -match '^\s*@for\s*\(') {
        $controlFlow += [PSCustomObject]@{ Line = $lineNum; Type = "OPEN_FOR"; Content = $line.Trim() }
    }
    elseif ($line -match '^\s*@else\s*\{') {
        $controlFlow += [PSCustomObject]@{ Line = $lineNum; Type = "ELSE"; Content = $line.Trim() }
    }
    elseif ($line -match '^\s*\}\s*$') {
        $controlFlow += [PSCustomObject]@{ Line = $lineNum; Type = "CLOSE"; Content = $line.Trim() }
    }
}

$controlFlow | Format-Table -AutoSize
