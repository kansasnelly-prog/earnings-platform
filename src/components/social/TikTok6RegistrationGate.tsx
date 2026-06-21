import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

const TikTok6RegistrationGate: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden p-6 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.2),_transparent_70%)]" />
      
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Visuals */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500 animate-spin">
              <div className="w-full h-full bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">TIKTOK6</h1>
              <p className="text-purple-400 font-bold">BEYOND CONNECTING, BEYOND LIMITS.</p>
              <p className="text-gray-500 text-sm">THIS IS THE NEXT GENERATION</p>
            </div>
          </div>

          <div className="relative h-96 flex items-center justify-center">
            {/* Heart Animation */}
            <div className="relative w-80 h-80 border-4 border-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                    ❤️
                </div>
            </div>
            {/* Decorative images could go here */}
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold">ONE WORLD. ONE HEART. ONE TIKTOK6.</p>
            <p className="text-gray-400">CONNECTING SOULS, CREATING MOMENTS, BUILDING FOREVER.</p>
          </div>
        </div>

        {/* Right Side: Auth */}
        <div className="bg-gray-900/80 p-8 rounded-3xl border border-gray-800 space-y-6">
          <h2 className="text-3xl font-bold text-center">WELCOME TO TIKTOK6</h2>
          <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-xl">Sign up</Button>
          <Button className="w-full bg-gray-800 py-6 text-xl">Log in</Button>
          
          <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full p-4 bg-gray-800 rounded-xl" />
              <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-800 rounded-xl" />
              <input type="password" placeholder="Password" className="w-full p-4 bg-gray-800 rounded-xl" />
              <Button className="w-full bg-purple-600 py-6 text-xl">Sign Up</Button>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <footer className="absolute bottom-0 left-0 w-full p-6 bg-gray-900/90 border-t border-gray-800 flex justify-around">
          <p>1. Click the Button</p>
          <p>2. Slide In</p>
          <p>3. Create Account</p>
      </footer>
    </div>
  );
};

export default TikTok6RegistrationGate;
