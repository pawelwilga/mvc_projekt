# Aplikacja do Zarządzania Budżetem Domowym

Ta aplikacja to kompleksowe narzędzie do organizacji Twojego budżetu domowego, umożliwiające zarządzanie kontami i kategoryzowanie transakcji. Składa się z dwóch głównych komponentów: backendowego API (Node.js) i frontendowej aplikacji webowej (Node.js).

---

## Struktura Projektu

Projekt jest zorganizowany w monorepo, zawierające dwa główne katalogi: `api` dla backendu i `frontend` dla interfejsu użytkownika.

Jasne, oto treść README.md w formacie Markdown, gotowa do skopiowania i wklejenia do Twojego projektu:

Markdown

# Aplikacja do Zarządzania Budżetem Domowym

Ta aplikacja to kompleksowe narzędzie do organizacji Twojego budżetu domowego, umożliwiające zarządzanie kontami i kategoryzowanie transakcji. Składa się z dwóch głównych komponentów: backendowego API (Node.js) i frontendowej aplikacji webowej (Node.js).

---

## Struktura Projektu

Projekt jest zorganizowany w monorepo, zawierające dwa główne katalogi: `api` dla backendu i `frontend` dla interfejsu użytkownika.

.
├───api/                      # Katalog zawierający kod backendu (API)
│   ├───constants/            # Stałe używane w API
│   ├───controllers/          # Logika biznesowa obsługująca żądania API
│   ├───models/               # Schematy i modele danych MongoDB
│   └───routes/               # Definicje ścieżek API
├───frontend/                 # Katalog zawierający kod interfejsu użytkownika
│   ├───controllers/          # Logika obsługująca żądania frontendowe i renderowanie widoków
│   ├───models/               # Modele danych używane po stronie frontendu (jeśli występują)
│   ├───public/               # Statyczne pliki publiczne (CSS, JavaScript, obrazy)
│   │   ├───css/              # Arkusze stylów
│   │   └───js/               # Skrypty JavaScript
│   ├───routes/               # Definicje ścieżek frontendowych
│   └───views/                # Szablony widoków aplikacji
│       ├───accounts/         # Widoki związane z zarządzaniem kontami
│       ├───auth/             # Widoki związane z uwierzytelnianiem
│       ├───categories/       # Widoki związane z zarządzaniem kategoriami
│       ├───layouts/          # Główne szablony układu strony
│       ├───partials/         # Mniejsze, wielokrotnie używane fragmenty widoków
│       └───transactions/     # Widoki związane z zarządzaniem transakcjami
└───misc/                     # Dodatkowe pliki lub zasoby (np. dokumentacja, skrypty pomocnicze)


---

## Wymagania

Przed uruchomieniem projektu upewnij się, że masz zainstalowane:

* **Node.js**: Zalecana wersja LTS.
* **npm** lub **Yarn**: Menedżer pakietów Node.js.
* **MongoDB**: Dostęp do instancji bazy danych MongoDB (lokalnie lub w chmurze, np. MongoDB Atlas).

---

## Instalacja

Aby zainstalować zależności dla obu części aplikacji, wykonaj następujące kroki:

1.  **Sklonuj repozytorium:**
    ```bash
    git clone <adres_repozytorium>
    cd <nazwa_repozytorium>
    ```

2.  **Zainstaluj zależności dla API:**
    ```bash
    cd api
    npm install # lub yarn install
    cd ..
    ```

3.  **Zainstaluj zależności dla Frontendu:**
    ```bash
    cd frontend
    npm install # lub yarn install
    cd ..
    ```

---

## Konfiguracja (Pliki `.env`)

Aplikacja wykorzystuje pliki `.env` do zarządzania zmiennymi środowiskowymi. Musisz utworzyć te pliki w katalogach `api` i `frontend`.

### Konfiguracja API (`api/.env`)

Utwórz plik o nazwie `.env` w katalogu `api` i wklej do niego następującą zawartość, zastępując wartości swoimi danymi (szczególnie `MONGO_URI` i `JWT_SECRET`):

```
PORT=3001
MONGO_URI=mongodb+srv://vilguss:D04aIR9yN64RlFEA@wilga-net.6jqgogy.mongodb.net/?retryWrites=true&w=majority&appName=wilgaet
JWT_SECRET=alaMaK0TTTa@ToJ3$dsekrednyKluczShyfujÄ…cyDenne
```

* PORT: Port, na którym będzie nasłuchiwać API.
* MONGO_URI: Adres URI do Twojej bazy danych MongoDB.
* JWT_SECRET: Sekretny klucz używany do podpisywania tokenów JWT (ważny dla bezpieczeństwa, zmień na własny, silny klucz).

Konfiguracja Frontendu (frontend/.env)
Utwórz plik o nazwie .env w katalogu frontend i wklej do niego następującą zawartość:

Fragment kodu

```
API_BASE_URL=http://localhost:3001/api
SESSION_SECRET=klucz-do_szafkizCiastk@mi!
API_BASE_URL: Adres URL, pod którym frontend będzie komunikował się z API.
SESSION_SECRET: Sekretny klucz używany do podpisywania sesji. Zmień na własny, silny klucz dla zwiększenia bezpieczeństwa.
```

Uruchomienie Projektu
Aby uruchomić aplikację, musisz uruchomić serwer API i serwer frontendowy osobno.

Uruchomienie API:
Przejdź do katalogu api i uruchom serwer:

`cd api`
`npm start`

API będzie dostępne pod adresem http://localhost:3001.

Uruchomienie Frontendu:
Otwórz nowe okno terminala, przejdź do katalogu frontend i uruchom serwer:

`cd frontend`
`npm start`

Frontend będzie dostępny pod adresem http://localhost:3000 (lub innym, w zależności od konfiguracji).

Po uruchomieniu obu serwerów, możesz otworzyć przeglądarkę i przejść pod adres frontendu, aby zacząć korzystać z aplikacji.