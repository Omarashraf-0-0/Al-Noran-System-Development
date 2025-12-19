import React from 'react';

const Stepper = ({ currentStatus, subStatus }) => {
    // 10 steps matching the 10 statuses (in order from start to end)
    const steps = [
        'في انتظار الشحن',
        'في الطريق',
        'تم وصول البضاعة',
        'في انتظار وصول الإذن',
        'تم وصول الإذن',
        'التخليص الجمركي',
        'جارى ادراج الشحنة واستكمال الاجراءات',
        'جاري الكشف والتثمين',
        'مكتملة',
        'تمت بنجاح',
    ];

    // Define status progression order (all Arabic - from earliest to latest)
    const statusProgression = [
        'في انتظار الشحن',
        'في الطريق',
        'تم وصول البضاعة',
        'في انتظار وصول الإذن',
        'تم وصول الإذن',
        'التخليص الجمركي',
        'جارى ادراج الشحنة واستكمال الاجراءات',
        'جاري الكشف والتثمين',
        'مكتملة',
        'تمت بنجاح',
    ];

    // Get the index of current status in the progression
    const currentStatusIndex = statusProgression.indexOf(currentStatus);
    const activeStepIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

    // Function to get display label (just return the label as-is)
    const getDisplayLabel = (label, index) => {
        return label;
    };

    return (
        <div className="w-full pb-4">
            <div className="flex items-start justify-between py-6 px-2">
                {steps.map((label, index) => {
                    // Active from left to right (RTL): all steps up to and including activeStepIndex
                    const isActive = index <= activeStepIndex;
                    const isLastStep = index === steps.length - 1;
                    const isCurrent = index === activeStepIndex;

                    const circleClass = isActive ? 'bg-red-900' : 'bg-gray-300';
                    const textClass = isActive ? 'text-red-900 font-bold' : 'text-gray-400';

                    // Line is active only if the NEXT step is also active (line connects to next circle on the left)
                    const nextStepIsActive = index < steps.length - 1 && (index + 1) <= activeStepIndex;
                    const lineClass = nextStepIsActive ? 'bg-red-900' : 'bg-gray-300';

                    const displayLabel = getDisplayLabel(label, index);

                    return (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center text-center flex-1">
                                <div className={`w-7 h-7 rounded-full transition-colors duration-500 ${circleClass} relative z-10`} />
                                <p
                                    className={`mt-3 text-xs ${textClass} px-1 ${isCurrent && subStatus ? 'max-w-[120px]' : 'max-w-[90px]'}`}
                                    style={{ lineHeight: '1.2' }}
                                >
                                    {displayLabel}
                                </p>
                            </div>
                            {!isLastStep && (
                                <div
                                    className={`h-1.5 transition-colors duration-500 ${lineClass} self-start`}
                                    style={{ width: '100%', maxWidth: '80px', marginTop: '14px', flexShrink: 1 }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;
