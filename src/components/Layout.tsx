import { Outlet } from 'react-router'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      {/* 底部留出导航栏高度 + iPhone 底部安全区 */}
      <main className="mx-auto max-w-xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
