'use client';
import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Lato } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import './taller/taller-dashboard.css';

const lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-taller' });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const isTallerDashboard = usePathname() === '/dashboard/taller';

  return (
    <div className={`layout-container ${isTallerDashboard ? `taller-dashboard-shell ${lato.variable}` : ''}`}>
      <Sidebar compact={isTallerDashboard} isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Topbar tallerDashboard={isTallerDashboard} onMenuClick={() => setIsSidebarOpen(value => !value)} />
        <main className="page-content">
          <div className="page-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
