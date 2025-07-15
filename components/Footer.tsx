'use client';

import { FaFacebookF, FaLinkedinIn, FaTwitter, FaInstagram } from 'react-icons/fa';
import { IoGlobeOutline } from 'react-icons/io5';
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
              <h2 className="text-2xl mr-8 font-bold text-white flex items-center gap-2">
                <span className="text-lime-400">●</span> Kick<span className="text-white">Expert</span>
              </h2>
            </Link>
          </div>

          {/* Mobile Layout - Two columns */}
          <div className="w-full flex  gap-8 md:hidden items-center justify-center">
            {/* Left Column - Contact + Products */}
            <div className="space-y-6 ">
              <div className="space-y-3 text-gray-300 text-sm">
                <h3 className="text-lime-400 font-semibold text-lg">Contact Us</h3>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">sweetdeli@gmail.com</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">+1-2345-6789</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">123 Ave, New York, USA</p>
              </div>

              
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Products</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li><Link href="#" className="hover:text-lime-400 transition-colors">Auctor volutpat</Link></li>
                  <li><Link href="#" className="hover:text-lime-400 transition-colors">Fermentum turpis</Link></li>
                  <li><Link href="#" className="hover:text-lime-400 transition-colors">Mi consequat</Link></li>
                </ul>
              </div>
            </div>

            {/* Right Column - About + Social */}
            <div className="space-y-6">
              <div className='mt-[-11px]'>
                <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li><Link href="/about" className="hover:text-lime-400 transition-colors">Egestas vitae</Link></li>
                  <li><Link href="/about" className="hover:text-lime-400 transition-colors">Viverra lorem ac</Link></li>
                  <li><Link href="/about" className="hover:text-lime-400 transition-colors">Eget ac tellus</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-lime-400 mb-4">Get the App</h3>
                <div className="flex flex-col gap-3">
                  <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
                    <Image 
                      src="/images/image7.png"
                      alt="App Store"
                      width={120}
                      height={40}
                      className="rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                    <Image 
                      src="/images/image8.png"
                      alt="Google Play"
                      width={120}
                      height={40}
                      className="rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-4 w-full gap-8 pb-10 border-b border-gray-700">
            {/* Brand + Contact */}
            <div className="space-y-6 flex flex-col items-center md:items-start">
              <div className="space-y-3 text-gray-300 text-sm">
                <h3 className="text-lime-400 font-semibold text-lg">Contact Us</h3>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">sweetdeli@gmail.com</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">+1-2345-6789</p>
                <p className="hover:text-lime-400 transition-colors cursor-pointer">123 Ave, New York, USA</p>
              </div>
              <div className="flex gap-4 text-gray-300 text-lg">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                  <FaFacebookF />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                  <FaLinkedinIn />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                  <FaTwitter />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">
                  <FaInstagram />
                </a>
              </div>
            </div>

            {/* Products */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Products</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li><Link href="#" className="hover:text-lime-400 transition-colors">Auctor volutpat</Link></li>
                <li><Link href="#" className="hover:text-lime-400 transition-colors">Fermentum turpis</Link></li>
                <li><Link href="#" className="hover:text-lime-400 transition-colors">Mi consequat</Link></li>
                <li><Link href="#" className="hover:text-lime-400 transition-colors">Amet venenatis</Link></li>
                <li><Link href="#" className="hover:text-lime-400 transition-colors">Convallis porttitor</Link></li>
              </ul>
            </div>

            {/* About */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">About</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">Egestas vitae</Link></li>
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">Viverra lorem ac</Link></li>
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">Eget ac tellus</Link></li>
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">Erat nulla</Link></li>
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">Vulputate proin</Link></li>
              </ul>
            </div>

            {/* Get the App */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-lime-400 mb-4">Get the App</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
                  <Image 
                    src="/images/image7.png"
                    alt="App Store"
                    width={140}
                    height={48}
                    className="rounded-lg hover:opacity-80 transition-opacity"
                  />
                </a>
                <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                  <Image 
                    src="/images/image8.png"
                    alt="Google Play"
                    width={140}
                    height={48}
                    className="rounded-lg hover:opacity-80 transition-opacity"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-sm text-gray-400">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <IoGlobeOutline className="text-lg" />
            <span>English</span>
          </div>
          <div>Copyright © {new Date().getFullYear()}. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}