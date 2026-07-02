"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ActivitiesTestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // ซ่อน Tab Navbar ในหน้าเมนูหลัก
  const isMenu = pathname === "/activities/test"

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50/50">
      {!isMenu && (
        <div className="flex flex-wrap gap-2 border-b p-4 bg-white sticky top-0 z-10 shadow-sm">
          <Link 
            href="/activities/test"
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors flex items-center"
          >
            🏠 เมนูหลัก
          </Link>
          <Link 
            href="/activities/test/roles"
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${pathname.includes('/roles') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            1. กำหนดสิทธิ์
          </Link>
          <Link 
            href="/activities/test/create"
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${pathname.includes('/create') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            2. สร้างกิจกรรม
          </Link>
          <Link 
            href="/activities/test/approvals"
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${pathname.includes('/approvals') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            3. กระดานอนุมัติ
          </Link>
          <Link 
            href="/activities/test/status"
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${pathname.includes('/status') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            4. สถานะของฉัน
          </Link>
        </div>
      )}
      
      <div className="flex-1 max-w-6xl w-full mx-auto">
        {children}
      </div>
    </div>
  )
}
