# Skrypt PowerShell do pobierania wszystkich transakcji dla użytkownika

# --- Konfiguracja ---
$BaseUrl = "http://localhost:3001/api" # Adres URL Twojego backendu (bez końcowego '/')
$LoginEndpoint = "$BaseUrl/users/login"
$AccountsEndpoint = "$BaseUrl/accounts"
$TransactionsEndpointBase = "$BaseUrl/accounts" # Będzie rozszerzone o accountId/transactions

$Username = "testuser"
$Password = "securepassword123"          # Zmień na hasło użytkownika

# --- Funkcja pomocnicza do wysyłania żądań HTTP ---
function Invoke-ApiRequest {
    param (
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$AuthToken = $null
    )

    $Headers = @{
        "Content-Type" = "application/json"
    }

    if ($AuthToken) {
        $Headers["Authorization"] = "Bearer $AuthToken"
    }

    $Params = @{
        Method  = $Method
        Uri     = $Uri
        Headers = $Headers
    }

    if ($Body) {
        # Invoke-RestMethod automatycznie konwertuje tablice haszujące na JSON dla Body,
        # ale dla pewności i spójności z logowaniem, jawnie konwertujemy.
        $Params.Body = ($Body | ConvertTo-Json -Compress)
    }

    Write-Host "Sending $($Method) request to $Uri" -ForegroundColor Green
    if ($AuthToken) {
        # Logowanie tylko fragmentu tokenu dla bezpieczeństwa
        Write-Host "  with Authorization token (first 10 chars): $($AuthToken.Substring(0, [System.Math]::Min(10, $AuthToken.Length)))" -ForegroundColor DarkGray
    }
    if ($Body) {
        # Logowanie skompresowanego JSON, aby było czytelniejsze w konsoli
        Write-Host "  with Body: $($Body | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
    }

    try {
        $Response = Invoke-RestMethod @Params -ErrorAction Stop
        Write-Host "  Response Status: OK" -ForegroundColor Green
        return $Response
    }
    catch {
        Write-Error "Request to $Uri failed. Error: $($_.Exception.Message)"
        # Jeśli wystąpił błąd HTTP, spróbuj odczytać treść odpowiedzi
        if ($_.Exception.Response) {
            $ErrorResponseStream = $_.Exception.Response.GetResponseStream()
            $StreamReader = New-Object System.IO.StreamReader($ErrorResponseStream)
            $ErrorMessage = $StreamReader.ReadToEnd()
            Write-Error "  API Error Details: $ErrorMessage"
        }
        return $null
    }
}

# --- 1. Logowanie użytkownika ---
Write-Host "--- Logging in user: $Username ---" -ForegroundColor Cyan

$LoginBody = @{
    email    = $Username
    password = $Password
}

$LoginResponse = Invoke-ApiRequest -Method Post -Uri $LoginEndpoint -Body $LoginBody

if ($LoginResponse -and $LoginResponse.token) {
    $AuthToken = $LoginResponse.token
    Write-Host "Successfully logged in. Received token." -ForegroundColor Green
} else {
    Write-Error "Failed to log in. Exiting."
    exit
}

# --- 2. Pobieranie wszystkich kont użytkownika ---
Write-Host "`n--- Fetching user accounts ---" -ForegroundColor Cyan

$Accounts = Invoke-ApiRequest -Method Get -Uri $AccountsEndpoint -AuthToken $AuthToken

if ($Accounts) {
    Write-Host "Found $($Accounts.Length) accounts." -ForegroundColor Green
    $Accounts | ForEach-Object {
        Write-Host "  Account Name: $($_.name), ID: $($_._id)" -ForegroundColor DarkYellow
    }
} else {
    Write-Error "No accounts found or failed to fetch accounts. Exiting."
    exit
}

# --- 3. Pobieranie wszystkich transakcji dla każdego konta ---
Write-Host "`n--- Fetching transactions for each account ---" -ForegroundColor Cyan

if ($Accounts.Length -gt 0) {
    foreach ($Account in $Accounts) {
        $AccountId = $Account._id
        $AccountName = $Account.name
        $TransactionsUri = "$TransactionsEndpointBase/$AccountId/transactions"

        Write-Host "`n  Fetching transactions for account: '$AccountName' (ID: $AccountId)" -ForegroundColor Yellow

        $Transactions = Invoke-ApiRequest -Method Get -Uri $TransactionsUri -AuthToken $AuthToken

        if ($Transactions) {
            Write-Host "    Found $($Transactions.Length) transactions for account '$AccountName'." -ForegroundColor Green
            if ($Transactions.Length -gt 0) {
                # Jeśli jest tylko jedna transakcja, $Transactions może być pojedynczym obiektem, a nie tablicą.
                # Zapewniamy, że zawsze traktujemy to jako tablicę.
                $Transactions | ForEach-Object {
                    Write-Host "      Transaction ID: $($_._id), Type: $($_.type), Amount: $($_.amount) $($_.currency), Description: $($_.description)" -ForegroundColor DarkGray
                }
            }
        } else {
            Write-Error "    Failed to fetch transactions for account '$AccountName' (ID: $AccountId)."
        }
    }
} else {
    Write-Host "No accounts to fetch transactions for." -ForegroundColor Yellow
}

Write-Host "`n--- Script Finished ---" -ForegroundColor Cyan