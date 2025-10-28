// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X, Home, FileText, BarChart3, User, LogOut } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { label: "Panel", href: "/dashboard", icon: Home },
  { label: "CV'lerim", href: "/dashboard/cvs", icon: FileText },
  { label: "Analizlerim", href: "/dashboard/analyses", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoadingUser(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user ?? null);
        setIsLoadingUser(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link 
            href={user ? '/dashboard' : '/'} 
            className="flex items-center gap-2 group/logo"
          >
            <span className="font-bold text-lg transition-all duration-200 group-hover/logo:scale-105 group-hover/logo:text-primary">
              CVOptima
            </span>
          </Link>

          {/* DESKTOP NAV */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = 
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <NavLink key={item.href} href={item.href} isActive={isActive}>
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoadingUser && (
            user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/30 border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground max-w-[200px] truncate" title={user.email || ''}>
                    {user.email}
                  </span>
                </div>
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="gap-2 transition-all duration-200 hover:border-destructive/50 hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Giriş Yap</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Kayıt Ol</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* MOBILE ACTIONS */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative h-9 w-9 transition-all duration-200 hover:scale-105 hover:bg-accent/50"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
                <span className="sr-only">Menüyü {isMobileMenuOpen ? 'Kapat' : 'Aç'}</span>
              </Button>
            </SheetTrigger>

            <SheetContent 
              side="right" 
              className="w-[85vw] max-w-sm border-l bg-background/95 backdrop-blur"
            >
              <SheetHeader className="text-left mb-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <div>
                    <div className="font-bold text-lg">CVOptima</div>
                    {user && (
                      <div className="text-xs text-muted-foreground font-normal mt-1 truncate max-w-[250px]">
                        {user.email}
                      </div>
                    )}
                  </div>
                </SheetTitle>
              </SheetHeader>

              <nav className="space-y-1">
                {user && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      Navigasyon
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = 
                        item.href === "/dashboard"
                          ? pathname === "/dashboard"
                          : pathname.startsWith(item.href);
                      return (
                        <MobileNavLink
                          key={item.href}
                          href={item.href}
                          isActive={isActive}
                          onLinkClick={handleMobileLinkClick}
                          icon={<Icon className="w-4 h-4" />}
                        >
                          {item.label}
                        </MobileNavLink>
                      );
                    })}

                    <div className="pt-4 mt-4 border-t">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 text-destructive hover:bg-destructive/10 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Çıkış Yap</span>
                      </button>
                    </div>
                  </>
                )}

                {!user && !isLoadingUser && (
                  <div className="space-y-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-auto justify-start gap-2 h-9 text-sm px-3"
                      asChild
                      onClick={handleMobileLinkClick}
                    >
                      <Link href="/login">
                        <User className="w-4 h-4" />
                        Giriş Yap
                      </Link>
                    </Button>
                    <Button 
                      className="w-auto justify-start gap-2 h-9 text-sm px-3 bg-gradient-to-r from-primary to-primary/90"
                      asChild
                      onClick={handleMobileLinkClick}
                    >
                      <Link href="/register">
                        <User className="w-4 h-4" />
                        Kayıt Ol
                      </Link>
                    </Button>
                  </div>
                )}

                {isLoadingUser && (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps { 
  href: string; 
  children: React.ReactNode; 
  isActive?: boolean; 
}

function NavLink({ href, children, isActive }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center text-sm font-medium relative px-4 py-2 rounded-lg transition-all duration-200 group",
        isActive 
          ? "text-foreground bg-accent/50 font-semibold" 
          : "text-foreground/70 hover:text-foreground hover:bg-accent/30"
      )}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
}

interface MobileNavLinkProps { 
  href: string; 
  children: React.ReactNode; 
  isActive?: boolean; 
  onLinkClick?: () => void;
  icon?: React.ReactNode;
}

function MobileNavLink({ 
  href, 
  children, 
  isActive, 
  onLinkClick, 
  icon
}: MobileNavLinkProps) {
  const handleClick = () => {
    onLinkClick?.();
  };

  return (
    <Link href={href} onClick={handleClick} className="block">
      <div
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 group",
          "hover:bg-accent/30",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-foreground/80 hover:text-foreground"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          {icon}
        </div>
        <span className="font-medium text-sm">{children}</span>
        {isActive && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full ml-auto" />
        )}
      </div>
    </Link>
  );
}