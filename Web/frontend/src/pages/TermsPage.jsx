import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import AuthNavbar from "../components/AuthNavbar";
import Footer from "../components/Footer";
import { Scale, ShieldCheck, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

const TermsPage = () => {
    const { isDarkMode } = useTheme();
    const [activeSection, setActiveSection] = useState("introduction");

    const sections = [
        { id: "eligibility", title: "1. الأهلية والتمثيل القانوني", icon: ShieldCheck },
        { id: "accuracy", title: "2. دقة البيانات والمستندات", icon: FileText },
        { id: "fees", title: "3. الرسوم والضرائب والأمانات", icon: Scale },
        { id: "delays", title: "4. إخلاء المسؤولية عن التأخير", icon: AlertCircle },
        { id: "confidentiality", title: "5. سرية المعلومات والأرشفة", icon: ShieldCheck },
        { id: "law", title: "6. القانون الواجب التطبيق", icon: Scale },
        { id: "inspections", title: "7. العروض الرقابية", icon: AlertCircle },
        { id: "payment", title: "8. تسوية الفواتير", icon: CheckCircle2 },
    ];

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505] text-gray-200" : "bg-gray-50 text-gray-800"}`}>
            <AuthNavbar />

            {/* Hero Section */}
            <div className={`relative py-32 overflow-hidden ${isDarkMode ? "bg-[#1a0505]" : "bg-gradient-to-br from-red-50 to-white"}`}>
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-500/5 to-transparent"></div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 mb-6 backdrop-blur-sm border border-red-500/10 shadow-xl">
                        <Scale className={`w-12 h-12 ${isDarkMode ? "text-red-500" : "text-red-600"}`} />
                    </div>
                    <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        الشروط <span className="text-red-600">والأحكام</span>
                    </h1>
                    <p className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Terms and Conditions - Al-Nouran for Export & Customs Clearance
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block w-1/4 sticky top-32 h-fit">
                        <div className={`p-6 rounded-3xl ${isDarkMode ? "bg-[#1a1010]/80 border border-white/5" : "bg-white shadow-lg shadow-red-900/5 border border-red-100"}`}>
                            <h3 className={`text-xl font-bold mb-6 px-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>جدول المحتويات</h3>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-right ${
                                            activeSection === section.id 
                                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                                                : isDarkMode 
                                                    ? "text-gray-400 hover:bg-white/5 hover:text-white" 
                                                    : "text-gray-600 hover:bg-red-50 hover:text-red-700"
                                        }`}
                                    >
                                        <section.icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="truncate">{section.title}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-8">
                        
                        {/* 1. Eligibility */}
                        <section id="eligibility" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    1. الأهلية والتمثيل القانوني
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Eligibility & Legal Representation</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> يقر العميل بأن شركة النوران هي المفوض لإتمام الإجراءات الجمركية بناءً على البيانات المقدمة، وتظل المسؤولية القانونية النهائية عن "طبيعة البضاعة" على عاتق العميل.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> The Client acknowledges that Al-Nouran is the authorized representative for customs formalities based on provided data. The ultimate legal responsibility for the "nature of goods" remains solely with the Client.
                                </p>
                            </div>
                        </section>

                        {/* 2. Accuracy */}
                        <section id="accuracy" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    2. دقة البيانات والمستندات
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Accuracy of Data & Documents</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> العميل مسؤول مسؤولية كاملة عن دقة وصحة جميع البيانات المدخلة (الفواتير، الأوزان، أكواد التعريفة HS Codes). أي غرامات تنتج عن بيانات خاطئة يتحملها العميل بالكامل.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> The Client is fully responsible for the accuracy and authenticity of all entered data (Invoices, Weights, HS Codes). Any fines resulting from incorrect data shall be borne entirely by the Client.
                                </p>
                            </div>
                        </section>

                        {/* 3. Fees */}
                        <section id="fees" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <Scale className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    3. الرسوم والضرائب والأمانات
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Duties, Taxes & Deposits</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> لا تلتزم شركة النوران بسداد أي رسوم جمركية أو ضرائب نيابة عن العميل إلا بعد استلام المبالغ مسبقاً كأمانات جمركية.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> Al-Nouran is not obligated to pay any customs duties or taxes on behalf of the Client unless the amounts are received in advance as customs deposits.
                                </p>
                            </div>
                        </section>

                        {/* 4. Delays */}
                        <section id="delays" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    4. إخلاء المسؤولية عن التأخير
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Disclaimer of Delays</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> شركة النوران غير مسؤولة عن التأخير الناتج عن أعطال الأنظمة الحكومية، أو إجراءات الفحص الرقابي، أو أي ظروف قهرية خارجة عن إرادتنا.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> Al-Nouran shall not be held liable for delays caused by government system outages, regulatory inspections, or any force majeure events beyond our control.
                                </p>
                            </div>
                        </section>

                        {/* 5. Confidentiality */}
                        <section id="confidentiality" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    5. سرية المعلومات والأرشفة
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Confidentiality & Archiving</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> نلتزم بحماية بياناتكم التجارية وحفظ السجلات الرقمية وفقاً للمدد القانونية المنصوص عليها في قانون الجمارك.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> We commit to protecting your trade data and maintaining digital records in accordance with the legal retention periods prescribed by Customs Law.
                                </p>
                            </div>
                        </section>

                        {/* 6. Law */}
                        <section id="law" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <Scale className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    6. القانون الواجب التطبيق
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Governing Law</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> تخضع هذه الشروط وتفسر وفقاً للقوانين المحلية المنظمة للتجارة الخارجية والجمارك في [جمهورية مصر العربية].
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> These terms shall be governed by and construed in accordance with the local laws regulating foreign trade and customs in [EGYPT].
                                </p>
                            </div>
                        </section>

                        {/* 7. Inspections */}
                        <section id="inspections" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    7. العروض الرقابية والمصاريف الإضافية
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Regulatory Inspections & Additional Charges</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> يقر العميل بعلمه أن بعض الشحنات قد تخضع لـ "عروض رقابية" إجبارية بناءً على طبيعة البضاعة وصنفها (مثل العرض على الصحة، الزراعة، الهيئة العامة للرقابة على الصادرات والواردات، وغيرها). وفي هذه الحالة، يلتزم العميل بتحمل كافة التكاليف الناتجة عن هذه العروض، بما في ذلك الرسوم الحكومية، ومصاريف النقل أو السحب، بالإضافة إلى أتعاب المندوب المنوط به إنهاء العرض أمام الجهات الرقابية (والتي قد تشمل مصاريف إدارية أو نثرية رمزية لتسيير الإجراءات).
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> The Client acknowledges that certain shipments may be subject to mandatory "Regulatory Inspections" based on the nature of the goods (e.g., Health, Agriculture, GOEIC, etc.). In such cases, the Client is committed to bearing all resulting costs, including government fees, haulage, and service fees for the representative assigned to clear the inspection (including nominal administrative or incidental expenses required to facilitate the process before the authorities).
                                </p>
                            </div>
                        </section>

                        {/* 8. Payment */}
                        <section id="payment" className={`p-8 rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#1a1010] border border-white/5 hover:border-red-500/20" : "bg-white shadow-xl shadow-red-900/5 hover:shadow-red-800/10 border border-transparent"}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"}`}>
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    8. تسوية الفواتير والتحصيل المالي
                                    <span className="block text-lg font-normal text-gray-500 mt-1">Invoicing & Payment Settlement</span>
                                </h2>
                            </div>
                            <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <p dir="rtl">
                                    <strong>العربية:</strong> يلتزم العميل بسداد قيمة "بيان التكاليف التفصيلي" الصادر عن شركة النوران (والذي يتضمن كافة الرسوم الجمركية، الضرائب، والمصاريف الإدارية المدفوعة مخصوماً منها أي دفعات مقدمة) في موعد أقصاه 45 يوماً من تاريخ إصدار الفاتورة. وفي حالة التأخر عن السداد في الموعد المحدد، يحق لشركة النوران اتخاذ كافة الإجراءات القانونية اللازمة لضمان تحصيل مستحقاتها، مع تحميل العميل كافة المصاريف القضائية والتعويضات الناتجة عن التأخير.
                                </p>
                                <p dir="ltr" className="font-sans">
                                    <strong>English:</strong> The Client is obligated to settle the "Detailed Statement of Costs" (Invoicing) issued by Al-Nouran—which includes all customs duties, taxes, and administrative expenses, minus any advance payments—within a maximum of 45 days from the invoice issuance date. In the event of late payment, Al-Nouran reserves the right to pursue all necessary legal actions to recover its dues, and the Client shall be liable for all associated legal fees and damages resulting from the delay.
                                </p>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/register" className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 text-center">
                                        موافق وأريد التسجيل
                                    </Link>
                                    <Link to="/" className={`px-8 py-3 rounded-xl font-bold transition border ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-700"} text-center`}>
                                        العودة للرئيسية
                                    </Link>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TermsPage;
