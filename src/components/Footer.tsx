import React from 'react';
import { Zap, Shield, Globe, Mail, MessageCircle } from 'lucide-react';


const Footer: React.FC = () => {
  return (
    <footer className="bg-[#060a14] border-t border-white/[0.06]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                OptimizeHub
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              The premier optimization platform for digital earnings. Secure, reliable, and trusted by thousands worldwide.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">SSL Secured</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {['Dashboard', 'Task Center', 'Wallet', 'Withdrawals', 'VIP Tiers'].map(item => (
                <li key={item}>
                  <button className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">{item}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {['Help Center', 'FAQ', 'Contact Us', 'Report Issue', 'Community'].map(item => (
                <li key={item}>
                  <button className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">{item}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'AML Policy', 'Disclaimer'].map(item => (
                <li key={item}>
                  <button className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">{item}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/[0.06]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14} />
              <span>support@optimizehub.io</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe size={14} />
              <span>English (US)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Twitter', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
              { label: 'Telegram', path: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' },
              { label: 'Discord', path: 'M9 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z' },
            ].map((social, i) => (
              <button key={i} className="w-9 h-9 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center hover:bg-white/10 hover:border-indigo-500/30 transition-all" title={social.label}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={social.path} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-white/[0.04]">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} OptimizeHub. All rights reserved. This platform is for informational purposes only.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
