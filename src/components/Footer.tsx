
"use client";

import { Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-6 mt-12 md:mt-20 bg-card border-t">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-sm text-muted-foreground">
          Conducted by{' '}
          <span className="font-semibold text-foreground">Patnam Baabu</span>
        </p>
        <div className="flex items-center gap-6">
            <Link href="https://www.instagram.com/patnambaabu?igsh=dTk2aWJrY3VqY2lm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Follow us on Instagram</span>
            </Link>
             <Link href="https://youtube.com/@patnambaabu?feature=shared" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-red-600 transition-colors group">
                <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Subscribe on YouTube</span>
            </Link>
        </div>
      </div>
    </footer>
  );
}
