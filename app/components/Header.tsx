"use client";

import { Briefcase } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto p-4 flex items-center">
        <Briefcase className="h-7 w-7 text-primary mr-2" />
        <h1 className="text-2xl font-bold text-gray-800">
          入札サーチ.jp
        </h1>
      </div>
    </header>
  );
};

export default Header;
