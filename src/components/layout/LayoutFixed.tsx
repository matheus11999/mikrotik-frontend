import { useState, useEffect } from "react";
import { SidebarFixed } from "./SidebarFixed";
import { Outlet } from 'react-router-dom';
import { useToast } from "../ui";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstallPrompt } from "../../hooks/usePWAInstallPrompt";

export function LayoutFixed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { addToast } = useToast();
  const { isInstallable, promptInstall } = usePWAInstallPrompt();

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

  useEffect(() => {
    if (isInstallable) {
      addToast({
        type: 'info',
        title: 'Instale o aplicativo',
        description: 'Você pode adicionar o MikroPix à tela inicial para acesso rápido. Clique no banner ou use as opções do navegador.'
      });
    }
  }, [isInstallable, addToast, promptInstall]);

  return (
    <>
      <div className="min-h-screen bg-black">
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
                : 'lg:ml-[263px]'
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