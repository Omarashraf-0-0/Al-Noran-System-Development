import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

/**
 * RequestDocumentsModal - Modal for requesting documents from client
 *
 * TODO: RBAC - This component should check permissions:
 * - canRequestDocuments: Allow requesting documents from client
 */
const RequestDocumentsModal = ({
	isOpen,
	onClose,
	newDocument,
	onNewDocumentChange,
	requiredDocuments,
	onAddDocument,
	onRemoveDocument,
	onSave,
	uploading,
}) => {
	const [suggestions, setSuggestions] = useState([]);
	const [filteredSuggestions, setFilteredSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef(null);
	const dropdownRef = useRef(null);

	// Fetch document name suggestions on mount
	useEffect(() => {
		if (isOpen) {
			fetchDocumentNames();
		}
	}, [isOpen]);

	// Filter suggestions when input changes
	useEffect(() => {
		const docValue = newDocument || "";
		if (docValue.trim()) {
			const filtered = suggestions.filter((name) =>
				name.toLowerCase().includes(docValue.toLowerCase())
			);
			setFilteredSuggestions(filtered);
			setShowSuggestions(filtered.length > 0);
		} else {
			setFilteredSuggestions(suggestions);
			setShowSuggestions(false);
		}
	}, [newDocument, suggestions]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target) &&
				inputRef.current &&
				!inputRef.current.contains(event.target)
			) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const fetchDocumentNames = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/document-names`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (response.data.success) {
				setSuggestions(response.data.documentNames);
			}
		} catch (error) {
			console.error("Error fetching document names:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectSuggestion = (name) => {
		// Directly add the document when selected from dropdown (auto-add)
		onNewDocumentChange(name);
		setShowSuggestions(false);
		// Auto-add the selected document immediately
		setTimeout(() => onAddDocument(), 0);
	};

	const handleInputFocus = () => {
		if (newDocument.trim()) {
			setFilteredSuggestions(
				suggestions.filter((name) =>
					name.toLowerCase().includes(newDocument.toLowerCase())
				)
			);
		} else {
			setFilteredSuggestions(suggestions);
		}
		setShowSuggestions(true);
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			setShowSuggestions(false);
			onAddDocument();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-2xl font-bold text-gray-800">
						📄 طلب مستندات من العميل
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<p className="text-gray-600 mb-6">
					أضف المستندات المطلوبة من العميل. سيتم إرسال إشعار له بالمستندات التي
					يجب رفعها.
				</p>

				{/* Add Document Input with Autocomplete */}
				<div className="flex gap-2 mb-4">
					<div className="relative flex-1">
						<input
							ref={inputRef}
							type="text"
							value={newDocument}
							onChange={(e) => onNewDocumentChange(e.target.value)}
							onFocus={handleInputFocus}
							onKeyPress={handleKeyPress}
							placeholder="اسم المستند المطلوب (مثال: شهادة منشأ)"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
						/>
						{/* Autocomplete Dropdown */}
						{showSuggestions && (
							<div
								ref={dropdownRef}
								className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
							>
								{loading ? (
									<div className="px-4 py-3 text-gray-500 text-center">
										جاري التحميل...
									</div>
								) : filteredSuggestions.length > 0 ? (
									filteredSuggestions.map((name, index) => (
										<button
											key={index}
											type="button"
											onClick={() => handleSelectSuggestion(name)}
											className="w-full px-4 py-2 text-right hover:bg-red-50 text-gray-700 border-b border-gray-100 last:border-b-0 transition"
										>
											{name}
										</button>
									))
								) : (
									<div className="px-4 py-3 text-gray-500 text-center">
										لا توجد اقتراحات
									</div>
								)}
							</div>
						)}
					</div>
					<button
						onClick={() => {
							setShowSuggestions(false);
							onAddDocument();
						}}
						className="px-6 py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition"
					>
						إضافة
					</button>
				</div>

				{/* Document List */}
				<div className="space-y-2 mb-6">
					{requiredDocuments.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 rounded-lg">
							<p className="text-gray-500">لم يتم إضافة مستندات بعد</p>
						</div>
					) : (
						requiredDocuments.map((doc, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
							>
								<div className="flex items-center gap-2">
									<span className="text-red-800">📄</span>
									<span className="text-gray-800 font-medium">{doc.name}</span>
								</div>
								<button
									onClick={() => onRemoveDocument(index)}
									className="text-red-600 hover:text-red-800"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							</div>
						))
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
					>
						إلغاء
					</button>
					<button
						onClick={onSave}
						disabled={requiredDocuments.length === 0 || uploading}
						className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{uploading ? "جاري الإرسال..." : "إرسال الطلب للعميل"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RequestDocumentsModal;

