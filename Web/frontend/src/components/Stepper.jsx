import React from 'react';

const Stepper = ({ currentStatus }) => {
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

    // Define status progression order (from earliest to latest)
    const statusProgression = [
        'في انتظار الشحن',             // في انتظار الشحن
        'In Transit',                   // في الطريق
        'Arrived',                      // تم وصول البضاعة
        'في انتظار وصول الإذن',        // في انتظار وصول الإذن
        'تم وصول الإذن',              // تم وصول الإذن
        'Customs Clearance',            // التخليص الجمركي
        'جارى ادراج الشحنة واستكمال الاجراءات', // جارى ادراج الشحنة واستكمال الاجراءات
        'جاري الكشف والتثمين',         // جاري الكشف والتثمين
        'Completed',                    // مكتملة
        'تمت بنجاح',                   // تمت بنجاح
    ];

    // Get the index of current status in the progression
    const currentStatusIndex = statusProgression.indexOf(currentStatus);
    const activeStepIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

    return (
        <div className="w-full pb-4">
            <div className="flex items-start justify-between py-6 px-2">
                {steps.map((label, index) => {
                    // Active from left to right (RTL): all steps up to and including activeStepIndex
                    const isActive = index <= activeStepIndex;
                    const isLastStep = index === steps.length - 1;

                    const circleClass = isActive ? 'bg-red-900' : 'bg-gray-300';
                    const textClass = isActive ? 'text-red-900 font-bold' : 'text-gray-400';

                    // Line is active only if the NEXT step is also active (line connects to next circle on the left)
                    const nextStepIsActive = index < steps.length - 1 && (index + 1) <= activeStepIndex;
                    const lineClass = nextStepIsActive ? 'bg-red-900' : 'bg-gray-300';

                    return (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center text-center flex-1">
                                <div className={`w-7 h-7 rounded-full transition-colors duration-500 ${circleClass} relative z-10`} />
                                <p className={`mt-3 text-xs ${textClass} px-1 max-w-[90px]`} style={{ lineHeight: '1.2' }}>{label}</p>
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