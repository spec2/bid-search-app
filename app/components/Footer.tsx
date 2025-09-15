"use client";

const Footer = () => {
  return (
    <footer className="bg-white mt-auto border-t">
      <div className="container mx-auto p-4 text-center text-gray-500 text-sm">
        <p>&copy; 2025 入札サーチ.jp. All rights reserved.</p>
        <p className="mt-2">
          本サイトのデータは、<a href="https://www.p-portal.go.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">調達ポータル</a>のオープンデータを利用しています。
        </p>
      </div>
    </footer>
  );
};

export default Footer;
