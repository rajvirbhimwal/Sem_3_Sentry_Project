const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Report = require("../models/Report");
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure uploads/reports directory exists
const uploadDir = path.join(__dirname, "../../uploads/reports");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `report-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 4 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
        }
    }
});

// POST /api/reports — Submit a new environmental report with optional images
router.post("/", auth, upload.array("images", 4), async (req, res, next) => {
    try {
        const { title, category, description } = req.body;

        // Parse location whether sent as JSON string (FormData) or object
        let location = req.body.location;
        if (typeof location === "string") {
            try {
                location = JSON.parse(location);
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format."
                });
            }
        }

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

        const imageUrls = (req.files || []).map(
            (file) => `/uploads/reports/${file.filename}`
        );

        const report = await Report.create({
            title: title.trim(),
            category,
            description: description.trim(),
            location: {
                address: location.address.trim(),
                latitude: location.latitude,
                longitude: location.longitude
            },
            imageUrls,
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
// GET /api/reports/map — Get all reports with valid coordinates for the interactive map
router.get("/map", auth, async (req, res, next) => {
    try {
        const reports = await Report.find({
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null }
        })
            .select("title category description location imageUrls status createdAt")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (error) {
        next(error);
    }
});
// GET /api/reports/all — Get all reports (for NGO and Government dashboards)
router.get(
    "/all",
    auth,
    auth.requireRole("ngo", "government"),
    async (req, res, next) => {
        try {
            const reports = await Report.find()
                .populate("reportedBy", "name email")
                .populate("assignedNgo", "name email")
                .populate("verifiedBy", "name email")
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                count: reports.length,
                reports
            });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/reports/:id/ngo-action — NGO verifies, accepts, or updates progress
router.patch(
    "/:id/ngo-action",
    auth,
    auth.requireRole("ngo"),
    async (req, res, next) => {
        try {
            const { action, status, note } = req.body;
            const report = await Report.findById(req.params.id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found."
                });
            }

            const actorLabel = req.user.email;

            if (action === "verify") {
                report.isVerified = true;
                report.verifiedBy = req.user.id;
                if (report.status === "Submitted") {
                    report.status = "Under Review";
                }
                report.statusNotes.push({
                    status: report.status,
                    note: note?.trim() || "Verified by NGO partner.",
                    updatedByRole: "ngo",
                    updatedByName: actorLabel
                });
            } else if (action === "accept") {
                report.isVerified = true;
                if (!report.verifiedBy) {
                    report.verifiedBy = req.user.id;
                }
                report.assignedNgo = req.user.id;
                report.status = "In Progress";
                report.statusNotes.push({
                    status: "In Progress",
                    note: note?.trim() || "Accepted by NGO for on-ground action.",
                    updatedByRole: "ngo",
                    updatedByName: actorLabel
                });
            } else if (action === "update-status") {
                const allowed = ["Under Review", "In Progress", "Resolved"];
                if (!allowed.includes(status)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid status value."
                    });
                }
                report.status = status;
                report.statusNotes.push({
                    status,
                    note: note?.trim() || `Status updated to ${status} by NGO.`,
                    updatedByRole: "ngo",
                    updatedByName: actorLabel
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid NGO action."
                });
            }

            await report.save();

            const updatedReport = await Report.findById(report._id)
                .populate("reportedBy", "name email")
                .populate("assignedNgo", "name email")
                .populate("verifiedBy", "name email");

            return res.json({
                success: true,
                message: "Report updated successfully.",
                report: updatedReport
            });
        } catch (error) {
            next(error);
        }
    }
);
// PATCH /api/reports/:id/gov-action — Government assigns department & updates official status
router.patch(
    "/:id/gov-action",
    auth,
    auth.requireRole("government"),
    async (req, res, next) => {
        try {
            const { assignedDepartment, status, note, isVerified } = req.body;
            const report = await Report.findById(req.params.id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found."
                });
            }

            if (typeof assignedDepartment === "string" && assignedDepartment.trim()) {
                report.assignedDepartment = assignedDepartment.trim();
            }

            if (typeof isVerified === "boolean") {
                report.isVerified = isVerified;
                if (isVerified && !report.verifiedBy) {
                    report.verifiedBy = req.user.id;
                }
            }

            const allowedStatuses = ["Submitted", "Under Review", "In Progress", "Resolved"];
            if (status && allowedStatuses.includes(status)) {
                report.status = status;
            }

            const logMessage =
                note?.trim() ||
                (assignedDepartment?.trim()
                    ? `Assigned to ${assignedDepartment.trim()} (${report.status}).`
                    : `Official status updated to ${report.status}.`);

            report.statusNotes.push({
                status: report.status,
                note: logMessage,
                updatedByRole: "government",
                updatedByName: req.user.email
            });

            await report.save();

            const updatedReport = await Report.findById(report._id)
                .populate("reportedBy", "name email")
                .populate("assignedNgo", "name email")
                .populate("verifiedBy", "name email");

            return res.json({
                success: true,
                message: "Official directive recorded successfully.",
                report: updatedReport
            });
        } catch (error) {
            next(error);
        }
    }
);
// GET /api/reports/impact — Live community-wide impact metrics
router.get("/impact", auth, async (req, res, next) => {
  try {
    const [totalReports, resolvedReports, verifiedReports, inProgressReports, categoryAgg] =
      await Promise.all([
        Report.countDocuments(),
        Report.countDocuments({ status: "Resolved" }),
        Report.countDocuments({ isVerified: true }),
        Report.countDocuments({ status: "In Progress" }),
        Report.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

    return res.json({
      success: true,
      impact: {
        totalReports,
        resolvedReports,
        verifiedReports,
        inProgressReports,
        categories: categoryAgg.map((c) => ({
          category: c._id,
          count: c.count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;