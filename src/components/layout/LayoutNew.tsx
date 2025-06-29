import { useState, useEffect } from "react";
import { SidebarNew } from "./SidebarNew";
import { Outlet } from 'react-router-dom';
import { PageLoadingOverlay } from "../ui/loading-overlay";
import { motion, AnimatePresence } from "framer-motion";

export function LayoutNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Simular loading inicial da aplicação
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500); // 1.5 segundos de loading inicial

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Loading overlay para carregamento inicial */}
      <PageLoadingOverlay isLoading={isPageLoading} />
      
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
        <SidebarNew open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Main content area */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-h-screen relative overflow-hidden"
          style={{ 
            marginLeft: sidebarOpen && window.innerWidth < 1024 ? 0 : window.innerWidth >= 1024 ? '320px' : 0 
          }}
        >
          {/* Loading overlay para navegação */}
          <AnimatePresence>
            {isNavigating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
                />
              </motion.div>
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