import React from 'react';

const TikTokGate: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 p-6 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 animate-spin">
          {/* TikTok Icon Placeholder */}
          <div className="w-full h-full bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter">TIKTOK6</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-12">
          TIKTOK6
        </h2>

        {/* Heart Container */}
        <div className="relative w-80 h-80 border-4 border-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="text-center">❤️ Boy & Girl</div>
        </div>
      </main>

      {/* Right Sidebar - Authentication (Placeholder) */}
      <aside className="absolute right-0 top-0 w-80 h-screen bg-gray-900 border-l border-gray-800 p-6">
        <div className="space-y-4">
            <h3 className="text-xl font-bold">WELCOME TO TIKTOK6</h3>
            <button className="w-full bg-pink-500 p-2 rounded">Sign In</button>
            <h3 className="text-xl font-bold mt-8">CREATE YOUR ACCOUNT</h3>
            <div className="space-y-2">
                <input type="text" placeholder="Full Name" className="w-full p-2 bg-gray-800 rounded" />
                <button className="w-full bg-purple-500 p-2 rounded">Sign Up</button>
            </div>
        </div>
      </aside>

      {/* Bottom Footer - Steps */}
      <footer className="absolute bottom-0 left-0 w-full p-6 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-between">
            <p>1. Click the Button</p>
            <p>2. Slide In</p>
            <p>3. Create Account</p>
        </div>
      </footer>
    </div>
  );
};

export default TikTokGate;
