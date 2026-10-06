import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  BookOpen,
  History,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme, backendConnected } = useStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tutor', label: 'AI Tutor', icon: MessageSquareText },
    { to: '/documents', label: 'My Documents', icon: BookOpen },
    { to: '/sessions', label: 'Study Sessions', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r bg-card/60 backdrop-blur p-3 transition-all duration-300 md:flex ${
          collapsed ? 'w-[70px]' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className={`mb-6 flex h-10 items-center px-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-4.5" />
            </span>
            {!collapsed && (
              <span className="text-[15px]">
                StudyBuddy <span className="text-primary">AI</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className="size-4.5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Banner & Controls */}
        <div className="mt-auto flex flex-col gap-2 pt-3 border-t">
          {!collapsed && (
            <div className="rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                {backendConnected ? (
                  <>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">FastAPI & FAISS Online</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 text-amber-500" />
                    <span className="text-[11px] text-amber-600">Offline / Demo Mode</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-tight">
                {backendConnected
                  ? 'RAG vector index active. Real-time document reasoning.'
                  : 'Start backend with uvicorn for live AI retrieval.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`flex items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
                collapsed ? 'w-full justify-center' : ''
              }`}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {!collapsed && <span className="text-xs">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex items-center justify-center rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {collapsed ? <PanelLeft className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 flex-col bg-card p-4 shadow-xl z-50">
            <div className="flex items-center justify-between pb-4 border-b">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-semibold">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
                </span>
                <span>StudyBuddy AI</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5 mt-4 flex-1">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="size-4.5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t flex items-center justify-between">
              <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-muted-foreground">
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card/70 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 place-items-center rounded-lg border text-muted-foreground"
          >
            <Menu className="size-4" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
            <GraduationCap className="size-4 text-primary" />
            <span>StudyBuddy AI</span>
          </Link>
          <button onClick={toggleTheme} className="grid size-9 place-items-center rounded-lg border text-muted-foreground">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </header>

        {/* Page Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
