import React, { useEffect, useState } from "react";
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    Bell,
    CheckCircle2,
    ChevronRight,
    CircleUserRound,
    Clock3,
    Compass,
    FileText,
    Leaf,
    LocateFixed,
    LogOut,
    MapPin,
    Menu,
    Plus,
    Recycle,
    ShieldCheck,
    Sparkles,
    Trees,
    Waves,
    X
} from "lucide-react";

import "./Dashboard.css";

const sampleReports = [
    {
        id: "EC-1024",
        title: "Plastic waste near a lake",
        category: "Waste & litter",
        location: "Location not yet verified",
        status: "In progress",
        icon: Recycle,
        color: "mint"
    },
    {
        id: "EC-1023",
        title: "Drainage flowing into a pond",
        category: "Water pollution",
        location: "Location not yet verified",
        status: "Under review",
        icon: Waves,
        color: "blue"
    },
    {
        id: "EC-1022",
        title: "Community garden needs attention",
        category: "Green spaces",
        location: "Location not yet verified",
        status: "Resolved",
        icon: Trees,
        color: "lime"
    }
];

const navigation = [
    { label: "Overview", icon: Activity },
    { label: "My reports", icon: FileText },
    { label: "Explore map", icon: Compass },
    { label: "Community impact", icon: Trees },
    { label: "My profile", icon: CircleUserRound }
];

export default function Dashboard({ user, onLogout, onBackHome }) {
    const [activePage, setActivePage] = useState("Overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [locationPrompt, setLocationPrompt] = useState(false);
    const [locationState, setLocationState] = useState("unknown");
    const [currentLocation, setCurrentLocation] = useState("");
    const [locationError, setLocationError] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Live reports connected to the backend
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportForm, setReportForm] = useState({
        title: "",
        category: "Waste Management",
        description: "",
        address: "",
        latitude: "",
        longitude: ""
    });

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
                .catch(() => {
                    // Some browsers do not support permission queries.
                });
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

                // Coordinates are kept in component state only.
                // They are not automatically sent to the backend.
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

    async function fetchMyReports() {
        const token = localStorage.getItem("ecoconnect_token");

        if (!token) {
            setReportError("Please log in again to view your reports.");
            return;
        }

        setReportsLoading(true);
        setReportError("");

        try {
            const response = await fetch("http://localhost:5000/api/reports/my", {
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

        const reportData = {
            title: reportForm.title.trim(),
            category: reportForm.category,
            description: reportForm.description.trim(),
            location: {
                address: reportForm.address.trim(),
                ...(reportForm.latitude !== "" && reportForm.longitude !== "" ? {
                    latitude: Number(reportForm.latitude),
                    longitude: Number(reportForm.longitude)
                } : {})
            }
        };

        try {
            const response = await fetch("http://localhost:5000/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(reportData)
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
            await fetchMyReports();
        } catch (error) {
            setReportError(error.message || "Unable to submit your report.");
        } finally {
            setSubmittingReport(false);
        }
    }

    useEffect(() => {
        if (activePage === "My reports") {
            fetchMyReports();
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
                            className={`dashboard-nav-item ${activePage === label ? "active" : ""
                                }`}
                            onClick={() => choosePage(label)}
                        >
                            <Icon size={18} />
                            <span>{label}</span>

                            {label === "My reports" && (
                                <span className="nav-count">
                                    {reports.length.toString().padStart(2, "0")}
                                </span>
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
                            className={`location-chip ${locationState === "granted" ? "location-active" : ""
                                }`}
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
                                <span className="notification-dot" />
                            </button>

                            {showNotifications && (
                                <div className="notification-popover">
                                    <strong>Notifications</strong>
                                    <p>
                                        You're all caught up. Updates about your reports will
                                        appear here when notifications are connected.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="dashboard-user-chip">
                            <span className="dashboard-user-avatar">{initials || "E"}</span>

                            <span className="dashboard-user-details">
                                <strong>{displayName}</strong>
                                <small>Community member</small>
                            </span>
                        </div>
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

                                    <span className="demo-data-label">Preview data</span>
                                </div>

                                <div className="dashboard-stats-grid">
                                    <StatCard
                                        icon={FileText}
                                        label="Reports submitted"
                                        value="03"
                                        note="Sample dashboard data"
                                        tone="green"
                                    />

                                    <StatCard
                                        icon={Clock3}
                                        label="Awaiting action"
                                        value="01"
                                        note="Sample dashboard data"
                                        tone="amber"
                                    />

                                    <StatCard
                                        icon={Activity}
                                        label="In progress"
                                        value="01"
                                        note="Sample dashboard data"
                                        tone="blue"
                                    />

                                    <StatCard
                                        icon={CheckCircle2}
                                        label="Issues resolved"
                                        value="01"
                                        note="Sample dashboard data"
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

                                    <div className="dashboard-report-list">
                                        {sampleReports.map((report) => {
                                            const Icon = report.icon;

                                            return (
                                                <article
                                                    className="dashboard-report-row"
                                                    key={report.id}
                                                >
                                                    <span
                                                        className={`report-category-icon ${report.color}`}
                                                    >
                                                        <Icon size={20} />
                                                    </span>

                                                    <div className="dashboard-report-info">
                                                        <strong>{report.title}</strong>
                                                        <span>
                                                            {report.id} <i /> {report.category}
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

                                    <p className="dashboard-demo-note">
                                        These are illustrative examples, not reports retrieved
                                        from your account.
                                    </p>
                                </section>

                                <section className="dashboard-glass-panel location-panel">
                                    <div className="dashboard-panel-heading">
                                        <div>
                                            <span className="dashboard-overline">YOUR SURROUNDINGS</span>
                                            <h2>Explore your area</h2>
                                        </div>

                                        <span className="location-panel-icon">
                                            <Compass size={20} />
                                        </span>
                                    </div>

                                    <div className="dashboard-map-illustration">
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
                                                    "Enable location or choose an area manually."}
                                            </small>
                                        </div>

                                        <button
                                            className="dashboard-round-arrow"
                                            onClick={() => setLocationPrompt(true)}
                                            aria-label="Set location"
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
                                <div className="report-form-heading">
                                    <span className="report-form-step">REPORT AN ISSUE</span>
                                    <h2>Help make your neighbourhood cleaner.</h2>
                                    <p>Share the details below so your community can take action.</p>
                                </div>

                                <div className="report-form-grid">
                                    <div className="report-field">
                                        <label htmlFor="report-title">Report title</label>
                                        <input
                                            id="report-title"
                                            type="text"
                                            maxLength={120}
                                            placeholder="e.g. Garbage dumped near a lake"
                                            value={reportForm.title}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    title: event.target.value
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="report-field">
                                        <label htmlFor="report-category">Issue category</label>
                                        <select
                                            id="report-category"
                                            value={reportForm.category}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    category: event.target.value
                                                })
                                            }
                                            required
                                        >
                                            <option value="Waste Management">Waste Management</option>
                                            <option value="Water Pollution">Water Pollution</option>
                                            <option value="Air Pollution">Air Pollution</option>
                                            <option value="Deforestation">Deforestation</option>
                                            <option value="Damaged Green Spaces">
                                                Damaged Green Spaces
                                            </option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="report-field report-field-full">
                                        <label htmlFor="report-description">Describe the issue</label>
                                        <textarea
                                            id="report-description"
                                            rows={5}
                                            maxLength={2000}
                                            placeholder="Explain what happened, where it happened, and how it affects the community..."
                                            value={reportForm.description}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    description: event.target.value
                                                })
                                            }
                                            required
                                        />
                                        <span className="report-field-hint">
                                            Include useful details to help the response team.
                                        </span>
                                    </div>

                                    <div className="report-field report-field-full">
                                        <label htmlFor="report-address">Location or address</label>
                                        <input
                                            id="report-address"
                                            type="text"
                                            placeholder="Enter a street, landmark, sector, or area"
                                            value={reportForm.address}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    address: event.target.value
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="report-field">
                                        <label htmlFor="report-latitude">
                                            Latitude <span>(optional)</span>
                                        </label>
                                        <input
                                            id="report-latitude"
                                            type="number"
                                            step="any"
                                            min="-90"
                                            max="90"
                                            placeholder="e.g. 28.6139"
                                            value={reportForm.latitude}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    latitude: event.target.value
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="report-field">
                                        <label htmlFor="report-longitude">
                                            Longitude <span>(optional)</span>
                                        </label>
                                        <input
                                            id="report-longitude"
                                            type="number"
                                            step="any"
                                            min="-180"
                                            max="180"
                                            placeholder="e.g. 77.2090"
                                            value={reportForm.longitude}
                                            onChange={(event) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    longitude: event.target.value
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="report-form-actions">
                                    <button
                                        type="button"
                                        className="report-location-button"
                                        onClick={() => {
                                            if (!navigator.geolocation) {
                                                setReportError(
                                                    "Location is not supported by this browser."
                                                );
                                                return;
                                            }

                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setReportForm((previous) => ({
                                                        ...previous,
                                                        latitude: String(position.coords.latitude),
                                                        longitude: String(position.coords.longitude)
                                                    }));
                                                    setReportError("");
                                                },
                                                () => {
                                                    setReportError(
                                                        "Unable to retrieve your location. Enter it manually."
                                                    );
                                                }
                                            );
                                        }}
                                    >
                                        <MapPin size={17} />
                                        Use my current coordinates
                                    </button>

                                    <button
                                        type="submit"
                                        className="dashboard-primary-button report-submit-button"
                                        disabled={submittingReport}
                                    >
                                        <Plus size={18} />
                                        {submittingReport ? "Submitting..." : "Submit report"}
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
                                <div className="eco-my-reports-list">
                                    {reports.map((report) => (
                                        <article key={report._id} className="eco-my-report">
                                            <div className="eco-report-card-header">
                                                <div className="eco-report-card-title">
                                                    <span className="eco-report-card-category">
                                                        {report.category}
                                                    </span>

                                                    <h3>{report.title}</h3>
                                                </div>

                                                <span
                                                    className={`dashboard-status status-${(
                                                        report.status || "Submitted"
                                                    ).toLowerCase().replace(/\s+/g, "-")}`}
                                                >
                                                    {report.status || "Submitted"}
                                                </span>
                                            </div>

                                            <p className="eco-report-card-description">
                                                {report.description}
                                            </p>

                                            <div className="eco-report-card-location">
                                                <MapPin size={16} />
                                                <span>{report.location?.address || "Location not provided"}</span>
                                            </div>

                                            <div className="eco-report-card-footer">
                                                <span>
                                                    Submitted:{" "}
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </span>

                                                {report.location?.latitude != null &&
                                                    report.location?.longitude != null && (
                                                        <span className="eco-report-card-coordinates">
                                                            {Number(report.location.latitude).toFixed(4)},{" "}
                                                            {Number(report.location.longitude).toFixed(4)}
                                                        </span>
                                                    )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            <button className="dashboard-primary-button" onClick={() => choosePage("Report an issue")}>
                                <Plus size={18} /> Submit another report
                            </button>
                        </section>
                    ) : (
                        <section className="dashboard-glass-panel dashboard-placeholder">
                            <span className="placeholder-icon">
                                {activePage === "Explore map" ? <Compass size={28} /> : activePage === "Community impact" ? <Trees size={28} /> : <CircleUserRound size={28} />}
                            </span>
                            <span className="dashboard-overline">COMING TO ECOCONNECT</span>
                            <h1>{activePage}</h1>
                            <p>This section will be connected to your account and environmental data in a future development stage.</p>
                            <button className="dashboard-primary-button" onClick={() => choosePage("Overview")}>
                                <ArrowRight size={17} /> Back to overview
                            </button>
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

