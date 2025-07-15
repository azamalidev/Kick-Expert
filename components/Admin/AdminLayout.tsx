"use client"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import AdminSidebar from "@/components/Admin/AdminSidebar"
import type { ReactNode } from "react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 w-64 z-40 transition-transform duration-300 ease-in-out
        bg-[#0f1b2d] text-white
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex items-center justify-between p-4 lg:justify-start">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-white font-semibold">Buzz</span>
          </div>
          <button className="lg:hidden text-white hover:text-gray-300" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="px-4">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="text-gray-600 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 w-full">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl mx-auto space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
