# Ustawienia API
$baseUrl = "http://localhost:3001/api/users" # Załóżmy, że Twoje trasy użytkowników są pod /api/users
$registerUrl = "$baseUrl/register"
$loginUrl = "$baseUrl/login"

# Dane testowe
$testUserLogin = "testuser"
$testUserPassword = "securepassword123"
$testUserEmail = "test@example.com"
$testDefaultCurrency = "USD"

Write-Host "--- Testowanie Rejestracji Użytkownika ---"
$registrationBody = @{
    login = $testUserLogin;
    password = $testUserPassword;
    email = $testUserEmail;
    defaultCurrency = $testDefaultCurrency
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType "application/json" -Body $registrationBody
    Write-Host "Rejestracja pomyślna:"
    $registerResponse | ConvertTo-Json | Write-Host
    $registeredUserId = $registerResponse._id
}
catch {
    Write-Host "Błąd podczas rejestracji:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
    exit 1 # Zakończ skrypt, jeśli rejestracja się nie powiodła
}

Write-Host "`n--- Testowanie Logowania Użytkownika ---"
$loginBody = @{
    login = $testUserLogin;
    password = $testUserPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
    Write-Host "Logowanie pomyślne:"
    $loginResponse | ConvertTo-Json | Write-Host
    $jwtToken = $loginResponse.token
    Write-Host "Otrzymany token JWT: $jwtToken"
}
catch {
    Write-Host "Błąd podczas logowania:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
    exit 1 # Zakończ skrypt, jeśli logowanie się nie powiodło
}

Write-Host "`n--- Testowanie dostępu do profilu użytkownika (chroniony endpoint) ---"
if (-not $jwtToken) {
    Write-Host "Brak tokena JWT, nie można przetestować chronionego endpointu."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $jwtToken"
}

# Użyj ID użytkownika, który został zarejestrowany
$getUserProfileUrl = "$baseUrl/$registeredUserId"

try {
    $userProfileResponse = Invoke-RestMethod -Uri $getUserProfileUrl -Method Get -Headers $headers
    Write-Host "Profil użytkownika (chroniony endpoint) pomyślny:"
    $userProfileResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Błąd podczas pobierania profilu użytkownika:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
}

Write-Host "`n--- Testowanie aktualizacji profilu użytkownika ---"
$updateProfileUrl = "$baseUrl/$registeredUserId"
$updateBody = @{
    email = "new_test@example.com";
    defaultCurrency = "EUR"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri $updateProfileUrl -Method Put -Headers $headers -ContentType "application/json" -Body $updateBody
    Write-Host "Aktualizacja profilu pomyślna:"
    $updateResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Błąd podczas aktualizacji profilu:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
}

# Write-Host "`n--- Testowanie usunięcia użytkownika ---"
# $deleteUserUrl = "$baseUrl/$registeredUserId"
# 
# try {
#     $deleteResponse = Invoke-RestMethod -Uri $deleteUserUrl -Method Delete -Headers $headers
#     # Write-Host "Usunięcie użytkownika pomyślne:"
#     # $deleteResponse | ConvertTo-Json | Write-Host
# }
# catch {
#     Write-Host "Błąd podczas usuwania użytkownika:`n $($_.Exception.Message)"
#     if ($_.Exception.Response) {
#         $responseStream = $_.Exception.Response.GetResponseStream()
#         $reader = New-Object System.IO.StreamReader($responseStream)
#         $responseBody = $reader.ReadToEnd()
#         Write-Host "Odpowiedź błędu:`n $responseBody"
#     }
# }

Write-Host "`n--- Koniec testów ---"