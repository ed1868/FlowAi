import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Clock, 
  PenTool, 
  Mic, 
  TrendingUp, 
  Zap, 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  CreditCard
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/timer", label: "Timer", icon: Clock },
    { href: "/journal", label: "Journal", icon: PenTool },
    { href: "/voice-notes", label: "Voice Notes", icon: Mic },
    { href: "/habits", label: "Habits", icon: TrendingUp },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/payment-methods", label: "Payment", icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={14} />
              </div>
              <span className="text-lg sm:text-xl font-semibold gradient-text">Flow</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      isActive(item.href)
                        ? "bg-apple-blue/20 text-apple-blue"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/10"
                    }`}
                  >
                    <IconComponent size={16} className="mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
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
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
            
            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center overflow-hidden">
                {user && typeof user === 'object' && 'profileImageUrl' in user && user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl as string}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-white" size={16} />
                )}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-text-primary">
                  {user && typeof user === 'object' && 'firstName' in user && user.firstName ? 
                    `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 
                    (user && typeof user === 'object' && 'email' in user && user.email ? 
                      user.email.split('@')[0] : 'User')
                  }
                </div>
                <div className="text-xs text-text-tertiary">
                  {user && typeof user === 'object' && 'email' in user && user.email ? 
                    user.email : "Authenticated"}
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { 
                    method: 'POST',
                    credentials: 'include' 
                  });
                  // Force a full page reload to clear all cached state
                  window.location.reload();
                } catch (error) {
                  console.error('Logout failed:', error);
                  // Force reload even if logout fails
                  window.location.reload();
                }
              }}
              className="text-text-secondary hover:text-apple-red"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-glass">
            {/* User Info in Mobile */}
            <div className="flex items-center space-x-3 mb-4 px-4 py-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center overflow-hidden">
                {user && typeof user === 'object' && 'profileImageUrl' in user && user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl as string}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-white" size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">
                  {user && typeof user === 'object' && 'firstName' in user && user.firstName ? 
                    `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 
                    (user && typeof user === 'object' && 'email' in user && user.email ? 
                      user.email.split('@')[0] : 'User')
                  }
                </div>
                <div className="text-xs text-text-tertiary">
                  {user && typeof user === 'object' && 'email' in user && user.email ? 
                    user.email : "Authenticated"}
                </div>
              </div>
            </div>
            
            {/* Navigation Items */}
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
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
                      <IconComponent size={16} className="mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Logout Button in Mobile */}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-3 rounded-xl text-apple-red hover:bg-apple-red/10"
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { 
                      method: 'POST',
                      credentials: 'include' 
                    });
                    // Force a full page reload to clear all cached state
                    window.location.reload();
                  } catch (error) {
                    console.error('Logout failed:', error);
                    // Force reload even if logout fails
                    window.location.reload();
                  }
                }}
              >
                <LogOut size={16} className="mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
