import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/outfit/800.css";
import App from "./App.tsx";
import "./index.css";

const TimeAwareTheme = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const applyThemeForLocalTime = () => {
      const hour = new Date().getHours();
      setTheme(hour >= 6 && hour < 18 ? "light" : "dark");
    };

    applyThemeForLocalTime();
    const timer = window.setInterval(applyThemeForLocalTime, 60_000);
    return () => window.clearInterval(timer);
  }, [setTheme]);

  return null;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("App root element was not found");
}

createRoot(rootElement).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <TimeAwareTheme />
    <App />
  </ThemeProvider>
);
