
"use client";

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <header className="py-4 px-6 bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto flex justify-center items-center relative">
        <Link href="/" className="flex items-center gap-2" aria-label="Back to home">
          <h1 className="text-2xl md:text-4xl font-bold font-headline text-shadow">
            PATNAM BAABU <span className="text-slate-400 font-bold text-4xl md:text-5xl mx-1 animate-shimmer bg-[linear-gradient(110deg,#a0aec0,45%,#d1d5db,55%,#a0aec0)] bg-[length:200%_100%] bg-clip-text text-transparent">X</span> RAFFLE
          </h1>
        </Link>
        <div className="absolute right-0 flex items-center gap-4">
            {isAdmin && pathname.startsWith('/admin') && (
                 <Button onClick={handleSignOut} variant="ghost" size="icon" aria-label="Sign Out">
                    <LogOut className="w-6 h-6" />
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
