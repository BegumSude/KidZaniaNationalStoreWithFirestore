import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#AB0033",
                    hover: "#8B0029",
                    light: "#FFF0F3",
                },
                secondary: {
                    DEFAULT: "#F18B22",
                    hover: "#E07A10",
                    light: "#FFF8F0",
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 2px 8px 0 rgba(0,0,0,0.06), 0 0 1px 0 rgba(0,0,0,0.06)',
                'card-hover': '0 8px 24px 0 rgba(171,0,51,0.12), 0 0 1px 0 rgba(0,0,0,0.08)',
            },
        },
    },
    plugins: [],
};
export default config;
