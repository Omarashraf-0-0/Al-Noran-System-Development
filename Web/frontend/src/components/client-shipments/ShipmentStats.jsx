import React from "react";
import { 
  Package, 
  TrendingUp,
  Clock, 
  CheckCircle2, 
} from "lucide-react";
import { t } from "../../constants/shipmentTranslations";

const DashboardStat = ({ label, value, icon, color, bg, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl border border-gray-100 ${bg} bg-opacity-50 transition-all hover:scale-105 w-full text-right group hover:bg-white hover:shadow-md cursor-pointer`}
  >
     <div className={`p-3 rounded-xl bg-white shadow-sm transition-colors ${color}`}>
       {React.cloneElement(icon, { className: "w-6 h-6" })}
     </div>
     <div>
       <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
       <p className="text-xs text-gray-500 font-medium group-hover:text-[#690000]/80 transition-colors">{label}</p>
     </div>
  </button>
);

export const SkeletonStat = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white/50 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
    <div className="flex-1 space-y-2">
      <div className="h-6 w-12 bg-gray-200 rounded"></div>
      <div className="h-3 w-20 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ShipmentStats = ({ stats, loading, setSelectedStatus }) => {
  return (
      <div className="w-full lg:flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 order-2 lg:order-2 self-stretch items-center">
        {loading ? (
            <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
            </>
        ) : (
            <>
            <DashboardStat label={t.labels.total} value={stats.total} icon={<Package />} color="text-[#690000]" bg="bg-red-50" onClick={() => setSelectedStatus("All")} />
            <DashboardStat label={t.status.active} value={stats.active} icon={<TrendingUp />} color="text-blue-600" bg="bg-blue-50" onClick={() => setSelectedStatus("Active")} />
            <DashboardStat label={t.status.pending} value={stats.pending} icon={<Clock />} color="text-amber-600" bg="bg-amber-50" onClick={() => setSelectedStatus("Pending")} />
            <DashboardStat label={t.status.completed} value={stats.completed} icon={<CheckCircle2 />} color="text-green-600" bg="bg-green-50" onClick={() => setSelectedStatus("Completed")} />
            </>
        )}
      </div>
  );
};

export default ShipmentStats;
