import React from 'react';

const Stepper = () => {
    const steps = [
        'جاري ادراج الشحنه',
        'في انتظار استلام الاذن',
        'تم وصول البضاعة',
        'في انتظار الشحن',
        'في انتظار رقم الـ ACID',
    ];
    const activeStepIndexLtr = 3; // The first "active" step in the original Left-to-Right sequence

    // For a Right-to-Left layout, we reverse the steps so the first step appears on the right.
    const rtlSteps = [...steps].reverse();
    // We also need to calculate the equivalent active index for our reversed array.
    const activeStepIndexRtl = (steps.length - 1) - activeStepIndexLtr;

    return (
        // Wrap the stepper in a container that allows horizontal scrolling on small screens.
        // This makes the component adaptable without changing its internal layout (e.g., text wrapping).
        <div className="w-full overflow-x-auto pb-4">
            {/* A minimum width ensures the stepper content doesn't shrink and maintains its intended layout. */}
            <div className="min-w-[600px] flex items-start justify-between py-4">
                {rtlSteps.map((label, index) => {
                    // In our reversed array, the active steps are at the beginning (indices 0, 1, etc.)
                    const isActive = index <= activeStepIndexRtl;
                    const isLastStep = index === rtlSteps.length - 1;

                    const circleClass = isActive ? 'bg-red-900' : 'bg-gray-300';
                    const textClass = isActive ? 'text-red-900 font-bold' : 'text-gray-400';
                    
                    // The line segment connects the current step to the next one (to the left).
                    // It should be active if it's between two active steps.
                    const isLineActive = index < activeStepIndexRtl;
                    
                    // In an RTL stepper starting from the right, there are only "active" and "future" states.
                    // The "completed" state (bg-rose-300) is not applicable here.
                    const lineClass = isLineActive ? 'bg-red-900' : 'bg-gray-300';

                    return (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center text-center flex-shrink-0 px-1">
                                <div className={`w-6 h-6 rounded-full transition-colors duration-500 ${circleClass}`} />
                                <p className={`mt-3 text-xs sm:text-sm whitespace-nowrap ${textClass}`}>{label}</p>
                            </div>
                            {!isLastStep && (
                                <div className={`flex-auto h-1.5 mt-[10px] transition-colors duration-500 ${lineClass}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;