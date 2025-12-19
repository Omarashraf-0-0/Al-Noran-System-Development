import React from "react";

const FilterStatusCards = ({ 
	requests, 
	statusFilter, 
	onFilterChange,
	lockedByMe,
	onLockedByMeChange,
}) => {
	// Get current user ID for counting locked requests
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const currentUserId = user.id || user._id;
	
	// Count requests locked by current user
	const myLockedCount = requests.filter(
		(r) => r.isLocked && (r.reviewingBy?._id === currentUserId || r.reviewingBy === currentUserId)
	).length;

	return (
		<div className="filter-section-enhanced">
			<div className="filter-header">
				<h3 className="filter-title">📊 تصفية الطلبات</h3>
				<p className="filter-subtitle">وصول سريع حسب الحالة</p>
			</div>
			<div className="filter-cards">
				<button
					className={`filter-card ${statusFilter === "All" && !lockedByMe ? "active" : ""}`}
					onClick={() => { onFilterChange("All"); onLockedByMeChange?.(false); }}
				>
					<div className="filter-icon">📋</div>
					<div className="filter-content">
						<span className="filter-count">{requests.length}</span>
						<span className="filter-label">جميع الطلبات</span>
					</div>
				</button>
				{/* My Locked Requests Card */}
				{onLockedByMeChange && (
					<button
						className={`filter-card ${lockedByMe ? "active" : ""}`}
						onClick={() => { onLockedByMeChange(!lockedByMe); onFilterChange("All"); }}
						style={{ 
							borderColor: lockedByMe ? '#059669' : undefined,
							background: lockedByMe ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : undefined,
						}}
					>
						<div className="filter-icon">🔒</div>
						<div className="filter-content">
							<span className="filter-count">{myLockedCount}</span>
							<span className="filter-label">طلباتي المقفولة</span>
						</div>
					</button>
				)}
				<button
					className={`filter-card ${
						statusFilter === "Pending" ? "active" : ""
					}`}
					onClick={() => { onFilterChange("Pending"); onLockedByMeChange?.(false); }}
				>
					<div className="filter-icon">⏳</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Pending").length}
						</span>
						<span className="filter-label">قيد الانتظار</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "Under Review" ? "active" : ""
					}`}
					onClick={() => { onFilterChange("Under Review"); onLockedByMeChange?.(false); }}
				>
					<div className="filter-icon">🔍</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Under Review").length}
						</span>
						<span className="filter-label">قيد المراجعة</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "ACID Issued" ? "active" : ""
					}`}
					onClick={() => { onFilterChange("ACID Issued"); onLockedByMeChange?.(false); }}
				>
					<div className="filter-icon">✅</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "ACID Issued").length}
						</span>
						<span className="filter-label">تم الإصدار</span>
					</div>
				</button>
				<button
					className={`filter-card ${
						statusFilter === "Rejected" ? "active" : ""
					}`}
					onClick={() => { onFilterChange("Rejected"); onLockedByMeChange?.(false); }}
				>
					<div className="filter-icon">❌</div>
					<div className="filter-content">
						<span className="filter-count">
							{requests.filter((r) => r.status === "Rejected").length}
						</span>
						<span className="filter-label">مرفوض</span>
					</div>
				</button>
			</div>
		</div>
	);
};

export default FilterStatusCards;

