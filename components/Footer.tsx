'use client';

import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center md:items-start">
          {/* Brand - Centered on mobile */}
          <div className="w-full flex justify-center md:justify-start mb-8">
            <Link href="/" className="flex items-center">
              <div className="relative w-8 h-8 mr-2">
                <Image 
                  src="/logo.png" 
                  alt="KickExpert Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold flex items-center">
                <span className="text-lime-400">Kick</span><span className="text-white">Expert</span>
              </h2>
            </Link>
          </div>

          {/* Mobile Layout - Two columns */}
          <div className="w-full flex gap-8 md:hidden items-center justify-center">
            {/* Left Column - Contact + Legal & Compliance */}
            <div className="space-y-6">
              <div className="space-y-3 text-gray-300 text-sm">
                <h3 className="text-lime-400 font-semibold text-lg">Contact Us</h3>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">support@kickexpert.com</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">+1-555-123-4567</p>
                <div className="flex gap-4 text-gray-300 text-lg pt-2">
                  <a href="https://facebook.com/kickexpert" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                    <FaFacebookF />
                  </a>
                  <a href="https://instagram.com/kickexpert" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                    <FaInstagram />
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li><Link href="/termsofservice" className="hover:text-lime-400 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/policy" className="hover:text-lime-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/cookiepolicy" className="hover:text-lime-400 transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            {/* Right Column - Support & Help + Additional Links */}
            <div className="space-y-6 flex flex-col justify-between ">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li><Link href="/about" className="hover:text-lime-400 transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-lime-400 transition-colors">Contact Us</Link></li>
                  <li><Link href="/faq" className="hover:text-lime-400 transition-colors">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Policies</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li><Link href="/refundpayoutpolicy" className="hover:text-lime-400 transition-colors">Refund Policy</Link></li>
                  <li><Link href="/disclaimer" className="hover:text-lime-400 transition-colors">Disclaimer</Link></li>
                  <li><Link href="/fairplaypolicy" className="hover:text-lime-400 transition-colors">Fair Play Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-4 w-full gap-8 pb-10 border-b border-gray-700">
            {/* Brand + Contact */}
            <div className="space-y-6 flex flex-col items-center md:items-start">
              <div className="space-y-3 text-gray-300 text-sm">
                <h3 className="text-lime-400 font-semibold text-lg">Contact Us</h3>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">support@kickexpert.com</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">+1-555-123-4567</p>
                <div className="flex gap-4 text-gray-300 text-lg pt-2">
                  <a href="https://facebook.com/kickexpert" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                    <FaFacebookF />
                  </a>
                  <a href="https://instagram.com/kickexpert" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                    <FaInstagram />
                  </a>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li><Link href="/termsofservice" className="hover:text-lime-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/policy" className="hover:text-lime-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookiepolicy" className="hover:text-lime-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-lime-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-lime-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Policies */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Policies</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li><Link href="/refundpayoutpolicy" className="hover:text-lime-400 transition-colors">Refund Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-lime-400 transition-colors">Disclaimer</Link></li>
                <li><Link href="/fairplaypolicy" className="hover:text-lime-400 transition-colors">Fair Play Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-center  md:justify-between items-center pt-8 text-sm text-gray-400">
          <div className=' w-full flex justify-center'>Copyright © {new Date().getFullYear()} KickExpert. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}