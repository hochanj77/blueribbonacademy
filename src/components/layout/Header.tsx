import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Settings, LogOut, LayoutDashboard, ChevronRight } from "lucide-react";
import blueRibbonLogo from "@/assets/blue-ribbon-logo.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Programs", href: "/courses" },
  { label: "Schedule", href: "/schedule" },
  { label: "Social", href: "/social" },
  { label: "SAT Platform", href: "https://blueribbon.ditoed.com", external: true, authRequired: true },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isStudent, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/portal');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "py-2 md:py-3 bg-background/80 backdrop-blur-xl shadow-lg shadow-primary/5 border-b border-border/50"
          : "py-4 md:py-5 bg-background/95 backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <img
              src={blueRibbonLogo}
              alt="Blue Ribbon Academy"
              className={cn(
                "w-auto transition-all duration-500 group-hover:scale-105",
                isScrolled ? "h-10 md:h-12" : "h-12 md:h-14"
              )}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1.5">
              {navItems.filter(item => !item.authRequired || user).map((item) => {
                const isActive = location.pathname === item.href;
                return item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full text-foreground/70 hover:text-foreground hover:bg-background/80"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-foreground/70 hover:text-foreground hover:bg-background/80"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="default" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
            {user && isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="default" className="gap-2 rounded-full border-primary/20 hover:border-primary/50">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            {user && isStudent && !isAdmin && (
              <Link to="/dashboard">
                <Button variant="outline" size="default" className="gap-2 rounded-full border-primary/20 hover:border-primary/50">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}
            {!user && (
              <Link to="/portal">
                <Button variant="accent" size="default" className="rounded-full px-6">
                  Portal Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2.5 rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background/95 backdrop-blur-xl border-border/50">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <img src={blueRibbonLogo} alt="Blue Ribbon Academy" className="h-10 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8">
                {navItems.filter(item => !item.authRequired || user).map((item) => {
                  const isActive = location.pathname === item.href;
                  return item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-colors text-foreground/70 hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.label}
                      {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
                <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border/50">
                  {user && (
                    <Button variant="ghost" className="w-full gap-2 justify-start rounded-xl" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  )}
                  {user && isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" className="w-full gap-2 rounded-xl">
                        <Settings className="h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  {user && isStudent && !isAdmin && (
                    <Link to="/dashboard">
                      <Button variant="outline" className="w-full gap-2 rounded-xl">
                        <LayoutDashboard className="h-4 w-4" />
                        My Dashboard
                      </Button>
                    </Link>
                  )}
                  {!user && (
                    <Link to="/portal">
                      <Button variant="accent" className="w-full rounded-xl">
                        Portal Login
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
