import React, { useEffect, useState } from "react";
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    BadgeCheck,
    Bell,
    CheckCircle2,
    ChevronRight,
    CircleUserRound,
    Clock3,
    Compass,
    FileText,
    ImagePlus,
    Leaf,
    LocateFixed,
    LogOut,
    MapPin,
    Menu,
    Plus,
    Recycle,
    Search,
    ShieldCheck,
    Sparkles,
    Trees,
    Waves,
    X
} from "lucide-react";

import "./Dashboard.css";
import EcoMap from "./Component/EcoMap";

const navigation = [
    { label: "Overview", icon: Activity },
    { label: "My reports", icon: FileText },
    { label: "Explore map", icon: Compass },
    { label: "Community impact", icon: Trees },
    { label: "My profile", icon: CircleUserRound }
];

export default function Dashboard({ user, onLogout, onBackHome, onUpdateUser }) {
    const [activePage, setActivePage] = useState("Overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [locationPrompt, setLocationPrompt] = useState(false);
    const [locationState, setLocationState] = useState("unknown");
    const [currentLocation, setCurrentLocation] = useState("");
    const [locationError, setLocationError] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Live reports & impact connected to the backend
    const [reports, setReports] = useState([]);
    const [mapReports, setMapReports] = useState([]);
    const [communityImpact, setCommunityImpact] = useState(null);
    const [reportSearch, setReportSearch] = useState("");
    const [reportCategoryFilter, setReportCategoryFilter] = useState("All");
    const [reportStatusFilter, setReportStatusFilter] = useState("All");
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [selectedReport, setSelectedReport] = useState(null);
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportForm, setReportForm] = useState({
        title: "",
        category: "Waste Management",
        description: "",
        address: "",
        latitude: "",
        longitude: ""
    });

    // Phase 1: Image upload states
    const [reportImages, setReportImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Phase 5: Profile edit states
    const [profileName, setProfileName] = useState(user?.name || "");
    const [profileBusy, setProfileBusy] = useState(false);

    useEffect(() => {
        setProfileName(user?.name || "");
    }, [user]);

    useEffect(() => {
        const alreadyAsked = sessionStorage.getItem("ecoconnect_location_prompted");

        if (!alreadyAsked) {
            setLocationPrompt(true);
        }

        if ("permissions" in navigator) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((permission) => {
                    if (permission.state === "granted") {
                        setLocationState("granted");
                    } else if (permission.state === "denied") {
                        setLocationState("denied");
                    }
                })
                .catch(() => {});
        }
    }, []);

    function requestLocation() {
        if (!navigator.geolocation) {
            setLocationError("Location is not supported by this browser.");
            setLocationState("unavailable");
            return;
        }

        setLocationError("");
        setLocationState("loading");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                setCurrentLocation(
                    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                );

                setLocationState("granted");
                setLocationPrompt(false);

                sessionStorage.setItem("ecoconnect_location_prompted", "true");
            },
            (error) => {
                setLocationState(
                    error.code === error.PERMISSION_DENIED ? "denied" : "error"
                );

                setLocationError(
                    error.code === error.PERMISSION_DENIED
                        ? "Location access was declined. You can continue and enter a location manually."
                        : "We couldn't determine your location. Please try again or enter it manually."
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 60000
            }
        );
    }

    function dismissLocationPrompt() {
        setLocationPrompt(false);
        sessionStorage.setItem("ecoconnect_location_prompted", "true");
    }

    function choosePage(label) {
        setActivePage(label);
        setSidebarOpen(false);
        setReportError("");
        setReportSuccess("");
    }

    function handleImageChange(event) {
        const files = Array.from(event.target.files || []);
        if (files.length + reportImages.length > 4) {
            setReportError("You can upload up to 4 images per report.");
            return;
        }
        setReportError("");
        const updatedFiles = [...reportImages, ...files].slice(0, 4);
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setReportImages(updatedFiles);
        setImagePreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
        event.target.value = "";
    }

    function removeSelectedImage(index) {
        URL.revokeObjectURL(imagePreviews[index]);
        setReportImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }

    async function fetchMyReports() {
        const token = localStorage.getItem("ecoconnect_token");

        if (!token) {
            setReportError("Please log in again to view your reports.");
            return;
        }

        setReportsLoading(true);
        setReportError("");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load reports.");
            }

            setReports(data.reports || []);
        } catch (error) {
            setReportError(error.message || "Unable to load reports.");
        } finally {
            setReportsLoading(false);
        }
    }

    async function fetchMapReports() {
        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/map`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMapReports(data.reports || []);
            }
        } catch {}
    }

    async function fetchCommunityImpact() {
        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/impact`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setCommunityImpact(data.impact || null);
            }
        } catch {}
    }

    async function submitReport(event) {
        event.preventDefault();
        setReportError("");
        setReportSuccess("");

        const token = localStorage.getItem("ecoconnect_token");
        if (!token) {
            setReportError("Please log in again before submitting a report.");
            return;
        }

        setSubmittingReport(true);

        const formData = new FormData();
        formData.append("title", reportForm.title.trim());
        formData.append("category", reportForm.category);
        formData.append("description", reportForm.description.trim());
        formData.append(
            "location",
            JSON.stringify({
                address: reportForm.address.trim(),
                ...(reportForm.latitude !== "" && reportForm.longitude !== ""
                    ? {
                          latitude: Number(reportForm.latitude),
                          longitude: Number(reportForm.longitude)
                      }
                    : {})
            })
        );

        reportImages.forEach((file) => {
            formData.append("images", file);
        });

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to submit your report.");
            }

            setReportSuccess("Your environmental report was submitted successfully.");
            setReportForm({
                title: "",
                category: "Waste Management",
                description: "",
                address: "",
                latitude: "",
                longitude: ""
            });
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
            setReportImages([]);
            setImagePreviews([]);
            await fetchMyReports();
            await fetchMapReports();
        } catch (error) {
            setReportError(error.message || "Unable to submit your report.");
        } finally {
            setSubmittingReport(false);
        }
    }

    async function saveProfile(event) {
        event.preventDefault();
        setReportError("");
        setReportSuccess("");

        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        setProfileBusy(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: profileName })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }
            if (onUpdateUser && data.user) {
                onUpdateUser(data.user);
            }
            setReportSuccess("Profile updated successfully.");
        } catch (error) {
            setReportError(error.message || "Unable to update profile.");
        } finally {
            setProfileBusy(false);
        }
    }

    useEffect(() => {
        fetchMyReports();
    }, []);

    useEffect(() => {
        if (activePage === "My reports" || activePage === "Overview") {
            fetchMyReports();
        } else if (activePage === "Explore map") {
            fetchMapReports();
        } else if (activePage === "Community impact") {
            fetchCommunityImpact();
        }
    }, [activePage]);

    const displayName =
        user?.name?.trim() ||
        user?.email ||
        user?.identifier ||
        "EcoConnect member";

    const initials = displayName
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    // Live Overview metrics
    const submittedCount = reports.filter((r) => (r.status || "Submitted") === "Submitted").length;
    const activeCount = reports.filter((r) => ["Under Review", "In Progress"].includes(r.status)).length;
    const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

    // Live notifications built from statusNotes on the user's reports
    const liveNotifications = reports
        .flatMap((r) =>
            (r.statusNotes || []).map((n, idx) => ({
                id: `${r._id}-${idx}`,
                report: r,
                title: r.title,
                status: n.status,
                note: n.note,
                role: n.updatedByRole,
                updatedAt: n.updatedAt
            }))
        )
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    const recentReports = reports.slice(0, 4).map((report) => ({
        raw: report,
        id: report._id,
        title: report.title,
        category: report.category,
        status: report.status || "Submitted",
        icon: FileText,
        color: "mint"
    }));

    const filteredReports = reports.filter((report) => {
        const search = reportSearch.trim().toLowerCase();
        const matchesSearch =
            (report.title || "").toLowerCase().includes(search) ||
            (report.description || "").toLowerCase().includes(search) ||
            (report.location?.address || "").toLowerCase().includes(search);
        const matchesCategory =
            reportCategoryFilter === "All" || report.category === reportCategoryFilter;
        const matchesStatus =
            reportStatusFilter === "All" || (report.status || "Submitted") === reportStatusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    function clearReportFilters() {
        setReportSearch("");
        setReportCategoryFilter("All");
        setReportStatusFilter("All");
    }

    return (
        <div className="eco-dashboard">
            <div className="dashboard-nature-background" aria-hidden="true">
                <div className="nature-glow nature-glow-one" />
                <div className="nature-glow nature-glow-two" />
                <div className="nature-glow nature-glow-three" />
            </div>

            {sidebarOpen && (
                <button
                    className="dashboard-mobile-overlay"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
                <button className="dashboard-brand" onClick={onBackHome}>
                    <span className="dashboard-brand-icon">
                        <Leaf size={22} />
                    </span>

                    <span>
                        <strong>
                            eco<span>connect</span>
                        </strong>
                        <small>SMALL ACTION. BIG CHANGE.</small>
                    </span>
                </button>

                <div className="sidebar-label">YOUR WORKSPACE</div>

                <nav className="dashboard-nav" aria-label="Dashboard navigation">
                    {navigation.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className={`dashboard-nav-item ${activePage === label ? "active" : ""}`}
                            onClick={() => choosePage(label)}
                        >
                            <Icon size={18} />
                            <span>{label}</span>

                            {label === "My reports" && (
                                <span className="nav-count">{reports.length.toString().padStart(2, "0")}</span>
                            )}

                            {activePage === label && (
                                <span className="nav-active-indicator" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-nature-card">
                    <div className="sidebar-nature-icon">
                        <SproutIcon />
                    </div>

                    <span className="sidebar-small-label">A SMALL REMINDER</span>

                    <h3>Change grows from small actions.</h3>

                    <p>
                        Every environmental concern reported is a step toward a healthier
                        community.
                    </p>

                    <span className="nature-decoration">
                        <Leaf size={60} />
                    </span>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-security">
                        <ShieldCheck size={17} />
                        <span>
                            <strong>Community first</strong>
                            <small>Built for collective action</small>
                        </span>
                    </div>

                    <button className="sidebar-logout" onClick={onLogout}>
                        <LogOut size={17} />
                        Log out
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="dashboard-topbar-left">
                        <button
                            className="dashboard-icon-button dashboard-menu-toggle"
                            aria-label="Open navigation"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={21} />
                        </button>

                        <div>
                            <div className="dashboard-breadcrumb">
                                EcoConnect <ChevronRight size={13} /> {activePage}
                            </div>

                            <p className="dashboard-topbar-caption">
                                A little care can change a whole community.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-topbar-actions">
                        <button
                            className={`location-chip ${locationState === "granted" ? "location-active" : ""}`}
                            onClick={() => setLocationPrompt(true)}
                            title="Manage location access"
                        >
                            <MapPin size={15} />

                            <span>
                                {locationState === "granted"
                                    ? "Location enabled"
                                    : "Set your location"}
                            </span>
                        </button>

                        <div className="notification-wrapper">
                            <button
                                className="dashboard-icon-button notification-button"
                                aria-label="Notifications"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={19} />
                                {liveNotifications.length > 0 && <span className="notification-dot" />}
                            </button>

                            {showNotifications && (
                                <div className="notification-popover" style={{ width: 310, maxHeight: 340, overflowY: "auto" }}>
                                    <strong>Activity Updates ({liveNotifications.length})</strong>
                                    {liveNotifications.length === 0 ? (
                                        <p>
                                            No updates yet. When an NGO or government department reviews or resolves your report, it will appear here.
                                        </p>
                                    ) : (
                                        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                                            {liveNotifications.slice(0, 6).map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedReport(item.report);
                                                        setShowNotifications(false);
                                                    }}
                                                    style={{
                                                        padding: "8px 10px",
                                                        borderRadius: 10,
                                                        background: "rgba(218, 245, 222, 0.07)",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <strong style={{ fontSize: "0.82rem", display: "block" }}>
                                                        {item.title} · {item.status}
                                                    </strong>
                                                    <p style={{ margin: "3px 0 0", fontSize: "0.78rem" }}>{item.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="dashboard-user-chip"
                            onClick={() => choosePage("My profile")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="dashboard-user-avatar">{initials || "E"}</span>

                            <span className="dashboard-user-details">
                                <strong>{displayName}</strong>
                                <small>Community member</small>
                            </span>
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activePage === "Overview" ? (
                        <>
                            <section className="dashboard-welcome">
                                <div className="welcome-content">
                                    <span className="welcome-eyebrow">
                                        <Sparkles size={14} /> YOUR COMMUNITY, YOUR IMPACT
                                    </span>

                                    <h1>
                                        Growing a greener
                                        <br />
                                        tomorrow<span>.</span>
                                    </h1>

                                    <p>
                                        Welcome back, {displayName.split("@")[0]}. Your next small
                                        action could make a big difference.
                                    </p>

                                    <div className="welcome-actions">
                                        <button
                                            className="dashboard-primary-button"
                                            onClick={() => choosePage("Report an issue")}
                                        >
                                            <Plus size={18} /> Report an issue
                                            <ArrowRight size={16} />
                                        </button>

                                        <button
                                            className="dashboard-secondary-button"
                                            onClick={() => choosePage("My reports")}
                                        >
                                            View my reports <ArrowDownRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="welcome-art" aria-hidden="true">
                                    <div className="welcome-art-sun" />
                                    <div className="welcome-art-hill hill-one" />
                                    <div className="welcome-art-hill hill-two" />
                                    <div className="welcome-art-hill hill-three" />

                                    <div className="welcome-art-tree tree-left">
                                        <span />
                                    </div>

                                    <div className="welcome-art-tree tree-right">
                                        <span />
                                    </div>

                                    <div className="welcome-art-leaf leaf-left">
                                        <Leaf size={25} />
                                    </div>

                                    <div className="welcome-art-leaf leaf-right">
                                        <Leaf size={19} />
                                    </div>

                                    <div className="welcome-art-note">
                                        <span>
                                            <Leaf size={16} />
                                        </span>
                                        <div>
                                            <strong>Small actions</strong>
                                            <small>Lasting impact</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="welcome-decoration">
                                    <Leaf size={115} />
                                </div>
                            </section>

                            <section className="dashboard-section">
                                <div className="dashboard-section-heading">
                                    <div>
                                        <span className="dashboard-overline">YOUR CONTRIBUTION</span>
                                        <h2>Your impact at a glance</h2>
                                    </div>

                                    <span className="demo-data-label">Live account data</span>
                                </div>

                                <div className="dashboard-stats-grid">
                                    <StatCard
                                        icon={FileText}
                                        label="Reports submitted"
                                        value={reports.length.toString().padStart(2, "0")}
                                        note="Total issues logged"
                                        tone="green"
                                    />

                                    <StatCard
                                        icon={Clock3}
                                        label="Awaiting review"
                                        value={submittedCount.toString().padStart(2, "0")}
                                        note="Pending verification"
                                        tone="amber"
                                    />

                                    <StatCard
                                        icon={Activity}
                                        label="Under review / active"
                                        value={activeCount.toString().padStart(2, "0")}
                                        note="Being addressed"
                                        tone="blue"
                                    />

                                    <StatCard
                                        icon={CheckCircle2}
                                        label="Issues resolved"
                                        value={resolvedCount.toString().padStart(2, "0")}
                                        note="Completed cleanups"
                                        tone="lime"
                                    />
                                </div>
                            </section>

                            <div className="dashboard-lower-grid">
                                <section className="dashboard-glass-panel recent-reports-panel">
                                    <div className="dashboard-panel-heading">
                                        <div>
                                            <span className="dashboard-overline">KEEP TRACK</span>
                                            <h2>Recent reports</h2>
                                        </div>

                                        <button
                                            className="dashboard-text-link"
                                            onClick={() => choosePage("My reports")}
                                        >
                                            View all <ArrowRight size={15} />
                                        </button>
                                    </div>

                                    {recentReports.length === 0 ? (
                                        <p className="dashboard-demo-note">
                                            You haven't submitted any reports yet. Click "Report an issue" above to log your first environmental concern!
                                        </p>
                                    ) : (
                                        <div className="dashboard-report-list">
                                            {recentReports.map((report) => {
                                                const Icon = report.icon;

                                                return (
                                                    <article
                                                        className="dashboard-report-row"
                                                        key={report.id}
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => setSelectedReport(report.raw)}
                                                    >
                                                        <span className={`report-category-icon ${report.color}`}>
                                                            <Icon size={20} />
                                                        </span>

                                                        <div className="dashboard-report-info">
                                                            <strong>{report.title}</strong>
                                                            <span>
                                                                {report.category} <i />{" "}
                                                                {report.raw.createdAt
                                                                    ? new Date(report.raw.createdAt).toLocaleDateString()
                                                                    : ""}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`dashboard-status status-${report.status
                                                                .toLowerCase()
                                                                .replace(/\s+/g, "-")}`}
                                                        >
                                                            {report.status}
                                                        </span>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="dashboard-glass-panel location-panel">
                                    <div className="dashboard-panel-heading">
                                        <div>
                                            <span className="dashboard-overline">YOUR SURROUNDINGS</span>
                                            <h2>Explore your area</h2>
                                        </div>

                                        <button
                                            type="button"
                                            className="dashboard-text-link"
                                            onClick={() => choosePage("Explore map")}
                                        >
                                            Open map <ArrowRight size={15} />
                                        </button>
                                    </div>

                                    <div
                                        className="dashboard-map-illustration"
                                        role="button"
                                        tabIndex={0}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => choosePage("Explore map")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                choosePage("Explore map");
                                            }
                                        }}
                                    >
                                        <div className="map-shape map-shape-one" />
                                        <div className="map-shape map-shape-two" />
                                        <div className="map-shape map-shape-three" />
                                        <div className="map-waterway" />
                                        <div className="map-path map-path-one" />
                                        <div className="map-path map-path-two" />

                                        <span className="map-location-pin pin-one">
                                            <Recycle size={16} />
                                        </span>

                                        <span className="map-location-pin pin-two">
                                            <Waves size={16} />
                                        </span>

                                        <span className="map-location-pin pin-three">
                                            <Trees size={16} />
                                        </span>

                                        <span className="map-center-pin">
                                            <MapPin size={19} />
                                        </span>
                                    </div>

                                    <div className="location-panel-footer">
                                        <span className="location-status-indicator" />

                                        <div>
                                            <strong>
                                                {locationState === "granted"
                                                    ? "Location permission granted"
                                                    : "Make your area part of the change"}
                                            </strong>

                                            <small>
                                                {currentLocation ||
                                                    "Enable location or open the interactive map."}
                                            </small>
                                        </div>

                                        <button
                                            className="dashboard-round-arrow"
                                            onClick={() => choosePage("Explore map")}
                                            aria-label="Open interactive map"
                                        >
                                            <ArrowRight size={17} />
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <section className="dashboard-bottom-banner">
                                <div className="bottom-banner-icon">
                                    <Leaf size={25} />
                                </div>

                                <div>
                                    <strong>Every greener neighbourhood begins with someone.</strong>
                                    <p>Be that someone. Report an issue and help your community.</p>
                                </div>

                                <button
                                    onClick={() => choosePage("Report an issue")}
                                    className="bottom-banner-button"
                                >
                                    Take action <ArrowRight size={16} />
                                </button>
                            </section>
                        </>
                    ) : activePage === "Report an issue" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon"><Plus size={28} /></span>
                            <span className="dashboard-overline">HELP YOUR COMMUNITY</span>
                            <h1>Report an environmental issue</h1>
                            <p>Tell us about an environmental concern in your neighbourhood.</p>

                            {reportError && <p role="alert" className="report-message report-error">{reportError}</p>}
                            {reportSuccess && <p role="status" className="report-message report-success">{reportSuccess}</p>}

                            <form className="eco-report-form" onSubmit={submitReport}>
                                <div className="eco-form-field">
                                    <label htmlFor="report-title">Report title</label>
                                    <input id="report-title" type="text" maxLength={120} placeholder="e.g. Garbage dumped near a lake" value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} required />
                                </div>

                                <div className="eco-form-field">
                                    <label htmlFor="report-category">Issue category</label>
                                    <select id="report-category" value={reportForm.category} onChange={(event) => setReportForm({ ...reportForm, category: event.target.value })} required>
                                        <option value="Waste Management">Waste Management</option>
                                        <option value="Water Pollution">Water Pollution</option>
                                        <option value="Air Pollution">Air Pollution</option>
                                        <option value="Deforestation">Deforestation</option>
                                        <option value="Damaged Green Spaces">Damaged Green Spaces</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="eco-form-field eco-form-field-full">
                                    <label htmlFor="report-description">Description</label>
                                    <textarea id="report-description" rows={5} maxLength={2000} placeholder="Describe the environmental issue..." value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} required />
                                </div>

                                <div className="eco-form-field eco-form-field-full">
                                    <label htmlFor="report-address">Location or address</label>
                                    <input id="report-address" type="text" placeholder="Enter the issue's location" value={reportForm.address} onChange={(event) => setReportForm({ ...reportForm, address: event.target.value })} required />
                                </div>

                                <div className="eco-report-coordinate-grid eco-form-field-full">
                                    <div className="eco-form-field">
                                        <label htmlFor="report-latitude">Latitude <span>(optional)</span></label>
                                        <input id="report-latitude" type="number" step="any" min="-90" max="90" value={reportForm.latitude} onChange={(event) => setReportForm({ ...reportForm, latitude: event.target.value })} />
                                    </div>
                                    <div className="eco-form-field">
                                        <label htmlFor="report-longitude">Longitude <span>(optional)</span></label>
                                        <input id="report-longitude" type="number" step="any" min="-180" max="180" value={reportForm.longitude} onChange={(event) => setReportForm({ ...reportForm, longitude: event.target.value })} />
                                    </div>
                                </div>

                                <div className="eco-form-field eco-form-field-full">
                                    <label>Pin exact location on map <span>(optional — click map to auto-fill coordinates)</span></label>
                                    <EcoMap
                                        pickerMode={true}
                                        pickedCoords={
                                            reportForm.latitude !== "" && reportForm.longitude !== ""
                                                ? { lat: Number(reportForm.latitude), lng: Number(reportForm.longitude) }
                                                : null
                                        }
                                        onPickLocation={(lat, lng) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                latitude: lat.toFixed(6),
                                                longitude: lng.toFixed(6)
                                            }))
                                        }
                                    />
                                </div>

                                <div className="eco-form-field eco-form-field-full">
                                    <label htmlFor="report-images">
                                        Evidence photos <span>(optional, up to 4 images, max 5MB each)</span>
                                    </label>
                                    <label htmlFor="report-images" className="eco-image-upload-box">
                                        <ImagePlus size={22} />
                                        <span>Click to upload photos (JPG, PNG, WEBP)</span>
                                        <small>{reportImages.length}/4 images selected</small>
                                    </label>
                                    <input
                                        id="report-images"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={handleImageChange}
                                        hidden
                                    />
                                    {imagePreviews.length > 0 && (
                                        <div className="eco-image-preview-grid">
                                            {imagePreviews.map((src, index) => (
                                                <div key={src} className="eco-image-preview-item">
                                                    <img src={src} alt={`Selected preview ${index + 1}`} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedImage(index)}
                                                        aria-label="Remove image"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="eco-report-form-actions eco-form-field-full">
                                    <button type="button" className="dashboard-secondary-button" onClick={() => {
                                        if (!navigator.geolocation) {
                                            setReportError("Location is not supported by this browser. Enter it manually.");
                                            return;
                                        }
                                        navigator.geolocation.getCurrentPosition(
                                            (position) => setReportForm((previous) => ({
                                                ...previous,
                                                latitude: String(position.coords.latitude),
                                                longitude: String(position.coords.longitude)
                                            })),
                                            () => setReportError("Unable to retrieve your location. Enter it manually.")
                                        );
                                    }}>
                                        <MapPin size={16} /> Use my current coordinates
                                    </button>

                                    <button type="submit" className="dashboard-primary-button" disabled={submittingReport}>
                                        <Plus size={18} /> {submittingReport ? "Submitting..." : "Submit report"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    ) : activePage === "My reports" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon"><FileText size={28} /></span>
                            <span className="dashboard-overline">YOUR CONTRIBUTION</span>
                            <h1>My reports</h1>
                            <p>Track the environmental issues you have reported.</p>

                            {reportError && <p role="alert" className="report-message report-error">{reportError}</p>}

                            {reportsLoading ? (
                                <p>Loading your reports...</p>
                            ) : reports.length === 0 ? (
                                <p>You haven't submitted any reports yet.</p>
                            ) : (
                                <>
                                    <div className="eco-report-toolbar">
                                        <label className="eco-report-search">
                                            <Search size={18} aria-hidden="true" />
                                            <input
                                                type="search"
                                                placeholder="Search by title, description or location..."
                                                value={reportSearch}
                                                onChange={(event) => setReportSearch(event.target.value)}
                                                aria-label="Search your reports"
                                            />
                                        </label>
                                        <select
                                            value={reportCategoryFilter}
                                            onChange={(event) => setReportCategoryFilter(event.target.value)}
                                            aria-label="Filter reports by category"
                                        >
                                            <option value="All">All categories</option>
                                            <option value="Waste Management">Waste Management</option>
                                            <option value="Water Pollution">Water Pollution</option>
                                            <option value="Air Pollution">Air Pollution</option>
                                            <option value="Deforestation">Deforestation</option>
                                            <option value="Damaged Green Spaces">Damaged Green Spaces</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <select
                                            value={reportStatusFilter}
                                            onChange={(event) => setReportStatusFilter(event.target.value)}
                                            aria-label="Filter reports by status"
                                        >
                                            <option value="All">All statuses</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                        <button type="button" className="eco-report-clear" onClick={clearReportFilters}>
                                            Clear filters
                                        </button>
                                    </div>
                                    <p className="eco-report-results">Showing {filteredReports.length} of {reports.length} reports</p>
                                    {filteredReports.length === 0 ? (
                                        <div className="eco-report-no-results">
                                            <Search size={22} />
                                            <strong>No matching reports</strong>
                                            <span>Try changing your search or filters.</span>
                                        </div>
                                    ) : (
                                        <div className="eco-my-reports-list">
                                            {filteredReports.map((report) => (
                                                <article
                                                    key={report._id}
                                                    className="eco-my-report"
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`View details for ${report.title}`}
                                                    onClick={() => setSelectedReport(report)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter" || event.key === " ") {
                                                            event.preventDefault();
                                                            setSelectedReport(report);
                                                        }
                                                    }}
                                                >
                                                    <h3>{report.title}</h3>
                                                    <p>{report.description}</p>
                                                    <p><MapPin size={15} /> {report.location?.address || "Location not provided"}</p>
                                                    <p>Category: {report.category}</p>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                                        <span className={`dashboard-status status-${(report.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>{report.status || "Submitted"}</span>
                                                        {report.isVerified && <span className="dashboard-status status-resolved">✓ Verified</span>}
                                                    </div>
                                                    <small>Submitted: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Date unavailable"}</small>
                                                    <span className="eco-report-view-link">View report details <ArrowRight size={15} /></span>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            <button className="dashboard-primary-button" onClick={() => choosePage("Report an issue")}>
                                <Plus size={18} /> Submit another report
                            </button>
                        </section>
                    ) : activePage === "Explore map" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon"><Compass size={28} /></span>
                            <span className="dashboard-overline">LIVE ENVIRONMENTAL MAP</span>
                            <h1>Explore reported issues</h1>
                            <p>Browse geo-tagged environmental concerns across your community and inspect their status.</p>

                            <EcoMap
                                reports={mapReports}
                                userCoords={
                                    currentLocation
                                        ? currentLocation.split(",").map((n) => Number(n.trim()))
                                        : null
                                }
                                onSelectReport={(report) => setSelectedReport(report)}
                            />
                        </section>
                    ) : activePage === "Community impact" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon"><Trees size={28} /></span>
                            <span className="dashboard-overline">COLLECTIVE PROGRESS</span>
                            <h1>Community environmental impact</h1>
                            <p>Real-time impact generated by citizens, NGOs, and municipal authorities working together.</p>

                            <div className="dashboard-stats-grid" style={{ width: "100%", marginTop: 22 }}>
                                <StatCard
                                    icon={FileText}
                                    label="Community reports"
                                    value={(communityImpact?.totalReports ?? 0).toString().padStart(2, "0")}
                                    note="Logged across EcoConnect"
                                    tone="green"
                                />
                                <StatCard
                                    icon={BadgeCheck}
                                    label="Verified issues"
                                    value={(communityImpact?.verifiedReports ?? 0).toString().padStart(2, "0")}
                                    note="Validated by partners"
                                    tone="blue"
                                />
                                <StatCard
                                    icon={Activity}
                                    label="Active cleanups"
                                    value={(communityImpact?.inProgressReports ?? 0).toString().padStart(2, "0")}
                                    note="Currently in progress"
                                    tone="amber"
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Resolved issues"
                                    value={(communityImpact?.resolvedReports ?? 0).toString().padStart(2, "0")}
                                    note="Restored & closed"
                                    tone="lime"
                                />
                            </div>

                            {communityImpact?.categories?.length > 0 && (
                                <div className="eco-detail-description" style={{ width: "100%", marginTop: 22 }}>
                                    <span>Top Reported Environmental Categories</span>
                                    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                                        {communityImpact.categories.map((item) => {
                                            const pct = communityImpact.totalReports > 0
                                                ? Math.round((item.count / communityImpact.totalReports) * 100)
                                                : 0;
                                            return (
                                                <div key={item.category}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: 4 }}>
                                                        <span>{item.category}</span>
                                                        <strong>{item.count} reports ({pct}%)</strong>
                                                    </div>
                                                    <div style={{ height: 8, borderRadius: 999, background: "rgba(190,235,198,0.12)", overflow: "hidden" }}>
                                                        <div style={{ width: `${pct}%`, height: "100%", background: "#68d388", borderRadius: 999 }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon"><CircleUserRound size={28} /></span>
                            <span className="dashboard-overline">ACCOUNT SETTINGS</span>
                            <h1>My profile</h1>
                            <p>Manage your EcoConnect identity and account preferences.</p>

                            {reportError && <p role="alert" className="report-message report-error">{reportError}</p>}
                            {reportSuccess && <p role="status" className="report-message report-success">{reportSuccess}</p>}

                            <form className="eco-report-form" onSubmit={saveProfile}>
                                <div className="eco-form-field">
                                    <label htmlFor="profile-name">Display name</label>
                                    <input
                                        id="profile-name"
                                        type="text"
                                        maxLength={80}
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        placeholder="Enter your display name"
                                    />
                                </div>

                                <div className="eco-form-field">
                                    <label>Email address</label>
                                    <input type="text" value={user?.email || ""} disabled />
                                </div>

                                <div className="eco-form-field">
                                    <label>Account role</label>
                                    <input type="text" value={(user?.role || "citizen").toUpperCase()} disabled />
                                </div>

                                <div className="eco-form-field">
                                    <label>Reports submitted</label>
                                    <input type="text" value={`${reports.length} environmental reports`} disabled />
                                </div>

                                <div className="eco-report-form-actions eco-form-field-full">
                                    <button type="submit" className="dashboard-primary-button" disabled={profileBusy}>
                                        {profileBusy ? "Saving..." : "Save profile"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    <footer className="dashboard-footer">
                        <span>
                            <Leaf size={14} /> EcoConnect · Small action. Big change.
                        </span>

                        <span>Growing a greener tomorrow, together.</span>
                    </footer>
                </div>
            </main>

            {selectedReport && (
                <div className="eco-detail-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSelectedReport(null);
                }}>
                    <section className="eco-detail-modal" role="dialog" aria-modal="true" aria-labelledby="eco-detail-title">
                        <button className="eco-detail-close" onClick={() => setSelectedReport(null)} aria-label="Close report details">
                            <X size={20} />
                        </button>
                        <span className="dashboard-overline">REPORT DETAILS</span>
                        <h2 id="eco-detail-title">{selectedReport.title}</h2>
                        <div className="eco-detail-status-row">
                            <span className={`dashboard-status status-${(selectedReport.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>
                                {selectedReport.status || "Submitted"}
                            </span>
                            {selectedReport.isVerified && (
                                <span className="dashboard-status status-resolved">✓ Verified</span>
                            )}
                            {selectedReport.assignedDepartment && (
                                <small>Dept: {selectedReport.assignedDepartment}</small>
                            )}
                        </div>
                        <div className="eco-detail-grid">
                            <div><span>Category</span><strong>{selectedReport.category || "Not specified"}</strong></div>
                            <div><span>Submitted</span><strong>{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : "Date unavailable"}</strong></div>
                            <div className="eco-detail-location"><span>Location</span><strong><MapPin size={16} /> {selectedReport.location?.address || "Location not provided"}</strong></div>
                        </div>
                        <div className="eco-detail-description">
                            <span>Description</span>
                            <p>{selectedReport.description || "No description provided."}</p>
                        </div>

                        {selectedReport.imageUrls?.length > 0 && (
                            <div className="eco-detail-images">
                                <span>Attached Photos ({selectedReport.imageUrls.length})</span>
                                <div className="eco-detail-image-grid">
                                    {selectedReport.imageUrls.map((url, idx) => (
                                        <a
                                            key={url}
                                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`}
                                                alt={`Report evidence ${idx + 1}`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReport.statusNotes?.length > 0 && (
                            <div className="eco-detail-description">
                                <span>Action & Progress Timeline</span>
                                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                                    {selectedReport.statusNotes.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: "10px 12px",
                                                borderRadius: 10,
                                                border: "1px solid rgba(193,230,199,0.16)",
                                                background: "rgba(3,25,15,0.45)"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                                                <strong>{entry.status} · {(entry.updatedByRole || "partner").toUpperCase()}</strong>
                                                <small>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : ""}</small>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.88rem" }}>{entry.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="dashboard-primary-button" onClick={() => setSelectedReport(null)}>Close details</button>
                    </section>
                </div>
            )}

            {locationPrompt && (
                <div
                    className="location-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            dismissLocationPrompt();
                        }
                    }}
                >
                    <section
                        className="location-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="location-modal-title"
                    >
                        <button
                            className="location-modal-close"
                            onClick={dismissLocationPrompt}
                            aria-label="Close location prompt"
                        >
                            <X size={19} />
                        </button>

                        <div className="location-modal-art">
                            <div className="location-modal-sun" />
                            <div className="location-modal-hill hill-a" />
                            <div className="location-modal-hill hill-b" />
                            <div className="location-modal-hill hill-c" />

                            <div className="location-modal-pin">
                                <MapPin size={28} />
                            </div>

                            <span className="location-modal-leaf leaf-a">
                                <Leaf size={25} />
                            </span>

                            <span className="location-modal-leaf leaf-b">
                                <Leaf size={20} />
                            </span>
                        </div>

                        <div className="location-modal-content">
                            <span className="dashboard-overline">YOUR AREA, YOUR IMPACT</span>

                            <h2 id="location-modal-title">
                                Help us keep your
                                <br />
                                neighbourhood green.
                            </h2>

                            <p>
                                Allow EcoConnect to access your location to help you identify
                                nearby environmental concerns and add locations to your
                                reports.
                            </p>

                            <div className="location-privacy-note">
                                <ShieldCheck size={18} />

                                <span>
                                    <strong>Your choice, your privacy</strong>
                                    <small>
                                        Location access is optional. Your coordinates won't be
                                        automatically sent to our server.
                                    </small>
                                </span>
                            </div>

                            {locationError && (
                                <p className="location-error" role="status">
                                    {locationError}
                                </p>
                            )}

                            <button
                                className="dashboard-primary-button location-enable-button"
                                onClick={requestLocation}
                                disabled={locationState === "loading"}
                            >
                                <LocateFixed size={18} />

                                {locationState === "loading"
                                    ? "Finding your location..."
                                    : locationState === "granted"
                                        ? "Refresh my location"
                                        : "Enable location"}

                                {locationState !== "loading" && <ArrowRight size={17} />}
                            </button>

                            <button
                                className="location-skip-button"
                                onClick={dismissLocationPrompt}
                            >
                                Not now — I'll enter my location manually
                            </button>

                            <small className="location-browser-note">
                                Your browser may ask you to allow location access. You can
                                choose to allow it while using the website or manage it in
                                your browser settings.
                            </small>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, note, tone }) {
    return (
        <article className="dashboard-stat-card">
            <div className={`stat-icon stat-${tone}`}>
                <Icon size={20} />
            </div>

            <span className="stat-label">{label}</span>

            <strong className="stat-value">{value}</strong>

            <span className="stat-note">{note}</span>
        </article>
    );
}

function SproutIcon() {
    return <Leaf size={23} />;
}