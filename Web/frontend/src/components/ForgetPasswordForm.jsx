import React from "react";
import InputField from "./InputField";
import Spacer from "./Spacer";
import Button from "./Button";
import { Link } from "react-router";

const ForgetPasswordForm = ( {onSubmit} ) => {
    const [formData , setFormData] = React.useState({
        email: ""
    });
    const handleInputChange = (field) => (e) => {
        setFormData((prev) => ({
            ...prev,
          [field]: e.target.value,
        }));
      };
      const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        }
    };

  return (
    <>
        <div className="w-full">
            <Spacer size="md" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-[#690000]">
                نسيت كلمة المرور
            </h2>
            <Spacer size="xl" />
            <form className="w-full" onSubmit={handleSubmit}>
                <InputField
                    id="email"
                    type="email"
                    label="البريد الألكترونى"
                    placeholder="ادخل البريد الألكترونى"
                    value = {formData.email}
                    onChange={handleInputChange("email")}
                    required
                    />
                    <Spacer size = "sm" />
                    <div className="flex items-center justify-center w-full">
					<Button type="submit" size="full">
                        إرسال
					</Button>
				</div>
            </form>
            <Spacer size="md" />
            <div className="text-center">
                <Link to="/login" className="text-sm sm:text-base text-[#690000] hover:underline">

                    العودة لتسجيل الدخول
                </Link>
            </div>
        </div>
                    
    </>
  )
}

export default ForgetPasswordForm