import React from "react";
import { t } from "../../constants/shipmentTranslations";
// import bannerImage from "../../assets/images/Untitled design (7) 1.png"; // Uncomment if illustration is needed

const ShipmentHero = ({ displayName, children }) => {
  return (
    <div className="relative mb-6 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden hover:shadow-[0_20px_40px_rgba(105,0,0,0.08)] transition-all duration-500 group transform hover:-translate-y-0.5">
            
        <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#690000] via-[#8B0000] to-[#1BA3B6]"></div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            
            {/* Right: Greeting (Compact) */}
            <div className="w-full lg:w-4/12 text-center lg:text-right flex flex-col items-center lg:items-start order-1 lg:order-1">
                <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {t.greeting}, <span className="text-[#690000]">{displayName}</span> 👋
                </h1>
                </div>
                <p className="text-gray-500 text-sm lg:text-base leading-relaxed opacity-90 lg:ml-auto max-w-sm mb-4">
                {t.subtitle}
                </p>
                {/* <img src={bannerImage} alt="Dashboard Illustration" className="w-32 lg:w-40 object-contain filter drop-shadow-md animate-float hidden md:block" /> */}
            </div>

            {/* Placeholder for Stats (rendered by parent or passed as children if flexible) 
                For this refactor, we will keep Hero just for Greeting and let Stats be separate 
                or pass children. The original layout had them side-by-side inside this card. 
                So let's accept children.
            */}
            {/* Actually, looking at the layout, the Stats are INSIDE this wrapper div. 
                So ShipmentHero should probably WRAP the stats or BE the wrapper.
                Let's make ShipmentHero render the container and take Stats as a prop component or children.
            */}
            {/* Render any children (like Stats) passed to this component */}
            {children}
        </div>
    </div>
  );
};
// Wait, the original code has Greeting AND Stats in one big flex container inside the card.
// To modularize, I can make `ShipmentHero` the Whole Card containing both Greeting and Stats.
// Or I can split them.
// Let's make `ShipmentHero` JUST the greeting part, and `ShipmentStats` the stats part.
// And `ClientShipments` will manage the layout container. 
// OR simpler: `ShipmentDashboardCard` that includes Hero and Stats. 
// Let's stick to `ShipmentHero` component representing the Greeting part, and `ShipmentStats` representing the Stats part.
// And in `ClientShipments.jsx`, I will wrap them in the Card Container.

export default ShipmentHero;
