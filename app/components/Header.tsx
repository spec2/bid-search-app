"use client";

import { Briefcase } from 'lucide-react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
      <div className="container mx-auto p-4 flex items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            入札サーチ.jp
          </h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
