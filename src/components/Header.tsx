/**
 * ChronoCraft - Header Navigation Component
 * Responsive header with desktop breadcrumbs and mobile view switcher dropdown.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
  Sliders,
  Calendar,
  CheckCircle2,
  Bookmark,
  FileText,
  CalendarDays,
  Flame,
  FolderKanban,
  Check,
} from 'lucide-react';
import { ActiveView, AppSettings } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  settings: AppSettings;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  activeTaskCount: number;
  completedTodayCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  settings,
  onToggleTheme,
  onOpenSettings,
  activeTaskCount,
  completedTodayCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const viewOptions: Array<{ id: ActiveView; label: string; icon: React.ReactNode }> = [
    { id: 'focus', label: 'Focus', icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" /> },
    { id: 'timeline', label: 'Timeline', icon: <Bookmark className="w-4 h-4 text-cyan-400" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { id: 'events', label: 'Events', icon: <CalendarDays className="w-4 h-4 text-rose-400" /> },
    { id: 'habits', label: 'Habits', icon: <Flame className="w-4 h-4 text-orange-400" /> },
    { id: 'lists', label: 'Lists', icon: <FolderKanban className="w-4 h-4 text-emerald-400" /> },
  ];

  const currentOption = viewOptions.find((v) => v.id === activeView) || viewOptions[0];

  // Today formatted string
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Zone 1: Brand & Desktop Breadcrumbs / Mobile View Switcher */}
      <div className="flex items-center gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">
            ChronoCraft
          </span>
        </div>

        {/* Separator on Desktop */}
        <div className="hidden md:flex items-center text-slate-300 dark:text-slate-700">/</div>

        {/* Desktop Breadcrumb indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {currentOption.icon}
          <span>{currentOption.label} View</span>
        </div>

        {/* Mobile View Switcher Button with Dropdown */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {currentOption.icon}
            <span>{currentOption.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Switch Workspace View
                </div>
                {viewOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectView(opt.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                      activeView === opt.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {activeView === opt.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Date & Executive Progress Overview */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="tabular-nums font-sans font-medium text-slate-700 dark:text-slate-300">
            {todayFormatted}
          </span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Active: <strong className="tabular-nums text-slate-900 dark:text-slate-100">{activeTaskCount}</strong>/{settings.xActiveLimit}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Done Today: <strong className="tabular-nums text-slate-900 dark:text-slate-100">{completedTodayCount}</strong></span>
        </div>
      </div>

      {/* Zone 3: Actions (Theme Toggle & Settings) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Workspace Settings & Database"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
