import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	// Initialize theme from localStorage or default to false (light mode)
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const storedTheme = localStorage.getItem("isDarkMode");
		return storedTheme ? JSON.parse(storedTheme) : false;
	});

	// Update localStorage whenever theme changes
	useEffect(() => {
		localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
		
		// Optional: Add/Remove class to body for global styles if needed
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [isDarkMode]);

	const toggleTheme = () => {
		setIsDarkMode((prevMode) => !prevMode);
	};

	return (
		<ThemeContext.Provider value={{ isDarkMode, toggleTheme, setIsDarkMode }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

export default ThemeContext;
