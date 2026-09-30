$chromes = Get-WmiObject Win32_Process -Filter "name='chrome.exe'"
foreach($c in $chromes) {
    if ($c.CommandLine -notmatch "\.cache\\chrome") {
        Stop-Process -Id $c.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
