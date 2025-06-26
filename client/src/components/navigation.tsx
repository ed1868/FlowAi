import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { href: "/timer", label: "Timer", icon: "fas fa-clock" },
    { href: "/journal", label: "Journal", icon: "fas fa-pen-fancy" },
    { href: "/voice-notes", label: "Voice Notes", icon: "fas fa-microphone" },
    { href: "/habits", label: "Habits", icon: "fas fa-chart-line" },
    { href: "/analytics", label: "Analytics", icon: "fas fa-analytics" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-white text-sm"></i>
              </div>
              <span className="text-xl font-semibold gradient-text">Flow</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    isActive(item.href)
                      ? "bg-apple-blue/20 text-apple-blue"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/10"
                  }`}
                >
                  <i className={`${item.icon} mr-2 text-sm`}></i>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden glass-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
            </Button>
            
            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center overflow-hidden">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-white text-sm"></i>
                )}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-text-primary">
                  {user?.firstName || user?.email || "User"}
                </div>
                <div className="text-xs text-text-tertiary">
                  {user?.email}
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-text-secondary hover:text-apple-red"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-glass">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start px-4 py-3 rounded-xl transition-colors ${
                      isActive(item.href)
                        ? "bg-apple-blue/20 text-apple-blue"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/10"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={`${item.icon} mr-3 text-sm`}></i>
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
