$chromes = Get-WmiObject Win32_Process -Filter "name='chrome.exe'"
foreach($c in $chromes) {
    if ($c.CommandLine -notmatch "--user-data-dir") {
        Stop-Process -Id $c.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
