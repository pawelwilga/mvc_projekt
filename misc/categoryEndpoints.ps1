# Ustawienia API
$baseUrl = "http://localhost:3001/api" # Zakładamy, że /api jest bazowym adresem dla wszystkich endpointów
$userApiUrl = "$baseUrl/users"
$categoryApiUrl = "$baseUrl/categories"

# Dane testowe użytkownika (muszą być istniejące w bazie lub zarejestrowane wcześniej)
# Ten skrypt zakłada, że masz już zarejestrowanego użytkownika i możesz się nim zalogować
$existingUserLogin = "testuser"
$existingUserPassword = "securepassword123"

# Zmienna do przechowywania tokena JWT
$jwtToken = $null
$authenticatedUserId = $null

# --- Krok 1: Logowanie użytkownika, aby uzyskać token JWT ---
Write-Host "--- Logowanie istniejącego użytkownika w celu uzyskania tokena JWT ---"
$loginBody = @{
    login = $existingUserLogin;
    password = $existingUserPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$userApiUrl/login" -Method Post -ContentType "application/json" -Body $loginBody
    Write-Host "Logowanie pomyślne."
    $jwtToken = $loginResponse.token
    $authenticatedUserId = $loginResponse.user._id
    Write-Host "Otrzymany token JWT: $($jwtToken.Substring(0, 30))...$($jwtToken.Substring($jwtToken.Length - 10))" # Wyświetl fragment tokena
    Write-Host "Zalogowany User ID: $authenticatedUserId"
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

if (-not $jwtToken) {
    Write-Host "Brak tokena JWT po zalogowaniu. Nie można kontynuować testów kategorii."
    exit 1
}

# Nagłówki autoryzacyjne dla chronionych endpointów
$authHeaders = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json" # Ważne dla POST/PUT
}

# --- Krok 2: Testowanie dodawania nowej kategorii ---
Write-Host "`n--- Testowanie dodawania nowej kategorii ---"
$newCategoryName = "Transport"
$newCategoryDescription = "Koszty związane z podróżami i dojazdami"
$newCategoryColor = "#FF5733" # Przykład koloru HEX

$addCategoryBody = @{
    name = $newCategoryName;
    description = $newCategoryDescription;
    color = $newCategoryColor
} | ConvertTo-Json

$addedCategoryId = $null
try {
    $addCategoryResponse = Invoke-RestMethod -Uri $categoryApiUrl -Method Post -Headers $authHeaders -Body $addCategoryBody
    Write-Host "Dodawanie kategorii pomyślne:"
    $addCategoryResponse | ConvertTo-Json | Write-Host
    $addedCategoryId = $addCategoryResponse._id
    Write-Host "Dodana kategoria ID: $addedCategoryId"
}
catch {
    Write-Host "Błąd podczas dodawania kategorii:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
}

# --- Krok 3: Testowanie pobierania wszystkich kategorii ---
Write-Host "`n--- Testowanie pobierania wszystkich kategorii ---"
try {
    $allCategoriesResponse = Invoke-RestMethod -Uri $categoryApiUrl -Method Get -Headers $authHeaders
    Write-Host "Pobieranie wszystkich kategorii pomyślne:"
    $allCategoriesResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Błąd podczas pobierania wszystkich kategorii:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Odpowiedź błędu:`n $responseBody"
    }
}

# --- Krok 4: Testowanie pobierania konkretnej kategorii po ID ---
Write-Host "`n--- Testowanie pobierania konkretnej kategorii po ID ---"
if ($addedCategoryId) {
    try {
        $getCategoryResponse = Invoke-RestMethod -Uri "$categoryApiUrl/$addedCategoryId" -Method Get -Headers $authHeaders
        Write-Host "Pobieranie konkretnej kategorii pomyślne:"
        $getCategoryResponse | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Błąd podczas pobierania konkretnej kategorii:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Odpowiedź błędu:`n $responseBody"
        }
    }
} else {
    Write-Host "Brak ID dodanej kategorii, pomijam test pobierania po ID."
}

# --- Krok 5: Testowanie aktualizacji kategorii ---
Write-Host "`n--- Testowanie aktualizacji kategorii ---"
if ($addedCategoryId) {
    $updatedCategoryName = "Transport i Paliwo"
    $updatedCategoryDescription = "Koszty związane z transportem i paliwem"
    $updatedCategoryColor = "#0000FF" # Zmiana koloru

    $updateCategoryBody = @{
        name = $updatedCategoryName;
        description = $updatedCategoryDescription;
        color = $updatedCategoryColor
    } | ConvertTo-Json

    try {
        $updateCategoryResponse = Invoke-RestMethod -Uri "$categoryApiUrl/$addedCategoryId" -Method Put -Headers $authHeaders -Body $updateCategoryBody
        Write-Host "Aktualizacja kategorii pomyślna:"
        $updateCategoryResponse | ConvertTo-Json | Write-Host

        # Możesz ponownie pobrać kategorię, aby upewnić się, że została zaktualizowana
        Write-Host "Pobieranie kategorii po aktualizacji w celu weryfikacji:"
        Invoke-RestMethod -Uri "$categoryApiUrl/$addedCategoryId" -Method Get -Headers $authHeaders | ConvertTo-Json | Write-Host

    }
    catch {
        Write-Host "Błąd podczas aktualizacji kategorii:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Odpowiedź błędu:`n $responseBody"
        }
    }
} else {
    Write-Host "Brak ID dodanej kategorii, pomijam test aktualizacji."
}

# --- Krok 6: Testowanie usuwania kategorii ---
Write-Host "`n--- Testowanie usuwania kategorii ---"
if ($addedCategoryId) {
    try {
        $deleteCategoryResponse = Invoke-RestMethod -Uri "$categoryApiUrl/$addedCategoryId" -Method Delete -Headers $authHeaders
        Write-Host "Usunięcie kategorii pomyślne:"
        $deleteCategoryResponse | ConvertTo-Json | Write-Host

        # Spróbuj ponownie pobrać kategorię, aby upewnić się, że została usunięta (powinien być 404)
        Write-Host "Próba pobrania usuniętej kategorii (oczekiwany błąd 404):"
        try {
            Invoke-RestMethod -Uri "$categoryApiUrl/$addedCategoryId" -Method Get -Headers $authHeaders -ErrorAction Stop
        } catch {
            Write-Host "Otrzymano oczekiwany błąd: $($_.Exception.Message)"
        }
    }
    catch {
        Write-Host "Błąd podczas usuwania kategorii:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Odpowiedź błędu:`n $responseBody"
        }
    }
} else {
    Write-Host "Brak ID dodanej kategorii, pomijam test usuwania."
}

Write-Host "`n--- Koniec testów kategorii ---"