# API settings
$baseUrl = "http://localhost:3001/api"
$userApiUrl = "$baseUrl/users"
$accountApiUrl = "$baseUrl/accounts"

# --- Test user data ---
# Make sure these users exist in your database or register them beforehand.
# User 1 (Account Owner)
$ownerUserLogin = "owneruser"
$ownerUserPassword = "ownerpassword123"

# User 2 (To be shared with)
$sharedUserLogin = "shareduser"
$sharedUserPassword = "sharedpassword123"

# Variables to store JWT tokens and user IDs
$ownerJwtToken = $null
$ownerUserId = $null
$sharedUserJwtToken = $null
$sharedUserId = $null

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

    try {
        $loginResponse = Invoke-RestMethod -Uri "$userApiUrl/login" -Method Post -ContentType "application/json" -Body $loginBody
        Write-Host "User '$login' logged in successfully."
        return $loginResponse
    }
    catch {
        Write-Host "Error during login for user '$login':`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
        return $null
    }
} # End of Get-JwtToken function

# --- Step 1: Account Owner Login ---
Write-Host "--- Account Owner Login ---"
$ownerLoginResult = Get-JwtToken -login $ownerUserLogin -password $ownerUserPassword
if ($ownerLoginResult) {
    $ownerJwtToken = $ownerLoginResult.token
    $ownerUserId = $ownerLoginResult.user._id
    Write-Host "Owner User ID: $ownerUserId"
} else {
    Write-Host "Could not log in account owner. Script will terminate."
    exit 1
} # End of if/else block for owner login

# --- Step 2: Shared User Login ---
Write-Host "`n--- Shared User Login ---"
$sharedLoginResult = Get-JwtToken -login $sharedUserLogin -password $sharedUserPassword
if ($sharedLoginResult) {
    $sharedUserJwtToken = $sharedLoginResult.token
    $sharedUserId = $sharedLoginResult.user._id
    Write-Host "Shared User ID: $sharedUserId"
} else {
    Write-Host "Could not log in shared user. Script will terminate."
    exit 1
} # End of if/else block for shared user login


# Authorization headers for the owner
$ownerAuthHeaders = @{
    "Authorization" = "Bearer $ownerJwtToken"
    "Content-Type" = "application/json"
}

# Authorization headers for the shared user
$sharedUserAuthHeaders = @{
    "Authorization" = "Bearer $sharedUserJwtToken"
    "Content-Type" = "application/json"
}

# --- Step 3: Add a new account by the owner ---
Write-Host "`n--- Testing adding a new account by the owner ---"
$newAccountName = "Personal Account Owner"
$newAccountBalance = 1000.00
$newAccountCurrency = "PLN"
$newAccountNumber = "1234567890"
$newAccountDescription = "Main account for daily expenses"
$newAccountType = "personal"

$addAccountBody = @{
    name = $newAccountName;
    balance = $newAccountBalance;
    currency = $newAccountCurrency;
    accountNumber = $newAccountNumber;
    description = $newAccountDescription;
    type = $newAccountType
} | ConvertTo-Json

$addedAccountId = $null
try {
    $addAccountResponse = Invoke-RestMethod -Uri $accountApiUrl -Method Post -Headers $ownerAuthHeaders -Body $addAccountBody
    Write-Host "Account added successfully:"
    $addAccountResponse | ConvertTo-Json | Write-Host
    $addedAccountId = $addAccountResponse._id
    Write-Host "Added Account ID: $addedAccountId"
}
catch {
    Write-Host "Error while adding account:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error response:`n $responseBody"
    }
} # End of try-catch for adding account

# --- Step 4: Test retrieving all accounts by the owner ---
Write-Host "`n--- Testing retrieving all accounts by the owner ---"
try {
    $ownerAllAccountsResponse = Invoke-RestMethod -Uri $accountApiUrl -Method Get -Headers $ownerAuthHeaders
    Write-Host "Owner retrieved all accounts successfully:"
    $ownerAllAccountsResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "Error while retrieving all accounts by owner:`n $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error response:`n $responseBody"
    }
} # End of try-catch for retrieving all accounts by owner

# --- Step 5: Test retrieving a specific account by the owner ---
Write-Host "`n--- Testing retrieving a specific account by the owner ---"
if ($addedAccountId) {
    try {
        $ownerGetAccountResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $ownerAuthHeaders
        Write-Host "Owner retrieved specific account successfully:"
        $ownerGetAccountResponse | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Error while retrieving specific account by owner:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} else {
    Write-Host "No added account ID, skipping owner's specific account retrieval test."
} # End of if/else for retrieving specific account by owner

# --- Step 6: Test updating account by the owner ---
Write-Host "`n--- Testing updating account by the owner ---"
if ($addedAccountId) {
    $updatedAccountName = "Main Personal Account"
    $updatedAccountBalance = 1500.00
    $updateAccountBody = @{
        name = $updatedAccountName;
        balance = $updatedAccountBalance
    } | ConvertTo-Json

    try {
        $updateAccountResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Put -Headers $ownerAuthHeaders -Body $updateAccountBody
        Write-Host "Account update by owner successful:"
        $updateAccountResponse | ConvertTo-Json | Write-Host

        # Verification
        Write-Host "Retrieving account after update for verification:"
        Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $ownerAuthHeaders | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Error while updating account by owner:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} else {
    Write-Host "No added account ID, skipping update test."
} # End of if/else for updating account by owner

# --- Step 7: Test sharing account with another user (by owner) ---
Write-Host "`n--- Testing sharing account with another user (READ access) ---"
if ($addedAccountId -and $sharedUserId) {
    $shareAccountBody = @{
        sharedWithUserId = $sharedUserId;
        accessLevel = "read"
    } | ConvertTo-Json

    try {
        $shareResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId/share" -Method Post -Headers $ownerAuthHeaders -Body $shareAccountBody
        Write-Host "Account sharing successful:"
        $shareResponse | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Error while sharing account:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} else {
    Write-Host "No account ID or shared user ID, skipping account sharing test."
} # End of if/else for sharing account

# --- Step 8: Test account access by shared user (READ-ONLY) ---
Write-Host "`n--- Testing account access by shared user (READ-ONLY) ---"
if ($addedAccountId -and $sharedUserId) {
    try {
        $sharedUserGetAccountResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $sharedUserAuthHeaders
        Write-Host "Shared user retrieved account successfully (READ-ONLY):"
        $sharedUserGetAccountResponse | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Error while retrieving account by shared user:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }

    # Attempt to update by READ-ONLY user (expected 403 Forbidden error)
    Write-Host "Attempting to update account by READ-ONLY user (expected 403 error):"
    $forbiddenUpdateBody = @{
        name = "Forbidden Update"
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Put -Headers $sharedUserAuthHeaders -Body $forbiddenUpdateBody -ErrorAction Stop
    } catch {
        Write-Host "Received expected error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} # End of if/else for READ-ONLY access test

# --- Step 9: Test changing access level for shared user (FULL access) ---
Write-Host "`n--- Testing changing access level for shared user (FULL access) ---"
if ($addedAccountId -and $sharedUserId) {
    $updateAccessBody = @{
        newAccessLevel = "full"
    } | ConvertTo-Json

    try {
        $updateAccessResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId/share/$sharedUserId" -Method Put -Headers $ownerAuthHeaders -Body $updateAccessBody
        Write-Host "Access level update successful:"
        $updateAccessResponse | ConvertTo-Json | Write-Host
    }
    catch {
        Write-Host "Error while updating access level:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }

    # Attempt to update by FULL access user (expected success)
    Write-Host "Attempting to update account by FULL access user (expected success):"
    $fullAccessUpdateBody = @{
        description = "Updated by shared user"
    } | ConvertTo-Json
    try {
        $successUpdateResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Put -Headers $sharedUserAuthHeaders -Body $fullAccessUpdateBody
        Write-Host "Update by FULL access user successful:"
        $successUpdateResponse | ConvertTo-Json | Write-Host

        # Verification
        Write-Host "Retrieving account after update by FULL access user:"
        Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $ownerAuthHeaders | ConvertTo-Json | Write-Host

    } catch {
        Write-Host "Error during update attempt by FULL access user (unexpected):`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} # End of if/else for FULL access test

# --- Step 10: Test unsharing account (by owner) ---
Write-Host "`n--- Testing unsharing account ---"
if ($addedAccountId -and $sharedUserId) {
    try {
        $unshareResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId/share/$sharedUserId" -Method Delete -Headers $ownerAuthHeaders
        Write-Host "Account unshared successfully:"
        $unshareResponse | ConvertTo-Json | Write-Host

        # Attempt to access account by unshared user (expected 404 error)
        Write-Host "Attempting to access account by unshared user (expected 404 error):"
        try {
            Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $sharedUserAuthHeaders -ErrorAction Stop
        } catch {
            Write-Host "Received expected error: $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $responseStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($responseStream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Error response:`n $responseBody"
            }
        }
    }
    catch {
        Write-Host "Error while unsharing account:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} else {
    Write-Host "No account ID or shared user ID, skipping unsharing test."
} # End of if/else for unsharing account


# --- Step 11: Test deleting account by the owner ---
Write-Host "`n--- Testing deleting account by the owner ---"
if ($addedAccountId) {
    try {
        $deleteAccountResponse = Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Delete -Headers $ownerAuthHeaders
        Write-Host "Account deletion by owner successful:"
        $deleteAccountResponse | ConvertTo-Json | Write-Host

        # Try to retrieve the account again to ensure it's deleted (expected 404)
        Write-Host "Attempting to retrieve deleted account (expected 404 error):"
        try {
            Invoke-RestMethod -Uri "$accountApiUrl/$addedAccountId" -Method Get -Headers $ownerAuthHeaders -ErrorAction Stop
        } catch {
            Write-Host "Received expected error: $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $responseStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($responseStream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Error response:`n $responseBody"
            }
        }
    }
    catch {
        Write-Host "Error while deleting account:`n $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error response:`n $responseBody"
        }
    }
} else {
    Write-Host "No added account ID, skipping deletion test."
} # End of if/else for deleting account by owner


Write-Host "`n--- End of account tests ---"