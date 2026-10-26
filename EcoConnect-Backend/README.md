# EcoConnect Backend — Step 2

Node.js + Express starter API for the EcoConnect React frontend.

## Requirements
- Node.js 18 or newer
- npm
- VS Code

## Run locally
1. Extract/open `EcoConnect-Backend` in VS Code.
2. Open the terminal in this folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Create `.env` from `.env.example`. In PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Open `.env` and replace `JWT_SECRET` with a long, unique random secret. Do not share or commit `.env`.
6. Start the API:
   ```bash
   npm run dev
   ```
7. Visit `http://localhost:5000/api/health`. You should see JSON confirming the API is running.

## API endpoints

### Health check
`GET http://localhost:5000/api/health`

### Request OTP — development only
`POST http://localhost:5000/api/auth/request-otp`
JSON body:
```json
{ "method": "email", "identifier": "you@example.com" }
```
Or:
```json
{ "method": "phone", "identifier": "+919876543210" }
```
The generated OTP appears in the backend terminal. No email or SMS is sent yet.

### Verify OTP
`POST http://localhost:5000/api/auth/verify-otp`
JSON body:
```json
{ "method": "email", "identifier": "you@example.com", "otp": "123456" }
```
Use the actual OTP printed in the backend terminal. Successful verification returns a JWT and a basic user identity.

## Frontend connection
Keep React running on `http://localhost:5173` and this API running on `http://localhost:5000`.

- `POST http://localhost:5000/api/auth/request-otp`
- `POST http://localhost:5000/api/auth/verify-otp`

Example:
```js
const response = await fetch("http://localhost:5000/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ method: "email", identifier: email })
});
const data = await response.json();
```

## Limitations
- This is a development starter, not production authentication.
- OTPs are logged to the terminal; no email/SMS is sent.
- OTPs are stored in memory and disappear when the server restarts.
- No MongoDB persistence or full user-account system is included yet.
- Before production, integrate a real email/SMS provider, persistent storage, and stronger abuse/privacy/security controls.
