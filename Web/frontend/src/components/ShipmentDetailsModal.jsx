import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import close from "../assets/images/close(1).png";

export default function ShipmentDetailsModal({
	shipmentId,
	onClose,
	onUpdate,
}) {
	const [shipment, setShipment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [employees, setEmployees] = useState([]);
	const [formData, setFormData] = useState({
		status: "",
		employee_id: "",
	});
	const [uploadingDocument, setUploadingDocument] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [documentName, setDocumentName] = useState("");

	const token = localStorage.getItem("token");

	useEffect(() => {
		if (shipmentId) {
			fetchShipmentDetails();
			fetchEmployees();
		}
	}, [shipmentId]);

	const fetchEmployees = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Filter only employees
			const employeeList = response.data.filter(
				(user) => user.type === "employee"
			);
			setEmployees(employeeList);
		} catch (error) {
			console.error("Error fetching employees:", error);
			toast.error("??? ????? ??? ????????");
		}
	};

	const fetchShipmentDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			setShipment(response.data);
			setFormData({
				status: response.data.status || "",
				employee_id:
					response.data.employee_id?._id || response.data.employee_id || "",
			});
			setLoading(false);
		} catch (error) {
			console.error("Error fetching shipment details:", error);
			toast.error("??? ????? ????? ??????");
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSave = async () => {
		try {
			const updateData = {
				status: formData.status,
				employee_id: formData.employee_id || null,
			};

			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/shipments/${shipment.acid}`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("?? ????? ?????? ?????");
			setIsEditing(false);
			fetchShipmentDetails();
			if (onUpdate) onUpdate();
		} catch (error) {
			console.error("Error updating shipment:", error);
			toast.error(error.response?.data?.message || "??? ????? ???????");
		}
	};

	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		if (file) {
			setSelectedFile(file);
			setDocumentName(file.name);
		}
	};

	const handleUploadDocument = async () => {
		if (!selectedFile || !documentName) {
			toast.error("?????? ?????? ??? ?????? ??? ???????");
			return;
		}

		try {
			setUploadingDocument(true);

			// Step 1: Upload file to S3
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("category", "shipment");
			formData.append("relatedId", shipmentId);

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

			const uploadedFileId =
				uploadResponse.data.upload.id || uploadResponse.data.upload._id;

			// Step 2: Add document to shipment's requiredDocuments
			const updatedDocuments = [
				...(shipment.requiredDocuments || []),
				{
					name: documentName,
					uploaded: true,
					fileId: uploadedFileId,
					uploadedAt: new Date(),
				},
			];

			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/shipments/${shipment.acid}`,
				{
					requiredDocuments: updatedDocuments,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("?? ??? ??????? ?????");
			setSelectedFile(null);
			setDocumentName("");
			fetchShipmentDetails();
			if (onUpdate) onUpdate();
		} catch (error) {
			console.error("Error uploading document:", error);
			toast.error(error.response?.data?.message || "??? ??? ???????");
		} finally {
			setUploadingDocument(false);
		}
	};

	const handleDownloadDocument = async (fileId, fileName) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Open the S3 URL in a new tab
			window.open(response.data.upload.s3Url, "_blank");
		} catch (error) {
			console.error("Error downloading document:", error);
			toast.error("??? ????? ???????");
		}
	};

	const getStatusBadgeColor = (status) => {
		switch (status) {
			case "??????":
			case "??? ?????":
				return "bg-green-100 text-green-800";
			case "?? ??????":
				return "bg-blue-100 text-blue-800";
			case "?? ???? ???????":
				return "bg-cyan-100 text-cyan-800";
			case "??????? ???????":
			case "???? ????? ????????":
			case "???? ????? ?????? ???????? ?????????":
				return "bg-indigo-100 text-indigo-800";
			case "?? ?????? ???? ?????":
			case "?? ???? ?????":
				return "bg-purple-100 text-purple-800";
			case "?? ?????? ?????":
				return "bg-orange-100 text-orange-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
						<p className="mt-4 text-gray-600">???? ???????...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!shipment) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<img src={close} alt="close" className="w-6 h-6" />
					</button>
					<h2 className="text-2xl font-bold text-[#690000]">?????? ??????</h2>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Shipment Card */}
					<div className="bg-gray-50 rounded-lg p-6 mb-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* ACID */}
							<div>
								<p className="text-sm text-gray-500 mb-1">??? ACID</p>
								<p className="font-semibold text-gray-900">{shipment.acid}</p>
							</div>

							{/* Status */}
							<div>
								<p className="text-sm text-gray-500 mb-1">??????</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
										shipment.status
									)}`}
								>
									{shipment.status}
								</span>
							</div>

							{/* Port */}
							<div>
								<p className="text-sm text-gray-500 mb-1">???????</p>
								<p className="font-semibold text-gray-900">
									{shipment.port_name}
								</p>
							</div>

							{/* Country */}
							<div>
								<p className="text-sm text-gray-500 mb-1">??????</p>
								<p className="font-semibold text-gray-900">
									{shipment.country}
								</p>
							</div>

							{/* Number of Containers */}
							<div>
								<p className="text-sm text-gray-500 mb-1">??? ????????</p>
								<p className="font-semibold text-gray-900">
									{shipment.num_of_containers}
								</p>
							</div>

							{/* Container Types */}
							{shipment.type_of_containers &&
								shipment.type_of_containers.length > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">????? ????????</p>
										<p className="font-semibold text-gray-900">
											{shipment.type_of_containers.join(", ")}
										</p>
									</div>
								)}

							{/* Client Info */}
							{shipment.user_id && (
								<>
									<div>
										<p className="text-sm text-gray-500 mb-1">??? ??????</p>
										<p className="font-semibold text-gray-900">
											{shipment.user_id.username ||
												shipment.user_id.fullname ||
												"??? ?????"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500 mb-1">
											?????? ??????????
										</p>
										<p className="font-semibold text-gray-900">
											{shipment.user_id.email || "??? ?????"}
										</p>
									</div>
								</>
							)}

							{/* Assigned Employee */}
							<div>
								<p className="text-sm text-gray-500 mb-1">?????? ???????</p>
								<p className="font-semibold text-gray-900">
									{shipment.employee_id?.username ||
										shipment.employee_id?.fullname ||
										"?? ??? ?????"}
								</p>
							</div>

							{/* Created Date */}
							<div>
								<p className="text-sm text-gray-500 mb-1">????? ???????</p>
								<p className="font-semibold text-gray-900">
									{new Date(shipment.createdAt).toLocaleDateString("ar-EG")}
								</p>
							</div>
						</div>
					</div>

					{/* Financial Details */}
					{(shipment.clearance_fees ||
						shipment.expenses_and_tips ||
						shipment.sundries) && (
						<div className="mb-6">
							<h3 className="text-lg font-bold text-[#690000] mb-3">
								???????? ???????
							</h3>
							<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
								{shipment.clearance_fees > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">???? ???????</p>
										<p className="font-semibold text-gray-900">
											{shipment.clearance_fees} ????
										</p>
									</div>
								)}
								{shipment.expenses_and_tips > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">
											????????? ???????????
										</p>
										<p className="font-semibold text-gray-900">
											{shipment.expenses_and_tips} ????
										</p>
									</div>
								)}
								{shipment.sundries > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">?????? ??????</p>
										<p className="font-semibold text-gray-900">
											{shipment.sundries} ????
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Additional Info */}
					<div className="mb-6">
						<h3 className="text-lg font-bold text-[#690000] mb-3">
							??????? ??????
						</h3>
						<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
							{shipment.policy && (
								<div>
									<p className="text-sm text-gray-500 mb-1">????????</p>
									<p className="font-semibold text-gray-900">
										{shipment.policy}
									</p>
								</div>
							)}
							<div>
								<p className="text-sm text-gray-500 mb-1">???? ???????</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
										shipment.dragt
											? "bg-yellow-100 text-yellow-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{shipment.dragt ? "?????" : "??? ?????"}
								</span>
							</div>
						</div>
					</div>

					{/* Documents Section */}
					<div className="mb-6">
						<h3 className="text-lg font-bold text-[#690000] mb-3">?????????</h3>

						{/* Upload New Document */}
						<div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
							<h4 className="text-sm font-semibold text-[#690000] mb-3">
								??? ????? ????
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1 text-right">
										??? ???????
									</label>
									<input
										type="text"
										value={documentName}
										onChange={(e) => setDocumentName(e.target.value)}
										placeholder="????: ?????? ??????? ?????? ???? ???"
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent bg-white text-gray-800"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1 text-right">
										??? ???????
									</label>
									<input
										type="file"
										onChange={handleFileSelect}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent bg-white text-gray-800"
										accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
									/>
								</div>
							</div>
							{selectedFile && (
								<div className="mt-3 flex items-center justify-between">
									<button
										onClick={handleUploadDocument}
										disabled={uploadingDocument}
										className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#991b1b] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
									>
										{uploadingDocument ? "???? ?????..." : "??? ???????"}
									</button>
									<p className="text-sm text-gray-600">
										????? ???????: {selectedFile.name}
									</p>
								</div>
							)}
						</div>

						{/* Existing Documents List */}
						{shipment.requiredDocuments &&
						shipment.requiredDocuments.length > 0 ? (
							<div className="bg-gray-50 rounded-lg p-4">
								<h4 className="text-sm font-semibold text-gray-700 mb-3">
									????????? ???????? ({shipment.requiredDocuments.length})
								</h4>
								<div className="space-y-2">
									{shipment.requiredDocuments.map((doc, index) => (
										<div
											key={index}
											className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
										>
											<div className="flex items-center gap-3">
												<span
													className={`px-2 py-1 rounded text-xs font-semibold ${
														doc.uploaded
															? "bg-green-100 text-green-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{doc.uploaded ? "? ?????" : "? ????"}
												</span>
												{doc.uploaded && doc.fileId && (
													<button
														onClick={() =>
															handleDownloadDocument(doc.fileId, doc.name)
														}
														className="text-blue-600 hover:text-blue-800 text-sm underline"
													>
														?????
													</button>
												)}
											</div>
											<div className="text-right">
												<p className="font-semibold text-gray-900 text-sm">
													{doc.name}
												</p>
												{doc.uploadedAt && (
													<p className="text-xs text-gray-500">
														{new Date(doc.uploadedAt).toLocaleDateString(
															"ar-EG"
														)}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="bg-gray-50 rounded-lg p-6 text-center">
								<p className="text-gray-500">?? ???? ??????? ?????? ??? ????</p>
							</div>
						)}
					</div>

					{/* Edit Form */}
					{isEditing ? (
						<div className="border-t pt-6">
							<h3 className="text-lg font-bold text-[#690000] mb-4">
								????? ?????? ??????
							</h3>
							<div className="space-y-4">
								{/* Status */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										??????
									</label>
									<select
										name="status"
										value={formData.status}
										onChange={handleInputChange}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent bg-white text-gray-800"
									>
										<option value="Pending">??? ????????</option>
										<option value="?? ?????? ????????">
											?? ?????? ????????
										</option>
										<option value="In Transit">?? ??????</option>
										<option value="Arrived">????</option>
										<option value="?? ?????? ???? ?????">
											?? ?????? ???? ?????
										</option>
										<option value="Customs Clearance">??????? ???????</option>
										<option value="???? ??????? ???????">
											???? ??????? ???????
										</option>
										<option value="Completed">??????</option>
										<option value="??? ???????">??? ???????</option>
									</select>
								</div>

								{/* Assigned Employee */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										?????? ???????
									</label>
									<select
										name="employee_id"
										value={formData.employee_id}
										onChange={handleInputChange}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent bg-white text-gray-800"
									>
										<option value="">-- ?? ??? ????? --</option>
										{employees.map((emp) => (
											<option key={emp._id} value={emp._id}>
												{emp.fullname || emp.username} ({emp.email})
											</option>
										))}
									</select>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 justify-end">
									<button
										onClick={() => setIsEditing(false)}
										className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
									>
										?????
									</button>
									<button
										onClick={handleSave}
										className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#991b1b] transition-colors"
									>
										??? ?????????
									</button>
								</div>
							</div>
						</div>
					) : (
						<div className="flex justify-end">
							<button
								onClick={() => setIsEditing(true)}
								className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#991b1b] transition-colors"
							>
								????? ????????
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
