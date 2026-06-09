import React from "react";
import { ChevronLeft } from "lucide-react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

export const Header = ({ navigate, t, language, setLanguage }) => (
  <header className="relative w-full py-4 lg:py-6 bg-neutral-900 border-b border-emerald-500/20 shadow-lg z-20 flex items-center justify-between px-4 lg:px-12">
    <div className="flex-1 flex justify-start">
      <button onClick={() => navigate("/")} className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors duration-300">
        <ChevronLeft size={24} />
        <span className="hidden md:inline font-semibold">Hub</span>
      </button>
    </div>
    <h1 className="flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] text-center">
      {t.graphTitle}
    </h1>
    <div className="flex-1 flex justify-end items-center gap-3">
            <ThemeToggle />
            <div className="flex gap-1 bg-neutral-900/50 p-1 rounded-lg border border-emerald-500/20 shadow-lg backdrop-blur-sm hidden sm:flex">
        <button onClick={() => setLanguage("ua")} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === "ua" ? "bg-emerald-600 shadow text-white" : "text-emerald-200 hover:bg-emerald-800"}`}>UA</button>
        <button onClick={() => setLanguage("en")} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === "en" ? "bg-emerald-600 shadow text-white" : "text-emerald-200 hover:bg-emerald-800"}`}>EN</button>
      </div>
    </div>
  </header>
);
