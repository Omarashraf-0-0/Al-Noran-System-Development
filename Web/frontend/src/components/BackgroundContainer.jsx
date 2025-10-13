import React from "react";

const BackgroundContainer = ({
	children,
	backgroundImage = "/src/assets/images/background.png",
}) => {
	return (
		<div
			className="min-h-screen w-full bg-cover bg-center bg-no-repeat sm:bg-fixed overflow-x-hidden"
			style={{ backgroundImage: `url(${backgroundImage})` }}
		>
			{children}
		</div>
	);
};

export default BackgroundContainer;
