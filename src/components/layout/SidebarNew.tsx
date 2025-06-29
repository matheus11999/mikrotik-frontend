"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard,
  Router,
  ListChecks,
  Shield,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Network,
  DollarSign,
  UserCog,
  Menu,
  X,
  Crown,
  User,
  ChevronDown,
  Wifi,
  Activity
} from "lucide-react";
import { Button } from "../ui/button";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  premium?: boolean;
}

export function SidebarNew({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('saldo')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setUserBalance(Number(data?.saldo) || 0);
      } catch (error) {
        console.error('Error fetching user balance:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserBalance();
  }, [user]);

  const handleNavigation = (href: string) => {
    navigate(href);
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navigationLinks = {
    main: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
    network: [
      {
        label: "MikroTiks",
        href: "/mikrotiks",
        icon: <Router className="h-5 w-5" />,
      },
      {
        label: "MACs",
        href: "/macs",
        icon: <ListChecks className="h-5 w-5" />,
      },
      ...(user?.role === 'admin' ? [{
        label: "WireGuard",
        href: "/wireguard",
        icon: <Shield className="h-5 w-5" />,
        premium: true
      }] : []),
    ],
    financial: [
      {
        label: "Vendas",
        href: "/vendas",
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        label: "Transações",
        href: "/transacoes",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        label: "Saques",
        href: "/saques",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    admin: [
      ...(user?.role === 'admin' ? [{
        label: "Usuários",
        href: "/admin/users",
        icon: <Users className="h-5 w-5" />,
      }] : []),
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Avatar com iniciais
  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  };

  // Tooltip custom
  const Tooltip = ({ children, label }: { children: React.ReactNode, label: string }) => (
    <div className="group relative flex items-center">
      {children}
      <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-blue-900/40">
        {label}
      </span>
    </div>
  );

  // Sidebar width
  const sidebarWidth = collapsed ? 'w-20' : 'w-80';

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container com efeito glassmorphism */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "h-full flex flex-col bg-black/80 backdrop-blur-xl border-r border-gray-800/50 shadow-2xl fixed z-50 top-0 left-0 transition-all duration-300",
          sidebarWidth
        )}
      >
        {/* Botão de colapsar/expandir (desktop) */}
        <div className="hidden lg:flex items-center justify-end p-3 border-b border-gray-800/50">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-900/20 w-8 h-8"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Header com logo centralizada e efeito */}
        <div className={cn(
          "flex items-center border-b border-gray-800/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10",
          collapsed ? "justify-center py-4" : "justify-center p-6"
        )}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.img 
              whileHover={{ scale: 1.05, rotate: 5 }}
              src="/img/logo-white.png" 
              alt="MikroPix Logo" 
              className={cn("h-12 w-auto drop-shadow-lg", collapsed && "h-10")} 
            />
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white tracking-wide bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
              >
                MikroPix
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-6">
          {/* Seção Principal */}
          <div>
            {!collapsed && <SectionTitle>Principal</SectionTitle>}
            <div className="space-y-1">
              {navigationLinks.main.map((link) => (
                <NavItem
                  key={link.label}
                  link={link}
                  isActive={location.pathname === link.href}
                  onClick={() => handleNavigation(link.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>

          <Divider collapsed={collapsed} />

          {/* Seção Rede */}
          <DropdownSection
            title="Rede"
            icon={<Network className="h-5 w-5" />}
            collapsed={collapsed}
          >
            {navigationLinks.network.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                isActive={location.pathname.startsWith(link.href)}
                onClick={() => handleNavigation(link.href)}
                collapsed={collapsed}
              />
            ))}
          </DropdownSection>

          <Divider collapsed={collapsed} />

          {/* Seção Financeiro */}
          <DropdownSection
            title="Financeiro"
            icon={<DollarSign className="h-5 w-5" />}
            collapsed={collapsed}
          >
            {navigationLinks.financial.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                isActive={location.pathname.startsWith(link.href)}
                onClick={() => handleNavigation(link.href)}
                collapsed={collapsed}
              />
            ))}
          </DropdownSection>

          {/* Seção Admin */}
          {user?.role === 'admin' && (
            <>
              <Divider collapsed={collapsed} />
              <DropdownSection
                title="Admin"
                icon={<UserCog className="h-5 w-5" />}
                collapsed={collapsed}
              >
                {navigationLinks.admin.map((link) => (
                  <NavItem
                    key={link.label}
                    link={link}
                    isActive={location.pathname.startsWith(link.href)}
                    onClick={() => handleNavigation(link.href)}
                    collapsed={collapsed}
                  />
                ))}
              </DropdownSection>
            </>
          )}
        </div>

        {/* Footer com saldo e avatar */}
        <div className="p-4 border-t border-gray-800/50 bg-black/40">
          {/* Saldo */}
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-5 w-5 text-green-400 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-xs text-gray-400">Saldo</div>
                  <div className="font-bold text-green-400">
                    {isLoading ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(userBalance)
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 justify-between",
            collapsed && "flex-col gap-2 justify-center"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center w-full" : ""
            )}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 flex items-center justify-center shadow-lg border-2 border-white/10"
              >
                {user?.nome ? (
                  <span className="text-white font-bold text-sm select-none">
                    {getInitials(user.nome)}
                  </span>
                ) : (
                  <User className="h-5 w-5 text-white/80" />
                )}
                {/* Status Online */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
              </motion.div>
              
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col"
                >
                  <span className="text-sm font-semibold text-white leading-tight">
                    {user?.nome || "Usuário"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-300 capitalize">
                      {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                    {user?.role === 'admin' && (
                      <Crown className="h-3 w-3 text-yellow-400" />
                    )}
                  </div>
                </motion.div>
              )}
            </div>
            
            <Tooltip label="Sair">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 w-8 h-8"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </motion.aside>

      {/* Botão flutuante de abrir/fechar sidebar no mobile */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-black/80 hover:bg-black/90 border border-gray-800/50 shadow-lg backdrop-blur-sm rounded-xl p-3 text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </div>
    </>
  );
}

// Componentes auxiliares
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h3
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3 px-3"
    >
      {children}
    </motion.h3>
  );
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return !collapsed ? (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.3 }}
      className="h-px bg-gradient-to-r from-blue-700/40 via-cyan-400/10 to-purple-500/30 mx-3 rounded-full"
    />
  ) : (
    <div className="h-px w-8 bg-gray-700/50 mx-auto rounded-full" />
  );
}

function DropdownSection({ 
  title, 
  icon, 
  children, 
  collapsed 
}: { 
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="space-y-1">
        {children}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
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
}

function NavItem({ 
  link, 
  isActive, 
  onClick, 
  collapsed 
}: { 
  link: NavLink;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  const content = (
    <>
      <span className={cn(
        "flex-shrink-0 transition-transform duration-200",
        "group-hover:scale-110"
      )}>
        {link.icon}
      </span>
      
      {!collapsed && (
        <>
          <span className="text-white/90 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 flex-1">
            {link.label}
          </span>
          {link.premium && (
            <span className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-bold">
              PRO
            </span>
          )}
        </>
      )}
    </>
  );

  const baseClasses = cn(
    "group flex items-center gap-3 py-3 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer",
    isActive && "bg-blue-600/20 text-blue-300 border border-blue-500/30",
    collapsed && "justify-center"
  );

  if (collapsed) {
    return (
      <div className="group relative">
        <button onClick={onClick} className={baseClasses}>
          {link.icon}
        </button>
        <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-blue-900/40">
          {link.label}
        </span>
      </div>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}