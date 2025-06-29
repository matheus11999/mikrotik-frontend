import { useState, useEffect } from "react";
import { SidebarFixed } from "./SidebarFixed";
import { Outlet } from 'react-router-dom';
import { PageLoadingOverlay } from "../ui/loading-overlay-improved";
import { motion, AnimatePresence } from "framer-motion";

export function LayoutFixed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Loading inicial da aplicação
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Responsividade
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Loading overlay para carregamento inicial */}
      <PageLoadingOverlay isLoading={isPageLoading} />
      
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Sidebar */}
        <SidebarFixed 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        
        {/* Main content area */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen transition-all duration-300 ease-in-out ${
            isMobile 
              ? 'ml-0' 
              : collapsed 
                ? 'lg:ml-20' 
                : 'lg:ml-80'
          }`}
        >
          {/* Overlay para mobile quando sidebar está aberta */}
          <AnimatePresence>
            {sidebarOpen && isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Page content */}
          <div className="min-h-screen">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </>
  );
}