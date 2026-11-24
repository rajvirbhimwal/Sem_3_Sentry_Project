import React, { useEffect, useState } from "react";
import {
    Activity,
    ArrowRight,
    BadgeCheck,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Compass,
    FileText,
    Landmark,
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

const govNavigation = [
    { label: "Civic Overview", icon: Activity },
    { label: "Department Dispatch", icon: Building2 },
    { label: "City Issue Map", icon: Compass }
];

const municipalDepartments = [
    "Solid Waste Management Dept",
    "Water & Sewerage Board",
    "State Pollution Control Board",
    "Urban Forestry & Parks Dept",
    "Municipal Enforcement Squad"
];

export default function GovDashboard({ user, onLogout, onBackHome }) {
    const [activePage, setActivePage] = useState("Civic Overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [directiveNote, setDirectiveNote] = useState("");
    const [actionBusy, setActionBusy] = useState(false);

    async function fetchAllReports() {
        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        setLoading(true);
        setError("");
        try {
            const response = await fetch("http://localhost:5000/api/reports/all", {
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

    function openReportModal(report) {
        setSelectedReport(report);
        setSelectedDept(report.assignedDepartment || municipalDepartments[0]);
        setSelectedStatus(report.status || "Under Review");
        setDirectiveNote("");
        setError("");
        setSuccess("");
    }

    async function handleGovDispatch(e) {
        e.preventDefault();
        if (!selectedReport) return;

        const token = localStorage.getItem("ecoconnect_token");
        if (!token) return;

        setActionBusy(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/reports/${selectedReport._id}/gov-action`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        assignedDepartment: selectedDept,
                        status: selectedStatus,
                        isVerified: true,
                        note: directiveNote
                    })
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Could not record official action.");
            }

            setReports((prev) =>
                prev.map((r) => (r._id === selectedReport._id ? data.report : r))
            );
            setSelectedReport(data.report);
            setDirectiveNote("");
            setSuccess(data.message || "Department assigned and status updated.");
        } catch (err) {
            setError(err.message || "Action failed.");
        } finally {
            setActionBusy(false);
        }
    }

    const displayName = user?.name?.trim() || user?.email || "Municipal Official";
    const initials = displayName
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");

    const unassignedCount = reports.filter((r) => !r.assignedDepartment).length;
    const inProgressCount = reports.filter((r) => r.status === "In Progress").length;
    const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

    const categoryStats = [
        "Waste Management",
        "Water Pollution",
        "Air Pollution",
        "Deforestation",
        "Damaged Green Spaces",
        "Other"
    ].map((cat) => ({
        name: cat,
        count: reports.filter((r) => r.category === cat).length
    }));

    const filteredReports = reports.filter((report) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            (report.title || "").toLowerCase().includes(q) ||
            (report.description || "").toLowerCase().includes(q) ||
            (report.location?.address || "").toLowerCase().includes(q) ||
            (report.assignedDepartment || "").toLowerCase().includes(q);
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
                        <small>CIVIC AUTHORITY PORTAL</small>
                    </span>
                </button>

                <div className="sidebar-label">MUNICIPAL GOVERNANCE</div>

                <nav className="dashboard-nav">
                    {govNavigation.map(({ label, icon: Icon }) => (
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
                            {label === "Department Dispatch" && (
                                <span className="nav-count">
                                    {reports.length.toString().padStart(2, "0")}
                                </span>
                            )}
                            {activePage === label && <span className="nav-active-indicator" />}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-nature-card">
                    <div className="sidebar-nature-icon">
                        <Landmark size={22} />
                    </div>
                    <span className="sidebar-small-label">PUBLIC ACCOUNTABILITY</span>
                    <h3>Coordinate civic action & oversight.</h3>
                    <p>
                        Route verified environmental alerts to municipal departments and track
                        city-wide resolution metrics.
                    </p>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-security">
                        <ShieldCheck size={17} />
                        <span>
                            <strong>Official Authority Portal</strong>
                            <small>Role: Government</small>
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
                                Civic Portal <ChevronRight size={13} /> {activePage}
                            </div>
                            <p className="dashboard-topbar-caption">
                                Transparent environmental governance and department dispatch.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-topbar-actions">
                        <span className="location-chip location-active">
                            <Landmark size={15} />
                            <span>Government Official</span>
                        </span>

                        <div className="dashboard-user-chip">
                            <span className="dashboard-user-avatar">{initials || "G"}</span>
                            <span className="dashboard-user-details">
                                <strong>{displayName}</strong>
                                <small>Civic Authority</small>
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

                    {activePage === "Civic Overview" ? (
                        <>
                            <section className="dashboard-welcome">
                                <div className="welcome-content">
                                    <span className="welcome-eyebrow">
                                        <Sparkles size={14} /> MUNICIPAL COMMAND CENTER
                                    </span>
                                    <h1>
                                        Cleaner cities through
                                        <br />
                                        swift action<span>.</span>
                                    </h1>
                                    <p>
                                        Welcome, {displayName}. Monitor incoming environmental reports,
                                        assign municipal teams, and oversee NGO field operations.
                                    </p>
                                    <div className="welcome-actions">
                                        <button
                                            className="dashboard-primary-button"
                                            onClick={() => setActivePage("Department Dispatch")}
                                        >
                                            Assign Departments <ArrowRight size={16} />
                                        </button>
                                        <button
                                            className="dashboard-secondary-button"
                                            onClick={() => setActivePage("City Issue Map")}
                                        >
                                            View City Map <Compass size={16} />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="dashboard-section">
                                <div className="dashboard-section-heading">
                                    <div>
                                        <span className="dashboard-overline">CITY-WIDE METRICS</span>
                                        <h2>Environmental governance overview</h2>
                                    </div>
                                </div>

                                <div className="dashboard-stats-grid">
                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-green">
                                            <FileText size={20} />
                                        </div>
                                        <span className="stat-label">Total reports logged</span>
                                        <strong className="stat-value">
                                            {reports.length.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">All city wards</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-amber">
                                            <Clock3 size={20} />
                                        </div>
                                        <span className="stat-label">Unassigned to dept</span>
                                        <strong className="stat-value">
                                            {unassignedCount.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Awaiting dispatch</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-blue">
                                            <Building2 size={20} />
                                        </div>
                                        <span className="stat-label">Active field work</span>
                                        <strong className="stat-value">
                                            {inProgressCount.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">In progress</span>
                                    </div>

                                    <div className="dashboard-stat-card">
                                        <div className="stat-icon stat-lime">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <span className="stat-label">Resolved issues</span>
                                        <strong className="stat-value">
                                            {resolvedCount.toString().padStart(2, "0")}
                                        </strong>
                                        <span className="stat-note">Closed & verified</span>
                                    </div>
                                </div>
                            </section>

                            <section className="dashboard-glass-panel" style={{ padding: 24, marginTop: 22 }}>
                                <div className="dashboard-panel-heading">
                                    <div>
                                        <span className="dashboard-overline">ISSUE DISTRIBUTION</span>
                                        <h2>Reports by environmental category</h2>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                                    {categoryStats.map((item) => {
                                        const pct =
                                            reports.length > 0
                                                ? Math.round((item.count / reports.length) * 100)
                                                : 0;
                                        return (
                                            <div key={item.name}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: 5 }}>
                                                    <span>{item.name}</span>
                                                    <strong>{item.count} ({pct}%)</strong>
                                                </div>
                                                <div style={{ height: 8, borderRadius: 999, background: "rgba(190,235,198,0.12)", overflow: "hidden" }}>
                                                    <div style={{ width: `${pct}%`, height: "100%", background: "#68d388", borderRadius: 999 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </>
                    ) : activePage === "City Issue Map" ? (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon">
                                <Compass size={28} />
                            </span>
                            <span className="dashboard-overline">GEOSPATIAL OVERSIGHT</span>
                            <h1>City environmental hotspot map</h1>
                            <p>Select any pin to inspect field evidence and dispatch a municipal department.</p>
                            <EcoMap
                                reports={reports}
                                onSelectReport={(report) => openReportModal(report)}
                            />
                        </section>
                    ) : (
                        <section className="dashboard-glass-panel dashboard-placeholder eco-report-page">
                            <span className="placeholder-icon">
                                <Building2 size={28} />
                            </span>
                            <span className="dashboard-overline">OFFICIAL DISPATCH QUEUE</span>
                            <h1>Department dispatch & tracking</h1>
                            <p>Assign municipal departments to reported issues and update official resolution status.</p>

                            <div className="eco-report-toolbar">
                                <label className="eco-report-search">
                                    <Search size={18} />
                                    <input
                                        type="search"
                                        placeholder="Search by title, address, or department..."
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
                                <p>Loading municipal reports...</p>
                            ) : filteredReports.length === 0 ? (
                                <p>No reports match your filter.</p>
                            ) : (
                                <div className="eco-my-reports-list">
                                    {filteredReports.map((report) => (
                                        <article
                                            key={report._id}
                                            className="eco-my-report"
                                            onClick={() => openReportModal(report)}
                                        >
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                                <span className={`dashboard-status status-${(report.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>
                                                    {report.status || "Submitted"}
                                                </span>
                                                {report.assignedDepartment && (
                                                    <span className="dashboard-status status-in-progress">
                                                        {report.assignedDepartment}
                                                    </span>
                                                )}
                                            </div>
                                            <h3>{report.title}</h3>
                                            <p>{report.description}</p>
                                            <p>
                                                <MapPin size={15} /> {report.location?.address}
                                            </p>
                                            <small>
                                                Citizen: {report.reportedBy?.name || report.reportedBy?.email || "Resident"} ·{" "}
                                                {report.assignedNgo
                                                    ? `NGO: ${report.assignedNgo.name || report.assignedNgo.email}`
                                                    : "No NGO assigned"}
                                            </small>
                                            <span className="eco-report-view-link">
                                                Assign department & update <ArrowRight size={15} />
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

                        <span className="dashboard-overline">OFFICIAL GOVERNANCE ACTION</span>
                        <h2>{selectedReport.title}</h2>

                        <div className="eco-detail-status-row">
                            <span className={`dashboard-status status-${(selectedReport.status || "Submitted").toLowerCase().replace(/\s+/g, "-")}`}>
                                {selectedReport.status || "Submitted"}
                            </span>
                            {selectedReport.isVerified && (
                                <span className="dashboard-status status-resolved">
                                    <BadgeCheck size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Verified
                                </span>
                            )}
                            {selectedReport.assignedDepartment && (
                                <small>Dept: {selectedReport.assignedDepartment}</small>
                            )}
                        </div>

                        <div className="eco-detail-grid">
                            <div>
                                <span>Category</span>
                                <strong>{selectedReport.category}</strong>
                            </div>
                            <div>
                                <span>Assigned NGO</span>
                                <strong>{selectedReport.assignedNgo?.name || selectedReport.assignedNgo?.email || "None yet"}</strong>
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
                                            href={`http://localhost:5000${url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={`http://localhost:5000${url}`}
                                                alt={`Evidence ${idx + 1}`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form className="eco-detail-description" onSubmit={handleGovDispatch}>
                            <span>Dispatch Department & Update Status</span>
                            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(193,230,199,0.22)",
                                        background: "#173d29",
                                        color: "#edf8ef"
                                    }}
                                >
                                    {municipalDepartments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(193,230,199,0.22)",
                                        background: "#173d29",
                                        color: "#edf8ef"
                                    }}
                                >
                                    <option value="Under Review">Under Review</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Official directive or resolution note..."
                                    value={directiveNote}
                                    onChange={(e) => setDirectiveNote(e.target.value)}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(193,230,199,0.22)",
                                        background: "rgba(3,25,15,0.5)",
                                        color: "#edf8ef"
                                    }}
                                />

                                <button
                                    type="submit"
                                    className="dashboard-primary-button"
                                    disabled={actionBusy}
                                >
                                    <Building2 size={16} /> {actionBusy ? "Saving..." : "Assign Department & Update"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}