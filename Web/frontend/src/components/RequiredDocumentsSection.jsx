import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

/**
 * RequiredDocumentsSection - Displays documents requested from the client
 *
 * TODO: RBAC - This component should check permissions:
 * - canViewDocuments: Allow viewing document status
 * - canDownloadDocuments: Allow downloading uploaded documents
 * - canDeleteDocuments: Allow deleting/resetting uploaded documents
 */
const RequiredDocumentsSection = ({
	requiredDocuments,
	shipmentId,
	token,
	onShipmentUpdate,
}) => {
	const [deletingDoc, setDeletingDoc] = useState(null);

	if (!requiredDocuments || requiredDocuments.length === 0) {
		return null;
	}

	const uploadedCount = requiredDocuments.filter((doc) => doc.uploaded).length;

	const handleRefresh = async () => {
		try {
			toast.loading("جاري تحديث البيانات...");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			onShipmentUpdate(response.data);
			toast.dismiss();
			toast.success("تم تحديث البيانات بنجاح");
		} catch (error) {
			toast.dismiss();
			toast.error("فشل تحديث البيانات");
			console.error("Refresh error:", error);
		}
	};

	const handleViewDocument = async (doc) => {
		try {
			if (!doc.fileId || doc.fileId === "temp-file-id") {
				toast.error("معرف الملف غير صالح");
				console.error("Invalid fileId:", doc.fileId);
				return;
			}

			toast.loading("جاري تحميل الملف...");
			console.log("Fetching file with ID:", doc.fileId);

			const fileResponse = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${doc.fileId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			toast.dismiss();

			const fileUrl =
				fileResponse.data?.upload?.presignedUrl ||
				fileResponse.data?.presignedUrl;
			if (fileUrl) {
				window.open(fileUrl, "_blank");
			} else {
				toast.error("لم يتم العثور على رابط الملف");
				console.error("No presigned URL in response:", fileResponse.data);
			}
		} catch (error) {
			toast.dismiss();
			const errorMsg =
				error.response?.data?.message || error.message || "فشل تحميل الملف";
			toast.error(errorMsg);
			console.error("File fetch error:", {
				fileId: doc.fileId,
				error: error.response?.data || error.message,
				fullError: error,
			});
		}
	};

	const handleDeleteDocument = async (doc) => {
		if (!window.confirm(`هل أنت متأكد من حذف المستند "${doc.name}"؟\nسيتمكن العميل من إعادة رفعه.`)) {
			return;
		}

		try {
			setDeletingDoc(doc._id);
			toast.loading("جاري حذف المستند...");

			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents/${doc._id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.dismiss();
			toast.success("تم حذف المستند بنجاح. يمكن للعميل إعادة رفعه.");

			// Refresh shipment data
			handleRefresh();
		} catch (error) {
			toast.dismiss();
			const errorMsg = error.response?.data?.message || error.message || "فشل حذف المستند";
			toast.error(errorMsg);
			console.error("Delete document error:", error);
		} finally {
			setDeletingDoc(null);
		}
	};

	return (
		<div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
					<span>📋</span>
					<span>المستندات المطلوبة من العميل</span>
					<span className="text-sm font-normal text-gray-600">
						({uploadedCount} / {requiredDocuments.length} مرفوعة)
					</span>
				</h2>
				<button
					onClick={handleRefresh}
					className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
				>
					<span>🔄</span>
					<span>تحديث</span>
				</button>
			</div>

			<div className="space-y-3">
				{requiredDocuments.map((doc, index) => (
					<div
						key={doc._id || index}
						className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
							doc.uploaded
								? "bg-green-50 border-green-300"
								: "bg-yellow-50 border-yellow-300"
						}`}
					>
						<div className="flex items-center gap-3 flex-1">
							{doc.uploaded ? (
								<span className="text-2xl">✅</span>
							) : (
								<span className="text-2xl animate-pulse">⏳</span>
							)}
							<div>
								<p className="font-bold text-gray-800">{doc.name}</p>
								<p className="text-sm text-gray-500">
									{doc.uploaded
										? `تم الرفع: ${new Date(doc.uploadedAt).toLocaleDateString(
												"ar-EG"
										  )}`
										: `تم الطلب: ${new Date(doc.requestedAt).toLocaleDateString(
												"ar-EG"
										  )}`}
								</p>
							</div>
						</div>

						{doc.uploaded && doc.fileId && doc.fileId !== "temp-file-id" && (
							<div className="flex gap-2">
								<button
									onClick={() => handleViewDocument(doc)}
									className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
								>
									<span>عرض المستند</span>
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
										<path
											fillRule="evenodd"
											d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
								<button
									onClick={() => handleDeleteDocument(doc)}
									disabled={deletingDoc === doc._id}
									className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span>{deletingDoc === doc._id ? "جاري الحذف..." : "حذف"}</span>
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							</div>
						)}
					</div>
				))}
			</div>

			<div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
				<p className="text-sm text-blue-800 text-center">
					💡 يمكنك رؤية حالة المستندات المطلوبة التي طلبتها من العميل
				</p>
			</div>
		</div>
	);
};

export default RequiredDocumentsSection;
