import React, { useRef, useState, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown, Calendar, Clock, Layers } from "lucide-react";
import { t } from "../../constants/shipmentTranslations";

const FilterTab = ({ label, active, onClick, dotColor }) => (
  <button 
    onClick={onClick}
    className={`
      px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap
      ${active 
        ? "bg-[#690000] text-white shadow-lg shadow-red-900/20" 
        : "text-gray-600 hover:bg-white hover:shadow-sm"}
    `}
  >
    {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor} ${active ? 'ring-2 ring-white/40' : ''}`}></span>}
    {label}
  </button>
);

const ShipmentFilters = ({ 
    selectedStatus, 
    setSelectedStatus, 
    searchTerm, 
    setSearchTerm, 
    sortOption, 
    setSortOption 
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const sortLabel = {
    newest: "الأحدث أولاً",
    oldest: "الأقدم أولاً",
    last_updated: "آخر تحديث",
    status: "حسب الحالة",
    clientAZ: "اسم العميل (أ-ي)",
    clientZA: "اسم العميل (ي-أ)"
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-24 z-40 bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4 mb-8 transition-all duration-300">
        <div className="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <div className="flex p-1 bg-gray-100/50 rounded-xl min-w-max gap-1">
                <FilterTab label={t.status.all} active={selectedStatus === "All"} onClick={() => setSelectedStatus("All")} />
                <FilterTab label={t.status.active} active={selectedStatus === "Active"} onClick={() => setSelectedStatus("Active")} dotColor="bg-blue-500" />
                <FilterTab label={t.status.pending} active={selectedStatus === "Pending"} onClick={() => setSelectedStatus("Pending")} dotColor="bg-amber-500" />
                <FilterTab label={t.status.completed} active={selectedStatus === "Completed"} onClick={() => setSelectedStatus("Completed")} dotColor="bg-green-500" />
            </div>
        </div>

        <div className="flex flex-1 items-center gap-3 w-full justify-end">
            <div className="relative flex-1 max-w-md group">
                <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5 group-hover:text-[#690000] transition-colors" />
                <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 focus:bg-white focus:ring-2 focus:ring-[#690000]/10 focus:border-[#690000] outline-none transition-all text-sm font-medium"
                />
            </div>

            <div className="relative" ref={sortRef}>
                <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
                >
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <span>{sortLabel[sortOption]}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isSortOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {[
                        { id: "newest", label: sortLabel.newest, icon: Calendar },
                        { id: "oldest", label: sortLabel.oldest, icon: Calendar },
                        { id: "last_updated", label: sortLabel.last_updated, icon: Clock },
                        { id: "status", label: sortLabel.status, icon: Layers },
                        { id: "clientAZ", label: sortLabel.clientAZ, icon: Layers },
                        { id: "clientZA", label: sortLabel.clientZA, icon: Layers },
                        ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => { setSortOption(opt.id); setIsSortOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${sortOption === opt.id ? "bg-red-50 text-[#690000] font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                        </button>
                        ))}
                    </div>
                </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ShipmentFilters;
