
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Report title is required"],
            trim: true,
            maxlength: 120
        },

        category: {
            type: String,
            required: [true, "Please select a category"],
            enum: [
                "Waste Management",
                "Water Pollution",
                "Air Pollution",
                "Deforestation",
                "Damaged Green Spaces",
                "Other"
            ]
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: 2000
        },

        location: {
            address: {
                type: String,
                required: [true, "Location is required"],
                trim: true
            },

            latitude: {
                type: Number,
                min: -90,
                max: 90
            },

            longitude: {
                type: Number,
                min: -180,
                max: 180
            }
        },

        imageUrls: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["Submitted", "Under Review", "In Progress", "Resolved"],
            default: "Submitted"
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        assignedNgo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        assignedDepartment: {
            type: String,
            trim: true,
            default: ""
        },

        statusNotes: [
            {
                status: String,
                note: String,
                updatedByRole: String,
                updatedByName: String,
                updatedAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);

