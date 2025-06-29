"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
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
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-black border-r border-neutral-900 text-white rounded-r-xl shadow-lg",
          className
        )}
        animate={{
          width: animate ? (open ? "220px" : "56px") : "220px",
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
          "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-black border-b border-neutral-900 w-full text-white"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-[119]"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn(
                  "fixed h-full w-full inset-0 bg-black p-6 z-[120] flex flex-col justify-between border-r border-neutral-900 text-white",
                  className
                )}
              >
                <button
                  className="absolute right-6 top-6 z-50 text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 focus:bg-white/20 transition"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                >
                  <IconX className="h-7 w-7" />
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
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 text-white hover:bg-white/10 rounded transition-all duration-150 text-base font-medium",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-white text-base group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-medium"
      >
        {link.label}
      </motion.span>
    </a>
  );
};

export function SidebarDropdown({ 
  title, 
  icon, 
  children, 
  open: sidebarOpen,
  defaultExpanded = false 
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-all duration-200 text-left group",
          "hover:bg-gray-800 text-gray-300 hover:text-white"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-gray-400 group-hover:text-blue-400 transition-colors duration-200">
          {icon}
        </div>
        {sidebarOpen && (
          <>
            <span className="flex-1 text-gray-300 group-hover:text-white transition-colors duration-200">
              {title}
            </span>
          </>
        )}
      </button>
      <AnimatePresence>
        {isExpanded && sidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarLogo({ open: _ }: {
  open: boolean;
}) {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        MikroPix
      </motion.span>
    </a>
  );
}

export function SidebarUser({ open: _, user }: {
  open: boolean;
  user?: { role: string };
}) {
  return (
    <div className="flex items-center justify-center space-x-2 py-1 text-sm font-normal text-black dark:text-white">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        {user?.role === "admin" ? "Administrador" : "Usuário"}
      </motion.span>
    </div>
  );
} 