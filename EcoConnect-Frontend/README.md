# EcoConnect Frontend — Step 1

A polished, responsive React/Vite frontend for the EcoConnect environmental reporting platform.

## Included in this step
- Nature-inspired landing page and responsive navigation
- Hero section with “cleaner world” visual illustration
- How it works, community report previews, map-style visual, impact and partner sections
- Login/create-account entry modal
- Email or phone login method selector
- OTP entry screen and basic input validation
- Accessible dialog labels, responsive mobile layout and reusable components

## Run in VS Code
1. Install Node.js 18 or newer.
2. Extract this folder and open it in VS Code.
3. Open Terminal → New Terminal.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the local address Vite prints, usually `http://localhost:5173`.

## OTP limitation — important
This is the **frontend-only first step**. The login flow moves to an OTP screen after validating the email/phone input, but it does **not send a real OTP yet**. Real email OTP needs a backend plus an email provider (for example SMTP/Resend); real SMS OTP needs a provider such as Twilio or an India-supported SMS gateway. Never treat a frontend-only OTP as secure authentication. We will connect this in the backend step.

The issue cards and map markers are sample visual content, not live reports or real map data. No database is connected yet.
