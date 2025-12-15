"use client";

import React from "react";
import { LayoutDashboard, Database } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  isHome: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigateHome, isHome }) => {

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-800">
          <Database className="w-6 h-6 text-primary-600 mr-2" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">EnvVault</span>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-1 px-3">
          <button
            onClick={onNavigateHome}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isHome
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Projects
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">{children}</main>
    </div>
  );
};


