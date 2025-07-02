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
  ChevronUp,
  Activity,
  Wifi,
  Settings,
  Globe
} from "lucide-react";
import { Button } from "../ui/button";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  premium?: boolean;
}

export function SidebarFixed({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    network: true,
    financial: true,
    settings: true,
    admin: true
  });

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
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      // Force navigation even if there's an error
      navigate("/login", { replace: true });
      // Also reload the page to clear any cached data
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if there's an error
      navigate("/login", { replace: true });
      window.location.reload();
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
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
    settings: [
      {
        label: "Configurações",
        href: "/settings",
        icon: <Settings className="h-5 w-5" />,
      }
    ],
    admin: [
      ...(user?.role === 'admin' ? [{
        label: "Usuários",
        href: "/users",
        icon: <Users className="h-5 w-5" />,
      }, {
        label: "Sistema",
        href: "/admin/settings",
        icon: <Globe className="h-5 w-5" />,
      }] : [])
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
              <Wifi className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MikroPix
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 263,
          x: 0 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "hidden lg:flex fixed top-0 left-0 h-full z-40 flex-col bg-black/90 backdrop-blur-xl border-r border-gray-800/50 shadow-2xl"
        )}
      >
        {/* Header com logo */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            {collapsed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20"
              >
                <Wifi className="h-5 w-5 text-blue-400" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                  <Wifi className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  MikroPix
                </span>
              </motion.div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:bg-white/10 ml-auto"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-2">
            {/* Dashboard */}
            {navigationLinks.main.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                isActive={location.pathname === link.href}
                onClick={() => handleNavigation(link.href)}
                collapsed={collapsed}
              />
            ))}

            <div className="my-4 border-t border-gray-800/50" />

            {/* Rede */}
            <SectionHeader 
              title="Rede" 
              icon={<Network className="h-4 w-4" />} 
              collapsed={collapsed}
              expanded={expandedSections.network}
              onToggle={() => toggleSection('network')}
            />
            <AnimatePresence>
              {expandedSections.network && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="my-4 border-t border-gray-800/50" />

            {/* Financeiro */}
            <SectionHeader 
              title="Financeiro" 
              icon={<DollarSign className="h-4 w-4" />} 
              collapsed={collapsed}
              expanded={expandedSections.financial}
              onToggle={() => toggleSection('financial')}
            />
            <AnimatePresence>
              {expandedSections.financial && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="my-4 border-t border-gray-800/50" />

            {/* Configurações */}
            <SectionHeader 
              title="Configurações" 
              icon={<Settings className="h-4 w-4" />} 
              collapsed={collapsed}
              expanded={expandedSections.settings}
              onToggle={() => toggleSection('settings')}
            />
            <AnimatePresence>
              {expandedSections.settings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {navigationLinks.settings.map((link) => (
                    <NavItem
                      key={link.label}
                      link={link}
                      isActive={location.pathname.startsWith(link.href)}
                      onClick={() => handleNavigation(link.href)}
                      collapsed={collapsed}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admin */}
            {user?.role === 'admin' && navigationLinks.admin.length > 0 && (
              <>
                <div className="my-4 border-t border-gray-800/50" />
                <SectionHeader 
                  title="Admin" 
                  icon={<UserCog className="h-4 w-4" />} 
                  collapsed={collapsed}
                  expanded={expandedSections.admin}
                  onToggle={() => toggleSection('admin')}
                />
                <AnimatePresence>
                  {expandedSections.admin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        {/* Footer - User Info */}
        <div className="p-4 border-t border-gray-800/50">
          {/* Saldo */}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">Saldo Atual</span>
              </div>
              <div className="text-lg font-bold text-green-400">
                {isLoading ? "..." : formatCurrency(userBalance)}
              </div>
            </motion.div>
          )}

          {/* User */}
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "flex-col gap-2"
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
              {user?.nome ? (
                <span className="text-white font-bold text-sm">
                  {getInitials(user.nome)}
                </span>
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>

            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-semibold text-white truncate">
                  {user?.nome || "Usuário"}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 capitalize">
                    {user?.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                  {user?.role === 'admin' && <Crown className="h-3 w-3 text-yellow-400" />}
                </div>
              </motion.div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className={cn(
                "text-red-400 hover:text-red-300 hover:bg-red-500/10",
                collapsed && "w-8 h-8"
              )}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -263 }}
            animate={{ x: 0 }}
            exit={{ x: -263 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-[263px] z-50 lg:hidden bg-black/95 backdrop-blur-xl border-r border-gray-800/50"
          >
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                  <Wifi className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  MikroPix
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-2">
                {/* Dashboard */}
                {navigationLinks.main.map((link) => (
                  <NavItem
                    key={link.label}
                    link={link}
                    isActive={location.pathname === link.href}
                    onClick={() => handleNavigation(link.href)}
                    collapsed={false}
                  />
                ))}

                <div className="my-4 border-t border-gray-800/50" />

                {/* Rede */}
                <SectionHeader 
                  title="Rede" 
                  icon={<Network className="h-4 w-4" />} 
                  collapsed={false}
                  expanded={expandedSections.network}
                  onToggle={() => toggleSection('network')}
                />
                <AnimatePresence>
                  {expandedSections.network && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {navigationLinks.network.map((link) => (
                        <NavItem
                          key={link.label}
                          link={link}
                          isActive={location.pathname.startsWith(link.href)}
                          onClick={() => handleNavigation(link.href)}
                          collapsed={false}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="my-4 border-t border-gray-800/50" />

                {/* Financeiro */}
                <SectionHeader 
                  title="Financeiro" 
                  icon={<DollarSign className="h-4 w-4" />} 
                  collapsed={false}
                  expanded={expandedSections.financial}
                  onToggle={() => toggleSection('financial')}
                />
                <AnimatePresence>
                  {expandedSections.financial && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {navigationLinks.financial.map((link) => (
                        <NavItem
                          key={link.label}
                          link={link}
                          isActive={location.pathname.startsWith(link.href)}
                          onClick={() => handleNavigation(link.href)}
                          collapsed={false}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="my-4 border-t border-gray-800/50" />

                {/* Configurações */}
                <SectionHeader 
                  title="Configurações" 
                  icon={<Settings className="h-4 w-4" />} 
                  collapsed={false}
                  expanded={expandedSections.settings}
                  onToggle={() => toggleSection('settings')}
                />
                <AnimatePresence>
                  {expandedSections.settings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {navigationLinks.settings.map((link) => (
                        <NavItem
                          key={link.label}
                          link={link}
                          isActive={location.pathname.startsWith(link.href)}
                          onClick={() => handleNavigation(link.href)}
                          collapsed={false}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin */}
                {user?.role === 'admin' && navigationLinks.admin.length > 0 && (
                  <>
                    <div className="my-4 border-t border-gray-800/50" />
                    <SectionHeader 
                      title="Admin" 
                      icon={<UserCog className="h-4 w-4" />} 
                      collapsed={false}
                      expanded={expandedSections.admin}
                      onToggle={() => toggleSection('admin')}
                    />
                    <AnimatePresence>
                      {expandedSections.admin && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {navigationLinks.admin.map((link) => (
                            <NavItem
                              key={link.label}
                              link={link}
                              isActive={location.pathname.startsWith(link.href)}
                              onClick={() => handleNavigation(link.href)}
                              collapsed={false}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-800/50">
              {/* Saldo */}
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Saldo Atual</span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  {isLoading ? "..." : formatCurrency(userBalance)}
                </div>
              </div>

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                  {user?.nome ? (
                    <span className="text-white font-bold text-sm">
                      {getInitials(user.nome)}
                    </span>
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {user?.nome || "Usuário"}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 capitalize">
                      {user?.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                    {user?.role === 'admin' && <Crown className="h-3 w-3 text-yellow-400" />}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Componentes auxiliares
function SectionHeader({ 
  title, 
  icon, 
  collapsed, 
  expanded, 
  onToggle 
}: { 
  title: string; 
  icon: React.ReactNode; 
  collapsed: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  if (collapsed) return null;
  
  return (
    <motion.button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-300 transition-colors duration-200 group"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {onToggle && (
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="group-hover:text-white transition-colors duration-200"
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
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
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
        isActive 
          ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" 
          : "text-gray-300 hover:text-white hover:bg-white/5",
        collapsed && "justify-center px-2"
      )}
    >
      <span className="flex-shrink-0">
        {link.icon}
      </span>
      
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">
            {link.label}
          </span>
          {link.premium && (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-bold">
              PRO
            </span>
          )}
        </>
      )}
    </motion.button>
  );
}