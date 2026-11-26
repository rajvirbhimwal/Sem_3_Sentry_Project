import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, ExternalLink } from "lucide-react";

// Fix default Leaflet marker icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

// Custom colored pins by report status
function createStatusIcon(status = "Submitted") {
    const colors = {
        Submitted: "#f59e0b",
        "Under Review": "#38bdf8",
        "In Progress": "#a855f7",
        Resolved: "#22c55e"
    };
    const fill = colors[status] || "#22c55e";

    return L.divIcon({
        className: "eco-custom-pin",
        html: `<div style="
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            background: ${fill};
            transform: rotate(-45deg);
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: grid;
            place-items: center;
        "><div style="
            width: 8px;
            height: 8px;
            background: #071a12;
            border-radius: 50%;
            transform: rotate(45deg);
        "></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });
}

// Helper to recenter map when user location or reports change
function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
}

// Optional click-to-pick coordinates handler (for report submission)
function LocationPicker({ onPickLocation }) {
    useMapEvents({
        click(e) {
            if (onPickLocation) {
                onPickLocation(e.latlng.lat, e.latlng.lng);
            }
        }
    });
    return null;
}

export default function EcoMap({
    reports = [],
    userCoords = null,
    onSelectReport,
    pickerMode = false,
    pickedCoords = null,
    onPickLocation
}) {
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Default center: Gurugram / Sohna region if userCoords not set
    const defaultCenter = userCoords || [28.2487, 77.0635];

    const validReports = reports.filter((r) => {
        const lat = Number(r.location?.latitude);
        const lng = Number(r.location?.longitude);
        const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
        const matchesCat = categoryFilter === "All" || r.category === categoryFilter;
        const matchesStatus = statusFilter === "All" || (r.status || "Submitted") === statusFilter;
        return hasCoords && matchesCat && matchesStatus;
    });

    const activeCenter =
        pickedCoords
            ? [pickedCoords.lat, pickedCoords.lng]
            : userCoords
            ? userCoords
            : validReports.length > 0
            ? [Number(validReports[0].location.latitude), Number(validReports[0].location.longitude)]
            : defaultCenter;

    if (pickerMode) {
        return (
            <div className="eco-map-picker-wrapper">
                <MapContainer
                    center={activeCenter}
                    zoom={13}
                    style={{ height: "230px", width: "100%", borderRadius: "14px" }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapRecenter center={activeCenter} />
                    <LocationPicker onPickLocation={onPickLocation} />
                    {pickedCoords && (
                        <Marker
                            position={[pickedCoords.lat, pickedCoords.lng]}
                            icon={createStatusIcon("Submitted")}
                        />
                    )}
                </MapContainer>
                <small className="eco-map-picker-hint">
                    Click anywhere on the map to pin the exact issue coordinates.
                </small>
            </div>
        );
    }

    return (
        <div className="eco-map-container-shell">
            <div className="eco-map-controls">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter map by category"
                >
                    <option value="All">All Categories</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Water Pollution">Water Pollution</option>
                    <option value="Air Pollution">Air Pollution</option>
                    <option value="Deforestation">Deforestation</option>
                    <option value="Damaged Green Spaces">Damaged Green Spaces</option>
                    <option value="Other">Other</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter map by status"
                >
                    <option value="All">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>

                <div className="eco-map-legend">
                    <span><i style={{ background: "#f59e0b" }} /> Submitted</span>
                    <span><i style={{ background: "#38bdf8" }} /> Under Review</span>
                    <span><i style={{ background: "#a855f7" }} /> In Progress</span>
                    <span><i style={{ background: "#22c55e" }} /> Resolved</span>
                </div>
            </div>

            <div className="eco-map-frame">
                <MapContainer
                    center={activeCenter}
                    zoom={12}
                    style={{ height: "470px", width: "100%", borderRadius: "18px" }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapRecenter center={activeCenter} />

                    {validReports.map((report) => (
                        <Marker
                            key={report._id}
                            position={[
                                Number(report.location.latitude),
                                Number(report.location.longitude)
                            ]}
                            icon={createStatusIcon(report.status)}
                        >
                            <Popup className="eco-map-popup">
                                <div className="eco-popup-card">
                                    <span className="eco-popup-badge">{report.status || "Submitted"}</span>
                                    <h4>{report.title}</h4>
                                    <p className="eco-popup-cat">{report.category}</p>
                                    <p className="eco-popup-addr">
                                        <MapPin size={13} /> {report.location?.address}
                                    </p>
                                    {report.imageUrls?.[0] && (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${report.imageUrls[0]}`}
                                            alt={report.title}
                                            className="eco-popup-thumb"
                                        />
                                    )}
                                    {onSelectReport && (
                                        <button
                                            type="button"
                                            className="eco-popup-btn"
                                            onClick={() => onSelectReport(report)}
                                        >
                                            View full report <ExternalLink size={13} />
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <p className="eco-report-results">
                Showing {validReports.length} geo-tagged environmental report{validReports.length === 1 ? "" : "s"} on the map.
            </p>
        </div>
    );
}