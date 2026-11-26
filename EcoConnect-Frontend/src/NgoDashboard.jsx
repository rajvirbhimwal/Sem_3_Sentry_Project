import React, { useEffect, useState } from "react";
import {
    Activity,
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Compass,
    FileText,
    HandHeart,
    Leaf,
    LogOut,
    MapPin,
    Menu,
    Search,
    ShieldCheck,
    Sparkles,
    X
} from "lucide-react";
import "./Dashboard.css";
import EcoMap from "./Component/EcoMap";

const ngoNavigation = [
    { label: "NGO Overview", icon: Activity },
    { label: "All Citizen Reports", icon: FileText },
    { label: "Accepted by Us", icon: HandHeart },
    { label: "Issue Map", icon: Compass }
];

export default function NgoDashboard({ user, onLogout, onBackHome }) {
    const [activePage, setActivePage] = useState("NGO Overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedReport, setSelectedReport] = useState(null);
    const [actionNote, setActionNote] = useState("");
    const [actionBusy, setActionBusy] = useState(false);

    async function fetchAllReports() {
        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch reports.");
            }
            setReports(data.reports || []);
        } catch (err) {
            setError(err.message || "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAllReports();
    }, []);

    async function handleNgoAction(reportId, action, nextStatus = "") {
        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        setActionBusy(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/${reportId}/ngo-action`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        action,
                        status: nextStatus,
                        note: actionNote
                    })
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Could not update report.");
            }

            setReports((prev) =>
                prev.map((r) => (r._id === reportId ? data.report : r))
            );
            setSelectedReport(data.report);
            setActionNote("");
            setSuccess(data.message || "Report updated.");
        } catch (err) {
            setError(err.message || "Action failed.");
        } finally {
            setActionBusy(false);
        }
    }

    const displayName = user?.name?.trim() || user?.email || "NGO Partner";
    const initials = displayName
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");

    const myAcceptedReports = reports.filter(
        (r) => r.assignedNgo?._id === user?.id || r.assignedNgo === user?.id
    );
    const unverifiedCount = reports.filter((r) => !r.isVerified).length;
    const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

    const baseList =
        activePage === "Accepted by Us" ? myAcceptedReports : reports;

    const filteredReports = baseList.filter((report) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            (report.title || "").toLowerCase().includes(q) ||
            (report.description || "").toLowerCase().includes(q) ||
            (report.location?.address || "").toLowerCase().includes(q);
        const matchesCat =
            categoryFilter === "All" || report.category === categoryFilter;
        const matchesStatus =
            statusFilter === "All" || (report.status || "Submitted") === statusFilter;
        return matchesSearch && matchesCat && matchesStatus;
    });

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
                        <small>NGO PARTNER PORTAL</small>
                    </span>
                </button>

                <div className="sidebar-label">NGO OPERATIONS</div>

                <nav className="dashboard-nav">
                    {ngoNavigation.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className={`dashboard-nav-item ${activePage === label ? "active" : ""}`}
                            onClick={() => {
                                setActivePage(label);
                                setSidebarOpen(false);
                                setError("");
                                setSuccess("");
                            }}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                            {label === "All Citizen Reports" && (
                                <span className="nav-count">
                                    {reports.length.toString().padStart(2, "0")}
                                </span>
                            )}
                            {label === "Accepted by Us" && (
                                <span className="nav-count">
                                    {myAcceptedReports.length.toString().padStart(2, "0")}
                                </span>
                            )}
                            {activePage === label && <span className="nav-active-indicator" />}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-nature-card">
                    <div className="sidebar-nature-icon">
                        <HandHeart size={22} />
                    </div>
                    <span className="sidebar-small-label">NGO IMPACT</span>
                    <h3>Verify & mobilize field action.</h3>
                    <p>
                        Validate citizen reports, claim environmental cleanups, and keep
                        communities updated.
                    </p>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-security">
                        <ShieldCheck size={17} />
                        <span>
                            <strong>Verified NGO Workspace</strong>
                            <small>Role: NGO Partner</small>
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
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={21} />
                        </button>
                        <div>
                            <div className="dashboard-breadcrumb">
                                NGO Portal <ChevronRight size={13} /> {activePage}
                            </div>
                            <p className="dashboard-topbar-caption">
                                Turning citizen alerts into verified on-ground action.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-topbar-actions">
                        <span className="location-chip location-active">
                            <BadgeCheck size={15} />
                            <span>NGO Partner</span>
                        </span>

                        <div className="dashboard-user-chip">
                            <span className="dashboard-user-avatar">{initials || "N"}</span>
                            <span className="dashboard-user-details">
                                <strong>{displayName}</strong>
                                <small>NGO Account</small>
                            </span>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {error && (
                        <p role="alert" className="report-message report-error" style={{ marginBottom: 16 }}>
                            {error}
                        </p>
                    )}
                    {success && (
                        <p role="status" className="report-message report-success" style={{ marginBottom: 16 }}>
                            {success}
                        </p>
                    )}

                    {activePage === "NGO Overview" ? (
                        <>
                            <section className="dashboard-welcome">
                                <div className="welcome-content">
                                    <span className="welcome-eyebrow">
                                        <Sparkles size={14} /> NGO ACTION HUB
                                    </span>
                                    <h1>
                                        Coordinate local
                                        <br />
                                        eco-action<span>.</span>
                                    </h1>
                                    <p>
                                        Welcome, {displayName}. Review newly submitted citizen
                                        reports, verify authenticity, and claim issues for cleanup.
                                    </p>
                                    <div className="welcome-actions">
                                        <button
                                            className="dashboard-primary-button"
                                            onClick={() => setActivePage("All Citizen Reports")}
                                        >
                                            Review Citizen Reports <ArrowRight size={16} />
                                        </button>
                                        <button
                                            className="dashboard-secondary-button"
                                            onClick={() => setActivePage("Issue Map")}
                                        >
                                            Open Issue Map <Compass size={16} />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="dashboard-section">
                                <div className="dashboard-section-heading">
                                    <div>
                                        <span className="dashboard-overline">LIVE OPERATIONS</span>
                                        <h2>Platform & NGO metrics</h2>
                                    </div>
                                </div>

                                <div className="dashboard-stats-grid">
                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-green">
                                            <FileText size={20} />
                                        </div>
                                        <span className="stat-label">Total citizen reports</span>
                                        <strong className="stat-value">
                                            {reports.length.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Across all neighbourhoods</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-amber">
                                            <Clock3 size={20} />
                                        </div>
                                        <span className="stat-label">Needs verification</span>
                                        <strong className="stat-value">
                                            {unverifiedCount.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Awaiting NGO check</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-blue">
                                            <HandHeart size={20} />
                                        </div>
                                        <span className="stat-label">Claimed by your NGO</span>
                                        <strong className="stat-value">
                                            {myAcceptedReports.length.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Active field assignments</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-lime">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <span className="stat-label">Resolved issues</span>
                                        <strong className="stat-value">
                                            {resolvedCount.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Completed cleanups</span>
                                    </div>
                                </div>
                            </section>
                        </>
                    ) : activePage === "Issue Map" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon">
                                <Compass size={28} />
                            </span>
                            <span className="dashboard-overline">FIELD COORDINATION MAP</span>
                            <h1>Environmental reports map</h1>
                            <p>Click any pin to inspect evidence photos, verify the report, or claim it for your NGO.</p>
                            <EcoMap
                                reports={reports}
                                onSelectReport={(report) => setSelectedReport(report)}
                            />
                        </section>
                    ) : (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon">
                                <FileText size={28} />
                            </span>
                            <span className="dashboard-overline">
                                {activePage === "Accepted by Us" ? "YOUR NGO TASKS" : "COMMUNITY QUEUE"}
                            </span>
                            <h1>{activePage}</h1>
                            <p>
                                {activePage === "Accepted by Us"
                                    ? "Manage reports your NGO has accepted and update their field progress."
                                    : "Inspect citizen reports, verify valid issues, and accept tasks for action."}
                            </p>

                            <div className="eco-report-toolbar">
                                <label className="eco-report-search">
                                    <Search size={18} />
                                    <input
                                        type="search"
                                        placeholder="Search reports by title, description, or address..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </label>

                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
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
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                                <button
                                    type="button"
                                    className="eco-report-clear"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setCategoryFilter("All");
                                        setStatusFilter("All");
                                    }}
                                >
                                    Clear
                                </button>
                            </div>

                            {loading ? (
                                <p>Loading reports...</p>
                            ) : filteredReports.length === 0 ? (
                                <p>No reports match your current filter.</p>
                            ) : (
                                <div className="eco-my-reports-list">
                                    {filteredReports.map((report) => (
                                        <article
                                            key={report._id}
                                            className="eco-my-report"
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                                <span className={`dashboard-status status-${(report.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>
                                                    {report.status || "Submitted"}
                                                </span>
                                                {report.isVerified && (
                                                    <span className="dashboard-status status-resolved">
                                                        ✓ Verified
                                                    </span>
                                                )}
                                            </div>
                                            <h3>{report.title}</h3>
                                            <p>{report.description}</p>
                                            <p>
                                                <MapPin size={15} /> {report.location?.address}
                                            </p>
                                            <small>
                                                Reported by: {report.reportedBy?.name || report.reportedBy?.email || "Citizen"} ·{" "}
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </small>
                                            <span className="eco-report-view-link">
                                                Manage & verify <ArrowRight size={15} />
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>

            {selectedReport && (
                <div
                    className="eco-detail-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setSelectedReport(null);
                    }}
                >
                    <section className="eco-detail-modal" role="dialog" aria-modal="true">
                        <button
                            className="eco-detail-close"
                            onClick={() => setSelectedReport(null)}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <span className="dashboard-overline">NGO VERIFICATION & ACTION</span>
                        <h2>{selectedReport.title}</h2>

                        <div className="eco-detail-status-row">
                            <span className={`dashboard-status status-${(selectedReport.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>
                                {selectedReport.status || "Submitted"}
                            </span>
                            <span className="dashboard-status">
                                {selectedReport.isVerified ? "✓ Verified Report" : "Unverified"}
                            </span>
                            {selectedReport.assignedNgo && (
                                <small>
                                    Claimed by: {selectedReport.assignedNgo.name || selectedReport.assignedNgo.email}
                                </small>
                            )}
                        </div>

                        <div className="eco-detail-grid">
                            <div>
                                <span>Category</span>
                                <strong>{selectedReport.category}</strong>
                            </div>
                            <div>
                                <span>Reported By</span>
                                <strong>{selectedReport.reportedBy?.name || selectedReport.reportedBy?.email || "Citizen"}</strong>
                            </div>
                            <div className="eco-detail-location">
                                <span>Location</span>
                                <strong>
                                    <MapPin size={16} /> {selectedReport.location?.address}
                                </strong>
                            </div>
                        </div>

                        <div className="eco-detail-description">
                            <span>Description</span>
                            <p>{selectedReport.description}</p>
                        </div>

                        {selectedReport.imageUrls?.length > 0 && (
                            <div className="eco-detail-images">
                                <span>Evidence Photos ({selectedReport.imageUrls.length})</span>
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
                                                alt={`Evidence ${idx + 1}`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NGO Action Controls */}
                        <div className="eco-detail-description">
                            <span>Take NGO Action</span>
                            <input
                                type="text"
                                placeholder="Add a progress or verification note for the citizen..."
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    marginBottom: 12,
                                    borderRadius: 10,
                                    border: "1px solid rgba(193,230,199,0.22)",
                                    background: "rgba(3,25,15,0.5)",
                                    color: "#edf8ef"
                                }}
                            />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                {!selectedReport.isVerified && (
                                    <button
                                        type="button"
                                        className="dashboard-secondary-button"
                                        disabled={actionBusy}
                                        onClick={() => handleNgoAction(selectedReport._id, "verify")}
                                    >
                                        <BadgeCheck size={16} /> Verify Report
                                    </button>
                                )}

                                {!selectedReport.assignedNgo && (
                                    <button
                                        type="button"
                                        className="dashboard-primary-button"
                                        disabled={actionBusy}
                                        onClick={() => handleNgoAction(selectedReport._id, "accept")}
                                    >
                                        <HandHeart size={16} /> Accept for Action
                                    </button>
                                )}

                                {selectedReport.status !== "In Progress" && (
                                    <button
                                        type="button"
                                        className="dashboard-secondary-button"
                                        disabled={actionBusy}
                                        onClick={() =>
                                            handleNgoAction(selectedReport._id, "update-status", "In Progress")
                                        }
                                    >
                                        Mark In Progress
                                    </button>
                                )}

                                {selectedReport.status !== "Resolved" && (
                                    <button
                                        type="button"
                                        className="dashboard-primary-button"
                                        disabled={actionBusy}
                                        onClick={() =>
                                            handleNgoAction(selectedReport._id, "update-status", "Resolved")
                                        }
                                    >
                                        <CheckCircle2 size={16} /> Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}