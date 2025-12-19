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
			<div className="min-h-screen w-full bg-gradient-to-t from-black/80 via-black/40 to-black/30 flex flex-col">
				{children}
			</div>
		</div>
	);
};

export default BackgroundContainer;
