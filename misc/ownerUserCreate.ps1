# API settings
$baseUrl = "http://localhost:3001/api"
$registerUrl = "$baseUrl/users/register"

# Data for the owner user
$ownerUserLogin = "owneruser"
$ownerUserPassword = "ownerpassword123"
$ownerUserEmail = "owner@example.com"
$ownerDefaultCurrency = "PLN" # Default currency for the owner user

Write-Host "--- Creating user '$ownerUserLogin' ---"

$registrationBody = @{
    login = $ownerUserLogin;
    password = $ownerUserPassword;
    email = $ownerUserEmail;
    defaultCurrency = $ownerDefaultCurrency
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType "application/json" -Body $registrationBody
    Write-Host "Registration of user '$ownerUserLogin' successful:"
    $registerResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Error during registration of user '$ownerUserLogin':`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error response:`n $responseBody"
    }
}