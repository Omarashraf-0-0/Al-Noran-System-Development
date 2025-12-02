import React from "react";

const FilterStatusCards = ({ requests, statusFilter, onFilterChange }) => {
	return (
		<div className="filter-section-enhanced">
			<div className="filter-header">
				<h3 className="filter-title">📊 Filter Requests</h3>
				<p className="filter-subtitle">Quick access by status</p>
			</div>
			<div className="filter-cards">
				<button
					className={`filter-card ${statusFilter === "All" ? "active" : ""}`}
					onClick={() => onFilterChange("All")}
				>
					<div className="filter-icon">📋</div>
					<div className="filter-content">
						<span className="filter-count">{requests.length}</span>
						<span className="filter-label">All Requests</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "Pending" ? "active" : ""
					}`}
					onClick={() => onFilterChange("Pending")}
				>
					<div className="filter-icon">⏳</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Pending").length}
						</span>
						<span className="filter-label">Pending</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "Under Review" ? "active" : ""
					}`}
					onClick={() => onFilterChange("Under Review")}
				>
					<div className="filter-icon">🔍</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Under Review").length}
						</span>
						<span className="filter-label">Under Review</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "ACID Issued" ? "active" : ""
					}`}
					onClick={() => onFilterChange("ACID Issued")}
				>
					<div className="filter-icon">✅</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "ACID Issued").length}
						</span>
						<span className="filter-label">ACID Issued</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "Rejected" ? "active" : ""
					}`}
					onClick={() => onFilterChange("Rejected")}
				>
					<div className="filter-icon">❌</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Rejected").length}
						</span>
						<span className="filter-label">Rejected</span>
					</div>
				</button>
			</div>
		</div>
	);
};

export default FilterStatusCards;
