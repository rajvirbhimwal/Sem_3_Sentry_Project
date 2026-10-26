EcoConnect: MongoDB user persistence update

1. Copy src/models/User.js into your backend's src/models/User.js (create the models folder if needed).
2. Replace your backend's src/routes/auth.routes.js with the supplied auth.routes.js.
3. Keep your existing src/db.js, src/utils/otpStore.js, and src/utils/sendOtpEmail.js.
4. Ensure server.js calls and awaits connectDB() before accepting requests.
5. Ensure .env has MONGODB_URI, JWT_SECRET, GMAIL_USER, and GMAIL_APP_PASSWORD.
6. Restart with npm run dev and test request-otp then verify-otp.

The first successful email OTP verification creates a MongoDB user with role "citizen". Existing users retain their saved role and name. Phone/SMS verification is not implemented in this version.
Do not commit .env or share secrets.
