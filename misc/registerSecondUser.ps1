# Ustawienia API
$baseUrl = "http://localhost:3001/api"
$registerUrl = "$baseUrl/users/register"

# Dane dla drugiego użytkownika (shareduser)
$sharedUserLogin = "shareduser"
$sharedUserPassword = "sharedpassword123"
$sharedUserEmail = "shared@example.com"
$sharedDefaultCurrency = "EUR" # Domyślna waluta dla drugiego użytkownika

Write-Host "--- Tworzenie użytkownika '$sharedUserLogin' ---"

$registrationBody = @{
    login = $sharedUserLogin;
    password = $sharedUserPassword;
    email = $sharedUserEmail;
    defaultCurrency = $sharedDefaultCurrency
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType "application/json" -Body $registrationBody
    Write-Host "Rejestracja użytkownika '$sharedUserLogin' pomyślna:"
    $registerResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Błąd podczas rejestracji użytkownika '$sharedUserLogin':`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
}