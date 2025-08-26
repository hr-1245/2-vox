"use client";

import { useTheme } from "next-themes";

interface ThemeLogoProps {
    className?: string;
}

export const ThemeLogo = ({ className = "" }: ThemeLogoProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <h1
            className={`text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${className}`}
        >VOX    </h1>
    );
};