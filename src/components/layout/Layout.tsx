import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BackToTop } from "@/components/ui/back-to-top";
import { useAnalytics } from "@/hooks/useAnalytics";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const { track } = useAnalytics();

  // Scroll to top and track page view on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    track('page_view', { page: pathname });
  }, [pathname, track]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
