import { t } from "../constants/shipmentTranslations";

export const mapStatus = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("pending") || s.includes("انتظار")) return t.status.pending;
  if (s.includes("active") || s.includes("نشطة")) return t.status.active;
  if (s.includes("transit")) return t.status.transit;
  if (s.includes("completed") || s.includes("مكتملة")) return t.status.completed;
  return s; // Fallback to original if no match
};

export const mapType = (type) => {
  const s = (type || "").toLowerCase();
  return t.types[s] || s;
};

export const getStatusCategory = (status) => {
  const s = String(status).toLowerCase();
  if (s.includes("completed") || s.includes("تمت") || s.includes("مكتمل")) return "Completed";
  if (s.includes("pending") || s.includes("انتظار")) return "Pending";
  return "Active";
};

export const getStatusTheme = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes("pending") || s.includes("انتظار")) return { color: "amber", border: "border-amber-500", bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50" };
    if (s.includes("active") || s.includes("نشطة") || s.includes("transit") || s.includes("طريق")) return { color: "blue", border: "border-blue-500", bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50" };
    if (s.includes("completed") || s.includes("مكتملة")) return { color: "green", border: "border-green-500", bg: "bg-green-500", text: "text-green-700", light: "bg-green-50" };
    return { color: "gray", border: "border-[#690000]", bg: "bg-[#690000]", text: "text-[#690000]", light: "bg-gray-100" };
};
