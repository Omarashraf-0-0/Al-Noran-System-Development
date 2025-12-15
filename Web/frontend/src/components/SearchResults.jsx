import React from "react";
import { X, Search, FileText } from "lucide-react";

const SearchResults = ({ results, onClose, searchQuery }) => {
	if (!results) return null;

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
				<div className="bg-gradient-to-r from-red-900 to-red-800 p-6 flex justify-between items-center">
					<h2 className="text-white text-2xl font-bold">
						{searchQuery
							? `نتائج البحث عن: "${searchQuery}"`
							: "الشحنات الأخيرة"}
					</h2>
					<button
						onClick={onClose}
						className="text-white hover:bg-white/20 p-2 rounded-full transition"
					>
						<X size={24} />
					</button>
				</div>{" "}
				<div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]" dir="rtl">
					{results.length === 0 ? (
						<div className="text-center py-12">
							<Search size={48} className="mx-auto text-gray-400 mb-4" />
							<p className="text-gray-600 text-lg">لم يتم العثور على نتائج</p>
							<p className="text-gray-500 mt-2">
								جرب البحث برقم شحنة أو دولة أو حالة مختلفة
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{results.map((shipment) => (
								<div
									key={shipment._id}
									className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h3 className="text-lg font-bold text-gray-800">
												{shipment.acid || "N/A"}
											</h3>
											<p className="text-sm text-gray-600">
												{shipment.user_id?.fullname ||
													shipment.user_id?.username ||
													"Unknown Client"}
											</p>
										</div>
										<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
											{shipment.status}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-gray-500">الميناء:</span>
											<span className="font-semibold mr-2">
												{shipment.port_name}
											</span>
										</div>
										<div>
											<span className="text-gray-500">الدولة:</span>
											<span className="font-semibold mr-2">
												{shipment.country}
											</span>
										</div>
										<div>
											<span className="text-gray-500">عدد الحاويات:</span>
											<span className="font-semibold mr-2">
												{shipment.num_of_containers}
											</span>
										</div>
										{shipment.policy && (
											<div>
												<span className="text-gray-500">البوليصة:</span>
												<span className="font-semibold mr-2">
													{shipment.policy}
												</span>
											</div>
										)}
									</div>

									<div className="mt-4 flex justify-end">
										<a
											href={`/shipmentstatus/${shipment.acid}`}
											className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition flex items-center gap-2"
										>
											<span>عرض التفاصيل</span>
											<FileText size={16} />
										</a>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchResults;
