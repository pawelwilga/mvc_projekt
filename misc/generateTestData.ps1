# API Base URL
$baseUrl = "http://localhost:3001/api"
$userApiUrl = "$baseUrl/users"
$accountApiUrl = "$baseUrl/accounts"
$transactionApiUrl = "$baseUrl/transactions" # Global transaction endpoint for transfers

# --- User Data ---
$ownerUserLogin = "owneruser"
$ownerUserPassword = "ownerpassword123"
$ownerUserEmail = "owner@example.com"
$sharedUserLogin = "shareduser"
$sharedUserPassword = "sharedpassword123"
$sharedUserEmail = "shared@example.com"

# --- Variables to store JWT tokens and IDs ---
$ownerJwtToken = $null
$ownerUserId = $null
$sharedUserJwtToken = $null
$sharedUserId = $null

$ownerMainAccountId = $null
$ownerSavingsAccountId = $null
$sharedAccountId = $null

# --- Helper Function to Handle API Calls ---
function Invoke-ApiCall {
    param (
        [string]$Uri,
        [string]$Method,
        [string]$Body = $null,
        [Hashtable]$Headers = @{},
        [string]$ErrorAction = "Continue" # "Stop" or "Continue"
    )

    try {
        $params = @{
            Uri         = $Uri
            Method      = $Method
            ContentType = "application/json"
            Headers     = $Headers
        }

        if ($Body) {
            $params.Add("Body", $Body)
        }

        Invoke-RestMethod @params -ErrorAction Stop # Use -ErrorAction Stop for immediate error handling
        #Write-Host "API call to $Uri ($Method) successful." -ForegroundColor Green
    }
    catch {
        Write-Host "Error during API call to $Uri ($Method): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response body:`n $responseBody" -ForegroundColor Red
        }
        if ($ErrorAction -eq "Stop") {
            exit 1
        }
        return $null # Return null on error
    }
}

# --- Helper function for user login ---
function Get-JwtToken {
    param (
        [string]$login,
        [string]$password
    )
    $loginBody = @{
        login = $login;
        password = $password
    } | ConvertTo-Json

    Write-Host "Attempting to log in user '$login'..." -ForegroundColor Cyan
    $loginResponse = Invoke-ApiCall -Uri "$userApiUrl/login" -Method Post -Body $loginBody -ErrorAction Stop
    if ($loginResponse) {
        Write-Host "User '$login' logged in successfully." -ForegroundColor Green
        return $loginResponse
    } else {
        Write-Host "Failed to log in user '$login'." -ForegroundColor Red
        return $null
    }
}

# --- Step 0: Ensure users exist (Register if not) ---
Write-Host "`n--- Step 0: Ensuring Users Exist ---"

function Register-User {
    param (
        [string]$login,
        [string]$password,
        [string]$email
    )
    $registerBody = @{
        login = $login;
        password = $password;
        email = $email;
        defaultCurrency = "PLN"
    } | ConvertTo-Json

    Write-Host "Attempting to register user '$login'..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri "$userApiUrl/register" -Method Post -Body $registerBody -ErrorAction Continue
    if ($response) {
        Write-Host "User '$login' registered successfully." -ForegroundColor Green
        return $true
    } elseif ($response -eq $null -and ($LASTEXITCODE -eq 409 -or $Error[0].Exception.Message -match "already exists")) { # Check for 409 Conflict
        Write-Host "User '$login' already exists, continuing." -ForegroundColor Yellow
        return $true
    } else {
        Write-Host "Failed to register user '$login'. Aborting." -ForegroundColor Red
        return $false
    }
}

if (!(Register-User -login $ownerUserLogin -password $ownerUserPassword -email $ownerUserEmail)) { exit 1 }
if (!(Register-User -login $sharedUserLogin -password $sharedUserPassword -email $sharedUserEmail)) { exit 1 }

# --- Step 1: Login Users and Get Tokens/IDs ---
Write-Host "`n--- Step 1: Logging in Users ---"

$ownerLoginResult = Get-JwtToken -login $ownerUserLogin -password $ownerUserPassword
if ($ownerLoginResult) {
    $ownerJwtToken = $ownerLoginResult.token
    $ownerUserId = $ownerLoginResult.user._id
    Write-Host "Owner User ID: $ownerUserId" -ForegroundColor Green
} else {
    Write-Host "Owner login failed. Exiting." -ForegroundColor Red
    exit 1
}

$sharedLoginResult = Get-JwtToken -login $sharedUserLogin -password $sharedUserPassword
if ($sharedLoginResult) {
    $sharedUserJwtToken = $sharedLoginResult.token
    $sharedUserId = $sharedLoginResult.user._id
    Write-Host "Shared User ID: $sharedUserId" -ForegroundColor Green
} else {
    Write-Host "Shared user login failed. Exiting." -ForegroundColor Red
    exit 1
}

$ownerAuthHeaders = @{ "Authorization" = "Bearer $ownerJwtToken"; "Content-Type" = "application/json" }
$sharedUserAuthHeaders = @{ "Authorization" = "Bearer $sharedUserJwtToken"; "Content-Type" = "application/json" }


# --- Step 2: Create Accounts ---
Write-Host "`n--- Step 2: Creating Accounts ---"

function Create-Account {
    param (
        [string]$name,
        [double]$balance,
        [string]$currency,
        [string]$accountNumber,
        [string]$description,
        [string]$type,
        [Hashtable]$authHeaders
    )
    $body = @{
        name = $name;
        balance = $balance;
        currency = $currency;
        accountNumber = $accountNumber;
        description = $description;
        type = $type
    } | ConvertTo-Json

    Write-Host "Attempting to create account '$name'..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri $accountApiUrl -Method Post -Headers $authHeaders -Body $body -ErrorAction Continue
    if ($response) {
        Write-Host "Account '$name' created successfully. ID: $($response._id)" -ForegroundColor Green
        return $response._id
    } else {
        Write-Host "Failed to create account '$name'." -ForegroundColor Red
        return $null
    }
}

$ownerMainAccountId = Create-Account -name "Owner Main Account" -balance 1000.00 -currency "PLN" -accountNumber "OM1234567890" -description "Owner's primary account" -type "personal" -authHeaders $ownerAuthHeaders
$ownerSavingsAccountId = Create-Account -name "Owner Savings Account" -balance 5000.00 -currency "PLN" -accountNumber "OS1234567890" -description "Owner's savings account" -type "savings" -authHeaders $ownerAuthHeaders
$sharedAccountId = Create-Account -name "Shared Family Account" -balance 200.00 -currency "PLN" -accountNumber "SF1234567890" -description "Account shared with family" -type "joint" -authHeaders $ownerAuthHeaders

if (!$ownerMainAccountId -or !$ownerSavingsAccountId -or !$sharedAccountId) {
    Write-Host "Failed to create one or more accounts. Exiting." -ForegroundColor Red
    exit 1
}

# --- Step 3: Share Shared Account with Shared User ---
Write-Host "`n--- Step 3: Sharing 'Shared Family Account' with '$sharedUserLogin' ---"

function Share-Account {
    param (
        [string]$accountId,
        [string]$sharedWithUserId,
        [string]$accessLevel,
        [Hashtable]$authHeaders
    )
    $body = @{
        sharedWithUserId = $sharedWithUserId;
        accessLevel = $accessLevel
    } | ConvertTo-Json

    Write-Host "Attempting to share account '$accountId' with user '$sharedWithUserId' ($accessLevel access)..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri "$accountApiUrl/$accountId/share" -Method Post -Headers $authHeaders -Body $body -ErrorAction Continue
    if ($response) {
        Write-Host "Account '$accountId' shared successfully with '$sharedWithUserId' as '$accessLevel'." -ForegroundColor Green
        return $true
    } else {
        Write-Host "Failed to share account '$accountId' with '$sharedWithUserId'." -ForegroundColor Red
        return $false
    }
}

if (!(Share-Account -accountId $sharedAccountId -sharedWithUserId $sharedUserId -accessLevel "full" -authHeaders $ownerAuthHeaders)) {
    Write-Host "Failed to share the joint account. Exiting." -ForegroundColor Red
    exit 1
}


# --- Step 4: Add Transactions (Income/Expense) by Owner ---
Write-Host "`n--- Step 4: Adding Income/Expense Transactions by Owner ---"

function Add-Transaction {
    param (
        [string]$accountId,
        [string]$type, # 'income' or 'expense'
        [string]$category,
        [double]$amount,
        [string]$currency,
        [string]$description,
        [Hashtable]$authHeaders
    )
    $body = @{
        type = $type;
        category = $category;
        amount = $amount;
        currency = $currency;
        description = $description
    } | ConvertTo-Json

    Write-Host "Adding $($type) transaction to account '$accountId' (Amount: $amount $currency)..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri "$accountApiUrl/$accountId/transactions" -Method Post -Headers $authHeaders -Body $body -ErrorAction Continue
    if ($response) {
        Write-Host "$($type) transaction added successfully. ID: $($response.transactionId)" -ForegroundColor Green
        return $response.transactionId
    } else {
        Write-Host "Failed to add $($type) transaction to account '$accountId'." -ForegroundColor Red
        return $null
    }
}

# Transactions for Owner Main Account
Add-Transaction -accountId $ownerMainAccountId -type "income" -category "Salary" -amount 3000.00 -currency "PLN" -description "Monthly salary" -authHeaders $ownerAuthHeaders
Add-Transaction -accountId $ownerMainAccountId -type "expense" -category "Groceries" -amount 150.00 -currency "PLN" -description "Weekly groceries" -authHeaders $ownerAuthHeaders
Add-Transaction -accountId $ownerMainAccountId -type "expense" -category "Utilities" -amount 250.00 -currency "PLN" -description "Electricity bill" -authHeaders $ownerAuthHeaders

# Transactions for Owner Savings Account
Add-Transaction -accountId $ownerSavingsAccountId -type "income" -category "Interest" -amount 50.00 -currency "PLN" -description "Savings interest" -authHeaders $ownerAuthHeaders

# Transactions for Shared Family Account by owner
Add-Transaction -accountId $sharedAccountId -type "income" -category "Contribution" -amount 100.00 -currency "PLN" -description "Owner's contribution to joint expenses" -authHeaders $ownerAuthHeaders


# --- Step 5: Perform Transfers ---
Write-Host "`n--- Step 5: Performing Transfers ---"

function Perform-Transfer {
    param (
        [string]$senderAccountId,
        [string]$receiverAccountId,
        [double]$amount,
        [string]$currency,
        [string]$description,
        [string]$category,
        [Hashtable]$authHeaders
    )
    $body = @{
        amount = $amount;
        currency = $currency;
        description = $description;
        category = $category
    } | ConvertTo-Json

    Write-Host "Performing transfer from '$senderAccountId' to '$receiverAccountId' (Amount: $amount $currency)..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri "$transactionApiUrl/$senderAccountId/transfer/$receiverAccountId" -Method Post -Headers $authHeaders -Body $body -ErrorAction Continue
    if ($response) {
        Write-Host "Transfer successful. Sender Transaction ID: $($response.senderTransactionId), Receiver Transaction ID: $($response.receiverTransactionId)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Failed to perform transfer from '$senderAccountId' to '$receiverAccountId'." -ForegroundColor Red
        return $false
    }
}

# Transfer from Owner Main to Owner Savings
Perform-Transfer -senderAccountId $ownerMainAccountId -receiverAccountId $ownerSavingsAccountId -amount 500.00 -currency "PLN" -description "Savings transfer" -category "Savings" -authHeaders $ownerAuthHeaders

# Transfer from Owner Main to Shared Family Account
Perform-Transfer -senderAccountId $ownerMainAccountId -receiverAccountId $sharedAccountId -amount 100.00 -currency "PLN" -description "Contribution to shared expenses" -category "Joint Contribution" -authHeaders $ownerAuthHeaders


# --- Step 6: Add Transactions by Shared User on Shared Account ---
Write-Host "`n--- Step 6: Adding Transactions by Shared User on Shared Account ---"

# This should work because shared user has 'full' access
Add-Transaction -accountId $sharedAccountId -type "expense" -category "Shared Food" -amount 80.00 -currency "PLN" -description "Shared groceries by shared user" -authHeaders $sharedUserAuthHeaders
Add-Transaction -accountId $sharedAccountId -type "income" -category "Shared Income" -amount 50.00 -currency "PLN" -description "Shared user's contribution" -authHeaders $sharedUserAuthHeaders


# --- Step 7: Verify Account Balances (Optional, but Recommended) ---
Write-Host "`n--- Step 7: Verifying Final Account Balances ---"

function Get-AccountDetails {
    param (
        [string]$accountId,
        [Hashtable]$authHeaders
    )
    Write-Host "Fetching details for account '$accountId'..." -ForegroundColor Cyan
    $response = Invoke-ApiCall -Uri "$accountApiUrl/$accountId" -Method Get -Headers $authHeaders -ErrorAction Continue
    if ($response) {
        Write-Host "Account: $($response.name), Balance: $($response.balance) $($response.currency)" -ForegroundColor Green
        return $response
    } else {
        Write-Host "Failed to fetch details for account '$accountId'." -ForegroundColor Red
        return $null
    }
}

Get-AccountDetails -accountId $ownerMainAccountId -authHeaders $ownerAuthHeaders
Get-AccountDetails -accountId $ownerSavingsAccountId -authHeaders $ownerAuthHeaders
Get-AccountDetails -accountId $sharedAccountId -authHeaders $ownerAuthHeaders # Owner can see shared account
Get-AccountDetails -accountId $sharedAccountId -authHeaders $sharedUserAuthHeaders # Shared user can see shared account


Write-Host "`n--- Data Generation Complete ---"
Write-Host "You can now check your MongoDB database for users, accounts, and transactions."
Write-Host "You can also use the accountEndpoints.ps1 script to verify the endpoints."