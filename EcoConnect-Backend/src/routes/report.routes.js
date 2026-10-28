const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/reports — Submit a new environmental report
router.post("/", auth, async (req, res, next) => {
    try {
        const {
            title,
            category,
            description,
            location
        } = req.body;

        if (
            !title?.trim() ||
            !category ||
            !description?.trim() ||
            !location?.address?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, category, description, and location are required."
            });
        }

        const report = await Report.create({
            title: title.trim(),
            category,
            description: description.trim(),
            location: {
                address: location.address.trim(),
                latitude: location.latitude,
                longitude: location.longitude
            },
            reportedBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Environmental report submitted successfully.",
            report
        });


    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);


    }
});

// GET /api/reports/my — Get the logged-in user's reports
router.get("/my", auth, async (req, res, next) => {
    try {
        const reports = await Report.find({
            reportedBy: req.user.id
        }).sort({ createdAt: -1 });


        return res.json({
            success: true,
            count: reports.length,
            reports
        });


    } catch (error) {
        next(error);
    }
});

module.exports = router;
