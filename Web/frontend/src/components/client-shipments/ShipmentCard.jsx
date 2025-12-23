import React from "react";
import { Ship, FileText, MapPin, ArrowRight, Package } from "lucide-react";
import { t } from "../../constants/shipmentTranslations";
import { mapStatus, mapType, getStatusTheme } from "../../utils/shipmentHelpers";

export const SkeletonCard = () => (
   <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm animate-pulse h-[140px] flex flex-col justify-between">
      <div className="flex items-center gap-4">
         <div className="w-14 h-14 rounded-2xl bg-gray-200"></div>
         <div className="flex-1 space-y-3">
            <div className="h-5 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
         </div>
      </div>
      <div className="flex justify-between items-center mt-4 border-t border-gray-50 pt-3">
         <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
         <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
   </div>
);

export const EmptyState = () => (
    <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-300 shadow-sm">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{t.noResultsTitle}</h3>
        <p className="text-gray-500 text-sm">{t.noResultsDesc}</p>
    </div>
);

const ShipmentCard = ({ shipment }) => {
    const theme = getStatusTheme(String(shipment.status).toLowerCase());

    return (
        <a href={`/shipmentstatus/${shipment.acid}`} className="group relative bg-white rounded-[1.5rem] p-1 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block border border-gray-200/60">
            {/* Holographic Border Gradient on Hover */}
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-[#690000] via-[#1BA3B6] to-[#690000] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] -z-10"></div>
            
            <div className="bg-white rounded-[1.3rem] p-6 h-full relative overflow-hidden group-hover:bg-gradient-to-br from-white to-gray-50 transition-colors">
                
                {/* Visual Status Indicator Strip */}
                <div className={`absolute top-0 right-8 w-1.5 h-16 ${theme.bg} rounded-b-full shadow-sm`}></div>

                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between relative z-10">
                    
                    {/* Left: Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#690000] group-hover:bg-[#690000] group-hover:text-white transition-colors duration-300 shadow-inner">
                                <Ship className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#690000] transition-colors">{shipment.code}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{mapType(shipment.type)}</span>
                                    <span>•</span>
                                    <span>{shipment.dateStr}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 pl-2 border-l-2 border-gray-100 ml-4">
                             <div className="flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-gray-400" />
                                 <span className="font-medium text-gray-900">{shipment.bl}</span>
                                 <span className="text-xs text-gray-400">{t.labels.bl}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <MapPin className="w-4 h-4 text-gray-400" />
                                 <span className="font-medium text-gray-900">{shipment.port}</span>
                             </div>
                        </div>
                    </div>

                    {/* Right: Status & CTA */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:min-w-[150px]">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${theme.border} bg-opacity-20 ${theme.light} ${theme.text}`}>
                            {mapStatus(shipment.status)}
                        </div>
                        
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-[#690000] group-hover:border-[#690000] group-hover:text-white transition-all duration-300 transform group-hover:rotate-45">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </a>
    );
};

export default ShipmentCard;
