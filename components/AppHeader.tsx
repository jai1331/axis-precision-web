'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Database, Plus, Settings, LogOut, User } from 'lucide-react';

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'));
    setUsername(localStorage.getItem('username'));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    router.push('/login');
  };

  // Header is only shown in app layout, so no need to check for login page

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        scrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b' : ''
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="font-bold text-xl">Axis Precision</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {userRole === 'admin' && (
            <>
              <Link
                href="/"
                className={`transition-colors hover:text-primary ${
                  pathname === '/' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
              {/* <Link
                href="/data/new"
                className={`transition-colors hover:text-primary ${
                  pathname === '/data/new' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                Add Product
              </Link> */}
              <Link
                href="/admin/new"
                className={`transition-colors hover:text-primary ${
                  pathname === '/admin/new' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                Admin Entry
              </Link>

            </>
          )}
          {userRole === 'employee' && (
            <Link
              href="/employee/entry"
              className={`transition-colors hover:text-primary ${
                pathname === '/employee/entry' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Employee Entry
            </Link>
          )}
        </nav>
        
        <div className="flex items-center gap-4">
          {userRole && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="capitalize">{username}</span>
              <span className="text-muted-foreground">({userRole})</span>
            </div>
          )}
          
          <div className="flex md:hidden">
            {userRole === 'admin' && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="icon" className={pathname === '/' ? 'bg-muted' : ''}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                  </Button>
                </Link>
                <Link href="/data">
                  <Button variant="ghost" size="icon" className={pathname === '/data' ? 'bg-muted' : ''}>
                    <Database className="h-5 w-5" />
                    <span className="sr-only">Data Table</span>
                  </Button>
                </Link>
                {/* <Link href="/data/new">
                  <Button variant="ghost" size="icon" className={pathname === '/data/new' ? 'bg-muted' : ''}>
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Add New</span>
                  </Button>
                </Link> */}
                <Link href="/admin/new">
                  <Button variant="ghost" size="icon" className={pathname === '/admin/new' ? 'bg-muted' : ''}>
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Admin Entry</span>
                  </Button>
                </Link>

              </>
            )}
            {userRole === 'employee' && (
              <Link href="/employee/entry">
                <Button variant="ghost" size="icon" className={pathname === '/employee/entry' ? 'bg-muted' : ''}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Employee Entry</span>
                </Button>
              </Link>
            )}
          </div>
          
          <ModeToggle />
          
          {userRole && (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}