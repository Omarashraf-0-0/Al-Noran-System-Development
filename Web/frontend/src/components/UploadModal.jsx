import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import backupIcon from "../assets/images/backup.png";
import closeIcon from "../assets/images/close.png";

// UploadModal component handles uploading files via drag & drop or manual selection
const UploadModal = ({ isOpen, onClose, shipmentId, onUploadSuccess }) => {
	// ------------------ STATE ------------------
	const [files, setFiles] = useState([]); // Stores selected files with names
	const [isDragging, setIsDragging] = useState(false); // Tracks drag state
	const [uploading, setUploading] = useState(false); // Upload progress state

	const token = localStorage.getItem("token");

	// ------------------ FILE SELECTION ------------------
	const handleFileChange = (event) => {
		if (event.target.files) {
			const newFiles = Array.from(event.target.files).map((file) => ({
				file,
				name: file.name,
				documentName: "", // Will be filled by user
			}));
			setFiles((prev) => [...prev, ...newFiles]);
		}
	};

	// ------------------ DRAG & DROP HANDLERS ------------------
	const onDrop = useCallback((event) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
		if (event.dataTransfer?.files?.length > 0) {
			const newFiles = Array.from(event.dataTransfer.files).map((file) => ({
				file,
				name: file.name,
				documentName: "", // Will be filled by user
			}));
			setFiles((prev) => [...prev, ...newFiles]);
			event.dataTransfer.clearData();
		}
	}, []);

	const onDragOver = (event) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const onDragEnter = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(true);
	};

	const onDragLeave = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
	};

	// ------------------ FILE MANAGEMENT ------------------
	const removeFile = (fileName) => {
		setFiles(files.filter((fileObj) => fileObj.name !== fileName));
	};

	const updateDocumentName = (fileName, documentName) => {
		setFiles(
			files.map((fileObj) =>
				fileObj.name === fileName ? { ...fileObj, documentName } : fileObj
			)
		);
	};

	// ------------------ UPLOAD HANDLER ------------------
	const handleUpload = async () => {
		if (!shipmentId) {
			toast.error("معرف الشحنة غير متاح");
			return;
		}

		// Validate all files have document names
		const filesWithoutNames = files.filter((f) => !f.documentName.trim());
		if (filesWithoutNames.length > 0) {
			toast.error("الرجاء إدخال اسم المستند لجميع الملفات");
			return;
		}

		try {
			setUploading(true);
			toast.loading("جاري رفع المستندات...");

			const uploadedDocs = [];

			// Upload each file to S3
			for (const fileObj of files) {
				const formData = new FormData();
				formData.append("file", fileObj.file);
				formData.append("category", "shipment");
				formData.append("relatedId", shipmentId);
				formData.append("documentType", "other");
				formData.append("description", fileObj.documentName);

				console.log("Uploading file:", fileObj.documentName);

				const uploadResponse = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/uploads`,
					formData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "multipart/form-data",
						},
					}
				);

				// Store uploaded file info
				if (uploadResponse.data.success) {
					uploadedDocs.push({
						name: fileObj.documentName,
						fileId: uploadResponse.data.upload.id || uploadResponse.data.upload._id,
						uploaded: true,
						uploadedAt: new Date(),
					});
				}
			}

			// Update shipment's requiredDocuments array with the new documents
			if (uploadedDocs.length > 0) {
				try {
					// Fetch current shipment to get existing requiredDocuments
					const shipmentResponse = await axios.get(
						`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);

					const currentDocs = shipmentResponse.data.requiredDocuments || [];
					const updatedDocs = [...currentDocs, ...uploadedDocs];

					// Update shipment with new documents
					await axios.patch(
						`${import.meta.env.VITE_API_URL}/api/shipments/${shipmentResponse.data.acid}`,
						{
							requiredDocuments: updatedDocs,
						},
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);

					console.log("Shipment documents updated successfully");
				} catch (shipmentUpdateError) {
					console.error("Error updating shipment documents:", shipmentUpdateError);
					// Don't fail the whole operation if this fails
				}
			}

			toast.dismiss();
			toast.success(`تم رفع ${files.length} مستند بنجاح`);
			setFiles([]);

			// Call success callback to refresh the parent component
			if (onUploadSuccess) {
				onUploadSuccess();
			}

			onClose();
		} catch (error) {
			console.error("Upload error:", error);
			console.error("Upload error details:", error.response?.data);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل رفع المستندات");
		} finally {
			setUploading(false);
		}
	};

	// ------------------ KEYBOARD SHORTCUTS ------------------
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape") onClose();
		};

		if (isOpen) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	// ------------------ MODAL UI ------------------
	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="upload-modal-title"
		>
			{/* Modal container */}
			<div
				className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 relative"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1"
					aria-label="إغلاق"
				>
					<img src={closeIcon} alt="close" className="w-5 h-5" />
				</button>

				{/* Title */}
				<h2
					id="upload-modal-title"
					className="text-2xl font-bold text-center text-red-900 mb-6"
				>
					رفع المستندات
				</h2>

				{/* File drop area */}
				<div
					onDrop={onDrop}
					onDragOver={onDragOver}
					onDragEnter={onDragEnter}
					onDragLeave={onDragLeave}
					className={`border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-10 text-center cursor-pointer hover:border-red-700 transition-colors ${
						isDragging ? "border-red-700 bg-red-50" : ""
					}`}
				>
					<input
						type="file"
						multiple
						className="hidden"
						id="file-upload"
						onChange={handleFileChange}
					/>

					<label
						htmlFor="file-upload"
						className="cursor-pointer w-full flex flex-col items-center"
					>
						<img
							src={backupIcon}
							alt="upload"
							className="w-12 h-12 mb-4 opacity-60"
						/>
						<p className="text-gray-700 font-semibold">
							اسحب وأفلت الملفات هنا
						</p>
						<p className="text-sm text-gray-500 my-1">أو</p>
						<p className="font-bold text-red-800 hover:underline">
							انقر لاختيار الملفات
						</p>
					</label>
				</div>

				{/* File preview list */}
				{files.length > 0 && (
					<div className="mt-6">
						<h3 className="font-semibold text-gray-800 text-start mb-2">
							الملفات المحددة:
						</h3>
						<ul className="mt-2 space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
							{files.map((fileObj, index) => (
								<li key={index} className="bg-white p-4 rounded-md shadow-sm">
									<div className="flex items-start justify-between gap-3 mb-2">
										<div className="flex items-center gap-3 overflow-hidden flex-1">
											<img
												src={backupIcon}
												alt="file"
												className="w-5 h-5 opacity-70 flex-shrink-0"
											/>
											<span
												className="text-sm text-gray-800 truncate"
												title={fileObj.name}
											>
												{fileObj.name}
											</span>
										</div>
										<button
											onClick={() => removeFile(fileObj.name)}
											className="text-red-600 hover:text-red-800 flex-shrink-0"
											aria-label={`إزالة ملف ${fileObj.name}`}
										>
											✕
										</button>
									</div>
									<div>
										<label className="block text-xs text-gray-600 mb-1 text-right">
											اسم المستند <span className="text-red-600">*</span>
										</label>
										<input
											type="text"
											value={fileObj.documentName}
											onChange={(e) =>
												updateDocumentName(fileObj.name, e.target.value)
											}
											placeholder="مثال: فاتورة، شهادة منشأ، بوليصة شحن"
											className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
										/>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Action buttons */}
				<div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
					<button
						onClick={onClose}
						disabled={uploading}
						className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						إلغاء
					</button>
					<button
						onClick={handleUpload}
						disabled={files.length === 0 || uploading}
						className="px-6 py-2.5 bg-red-900 text-white font-bold rounded-lg hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{uploading ? "جاري الرفع..." : "رفع"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default UploadModal;
