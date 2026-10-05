'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="page-content">
          <div className="page-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
