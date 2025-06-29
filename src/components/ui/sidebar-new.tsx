"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  premium?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden lg:flex lg:flex-col bg-black/90 backdrop-blur-sm border-r border-gray-800/50 text-white shadow-2xl",
          className
        )}
        animate={{
          width: animate ? (open ? "280px" : "80px") : "280px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  
  React.useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row lg:hidden items-center justify-between bg-black/90 backdrop-blur-sm border-b border-gray-800/50 w-full text-white"
        )}
        {...props}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <img src="/img/logo-white.png" alt="MikroPix" className="h-8 w-auto" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MikroPix
            </span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>
        
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn(
                  "fixed h-full w-80 inset-y-0 left-0 bg-black/95 backdrop-blur-sm p-6 z-50 flex flex-col border-r border-gray-800/50 text-white",
                  className
                )}
              >
                <button
                  className="absolute right-4 top-4 z-50 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
                {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  
  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
  };

  const baseClasses = cn(
    "flex items-center gap-3 group/sidebar py-3 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer",
    link.active && "bg-blue-600/20 text-blue-300 border border-blue-500/30",
    className
  );

  const content = (
    <>
      <span className={cn(
        "flex-shrink-0 transition-transform duration-200",
        "group-hover/sidebar:scale-110"
      )}>
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-white/90 group-hover/sidebar:text-white group-hover/sidebar:translate-x-1 transition-all duration-200 whitespace-pre inline-block font-medium"
      >
        {link.label}
      </motion.span>
      {link.premium && open && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-bold"
        >
          PRO
        </motion.span>
      )}
    </>
  );

  if (link.onClick) {
    return (
      <button
        onClick={handleClick}
        className={baseClasses}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={link.href}
      className={baseClasses}
      {...props}
    >
      {content}
    </a>
  );
};

export const SidebarDropdown = ({
  title,
  icon,
  children,
  open: dropdownOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
}) => {
  const { open: sidebarOpen } = useSidebar();
  const [isOpen, setIsOpen] = useState(dropdownOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
      >
        <span className="flex-shrink-0">{icon}</span>
        {sidebarOpen && (
          <>
            <span className="flex-1 text-left">{title}</span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};