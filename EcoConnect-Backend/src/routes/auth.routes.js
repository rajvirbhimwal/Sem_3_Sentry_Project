
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const otpStore = require("../utils/otpStore");
const sendOtpEmail = require("../utils/sendOtpEmail");
const User = require("../models/User");

const router = express.Router();

const OTP_LENGTH = Math.min(
  8,
  Math.max(4, Number(process.env.OTP_LENGTH) || 6)
);

const OTP_TTL_MINUTES = Math.max(
  1,
  Number(process.env.OTP_TTL_MINUTES) || 5
);

// Normalize email addresses and phone numbers.
function normalizeIdentifier(method, value) {
  if (typeof value !== "string") {
    return "";
  }

  const identifier = value.trim();

  return method === "email"
    ? identifier.toLowerCase()
    : identifier.replace(/[^\d+]/g, "");
}

// Validate email addresses and phone numbers.
function validIdentifier(method, value) {
  if (method === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (method === "phone") {
    return /^\+?[1-9]\d{7,14}$/.test(value);
  }

  return false;
}

// Generate a cryptographically secure numeric OTP.
function createOtp() {
  return crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

// Retrieve the JWT secret.
function jwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    !secret ||
    secret === "replace_this_with_a_long_random_secret"
  ) {
    throw new Error("Set a unique JWT_SECRET in your .env file.");
  }

  return secret;
}

// Limit OTP requests per identifier.
const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const method = req.body?.method || "unknown";

    const identifier =
      typeof req.body?.identifier === "string"
        ? req.body.identifier.trim().toLowerCase()
        : "unknown";

    return `${method}:${identifier}`;
  },
  message: {
    success: false,
    message:
      "Too many OTP requests. Please wait a few minutes and try again."
  }
});

// Limit OTP verification attempts.
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Try again later."
  }
});

// POST /api/auth/request-otp
router.post("/request-otp", requestLimiter, async (req, res, next) => {
  try {
    const method = req.body?.method;

    const identifier = normalizeIdentifier(
      method,
      req.body?.identifier
    );

    if (!["email", "phone"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'method must be "email" or "phone".'
      });
    }

    if (!validIdentifier(method, identifier)) {
      return res.status(400).json({
        success: false,
        message:
          method === "email"
            ? "Enter a valid email address."
            : "Enter a valid phone number with country code, e.g. +919876543210."
      });
    }

    // Phone OTP delivery is not configured yet.
    if (method === "phone") {
      return res.status(501).json({
        success: false,
        message:
          "SMS delivery is not configured yet. Please use email verification."
      });
    }

    // Check email configuration.
    if (
      !process.env.GMAIL_USER ||
      !process.env.GMAIL_APP_PASSWORD
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Email delivery is not configured. Check your backend .env file."
      });
    }

    const otp = createOtp();
    const key = `${method}:${identifier}`;

    // Send the OTP before storing it.
    try {
      await sendOtpEmail(identifier, otp);
    } catch (error) {
      console.error("OTP delivery failed:", error.message);

      return res.status(502).json({
        success: false,
        message:
          "Could not send the verification email. Check your email configuration and try again."
      });
    }

    // Save OTP and expiry time.
    otpStore.save(key, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MINUTES * 60 * 1000,
      attempts: 0
    });

    console.log(`[EcoConnect] Email OTP sent to ${identifier}`);

    return res.json({
      success: true,
      message: "A verification code has been sent to your email.",
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      deliveryMode: "email"
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", verifyLimiter, async (req, res, next) => {
  try {
    const method = req.body?.method;

    const identifier = normalizeIdentifier(
      method,
      req.body?.identifier
    );

    const otp = req.body?.otp;

    if (
      method !== "email" ||
      !validIdentifier(method, identifier)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid email address."
      });
    }

    // Validate OTP format.
    const otpPattern = new RegExp(`^\\d{${OTP_LENGTH}}$`);

    if (typeof otp !== "string" || !otpPattern.test(otp)) {
      return res.status(400).json({
        success: false,
        message: `OTP must contain exactly ${OTP_LENGTH} digits.`
      });
    }

    const key = `${method}:${identifier}`;
    const saved = otpStore.get(key);

    if (!saved) {
      return res.status(400).json({
        success: false,
        message: "No active OTP found. Request a new code."
      });
    }

    // Check OTP expiry.
    if (Date.now() > saved.expiresAt) {
      otpStore.delete(key);

      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new code."
      });
    }

    // Limit incorrect attempts for this OTP.
    if (saved.attempts >= 5) {
      otpStore.delete(key);

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP."
      });
    }

    // Compare the supplied OTP.
    if (saved.otp !== otp) {
      saved.attempts += 1;
      otpStore.save(key, saved);

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Check the code and try again.",
        attemptsRemaining: Math.max(0, 5 - saved.attempts)
      });
    }

    // Create the account if it doesn't exist.
    // Existing user details and role are preserved.
    const user = await User.findOneAndUpdate(
      { email: identifier },
      {
        $setOnInsert: {
          email: identifier,
          role: "citizen",
          emailVerified: true,
          isActive: true
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account is disabled. Please contact EcoConnect support."
      });
    }

    // Remove OTP after successful verification.
    otpStore.delete(key);

    // Generate JWT.
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role
      },
      jwtSecret(),
      {
        expiresIn: "2h",
        issuer: "ecoconnect-api"
      }
    );

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      token,
      user: {
        id: user._id.toString(),
        identifier: user.email,
        email: user.email,
        method: "email",
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

