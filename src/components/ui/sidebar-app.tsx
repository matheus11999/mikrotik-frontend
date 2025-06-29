"use client";
import React, { useState, useEffect } from "react";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconRouter,
  IconCreditCard,
  IconTrendingUp,
  IconUsers,
  IconShoppingCart,
  IconMenu2,
  IconX,
  IconChevronDown,
  IconLayoutDashboard,
  IconWallet,
  IconUsersGroup,
  IconAdjustments,
} from "@tabler/icons-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { Moon, Sun, ChevronLeft, ChevronRight, Home, BarChart2, Bell, Star, CreditCard, Settings, Search, Router, ShoppingCart, Users, Wallet, Shield, Crown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const categories = [
  {
    label: "Geral",
    icon: IconLayoutDashboard,
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "MikroTiks", href: "/mikrotiks" },
      { label: "MACs", href: "/macs" },
    ],
  },
  {
    label: "Financeiro",
    icon: IconWallet,
    links: [
      { label: "Vendas", href: "/vendas" },
      { label: "Transações", href: "/transacoes" },
      { label: "Saques", href: "/saques" },
    ],
  },
  {
    label: "Usuários",
    icon: IconUsersGroup,
    links: [
      { label: "Usuários", href: "/usuarios" },
    ],
  },
  {
    label: "Configurações",
    icon: IconAdjustments,
    links: [
      { label: "Configurações", href: "/settings" },
      { label: "Logout", href: "/logout" },
    ],
  },
];

function getInitials(nome?: string) {
  if (!nome) return "";
  return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function SidebarDropdown({ label, icon: Icon, children, collapsed, defaultOpen = true }: { label: string; icon: React.ElementType; children: React.ReactNode; collapsed: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  // Dropdown só expande se não estiver colapsada
  const showDropdown = !collapsed && open;
  return (
    <div className="mb-2">
      <button
        className={`flex items-center w-full gap-2 px-2 py-2 text-left text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition group focus:outline-none focus:ring-2 focus:ring-neutral-700/60 rounded-lg ${collapsed ? "justify-center" : ""}`}
        onClick={() => !collapsed && setOpen((v) => !v)}
        aria-expanded={showDropdown}
        aria-controls={`dropdown-${label}`}
        tabIndex={0}
      >
        <Icon className="w-5 h-5 text-white" />
        {!collapsed && <span className="flex-1">{label}</span>}
        {!collapsed && <IconChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />}
        {collapsed && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-black/90 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none shadow-lg border border-neutral-800 transition-opacity duration-200 whitespace-nowrap">
            {label}
          </span>
        )}
      </button>
      <div
        id={`dropdown-${label}`}
        className={`overflow-hidden transition-all duration-300 ${showDropdown ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function SidebarApp({ children }: { children?: React.ReactNode }) {
  const { user } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? 64 : 256; // px (w-16 ou w-64)
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);

  // Exemplo de categorias/links (adapte conforme suas rotas reais)
  const items = [
    {
      label: "Dashboard",
      icon: <BarChart2 size={22} />, // Dashboard principal
      href: "/dashboard",
    },
    {
      label: "MikroTiks",
      icon: <Router size={22} />,
      href: "/mikrotiks",
    },
    {
      label: "Vendas",
      icon: <ShoppingCart size={22} />,
      href: "/vendas",
    },
    {
      label: "Usuários",
      icon: <Users size={22} />,
      href: "/usuarios",
    },
    {
      label: "Transações",
      icon: <CreditCard size={22} />,
      href: "/transacoes",
    },
    {
      label: "Saques",
      icon: <Wallet size={22} />,
      href: "/saques",
    },
    {
      label: "Configurações",
      icon: <Settings size={22} />,
      href: "/settings",
    },
  ];

  // Alternância de tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <>
      <aside
        className={`h-screen fixed top-0 left-0 z-40 flex flex-col bg-black border-r border-neutral-900 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
        style={{ width: sidebarWidth }}
      >
        {/* Top: Logo + Collapse */}
        <div className="flex flex-col gap-2 px-3 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-full flex flex-col items-center justify-center text-center">
              {!collapsed ? (
                <>
                  <div className="flex flex-row items-center justify-center w-full">
                    <Router size={24} className="text-violet-400 mr-2" />
                    <span className="text-xl font-bold text-white tracking-tight select-none">Mikropix</span>
                  </div>
                  <span className="text-xs text-neutral-400 mt-1 font-normal tracking-wide select-none w-full">Você no controle</span>
                </>
              ) : (
                <Router size={28} className="text-violet-400" />
              )}
            </div>
            <button
              className="p-1 rounded hover:bg-neutral-800 transition"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>
        {/* Divisor igual ao do rodapé */}
        <div className="border-t border-neutral-900 w-full mb-1" />
        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-1 px-1 mt-2">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`group flex items-center gap-3 rounded-lg px-2 py-2 my-0.5 text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-700/60 focus:z-10
                  ${collapsed ? "justify-center" : ""}
                  ${isActive ? "text-white" : "text-neutral-300"}
                  hover:bg-neutral-900/80 hover:text-white"
                `}
                style={isActive ? { backgroundColor: "rgb(37 99 235 / var(--tw-bg-opacity, 1))" } : {}}
                tabIndex={0}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        {/* Rodapé: avatar, nome e role do usuário centralizados com flex */}
        <div className="flex flex-col justify-center items-center gap-2 px-2 py-4 border-t border-neutral-900 mt-auto">
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <div className="flex flex-row items-center justify-center w-full">
              <div className={`h-11 w-11 rounded-full border-2 ${darkMode ? "border-neutral-700 bg-neutral-900 text-white" : "border-neutral-300 bg-neutral-100 text-black"} flex items-center justify-center font-bold text-lg select-none shadow-lg`}>
                {getInitials(user?.nome)}
              </div>
              {!collapsed && (
                <span className={`ml-3 text-base font-semibold leading-tight truncate max-w-[120px] ${darkMode ? "text-white" : "text-black"}`}>{user?.nome || "Usuário"}</span>
              )}
            </div>
            {!collapsed && (
              <span className="uppercase text-[11px] font-semibold rounded px-2 py-0.5 tracking-widest mt-1 text-center w-full" style={{color: "rgb(37 99 235 / var(--tw-bg-opacity, 1))"}}>{user?.role || "Usuário"}</span>
            )}
          </div>
          {/* Seletor de tema */}
          <button
            className="flex items-center justify-center w-full rounded-lg px-2 py-2 hover:bg-neutral-800 transition mt-2"
            onClick={() => setDarkMode((v) => !v)}
            aria-label="Alternar tema"
          >
            {darkMode ? <Moon size={20} className="text-neutral-300" /> : <Sun size={20} className="text-yellow-400" />}
            {!collapsed && (
              <span className="ml-3 text-sm font-medium text-neutral-300">
                {darkMode ? "Modo escuro" : "Modo claro"}
              </span>
            )}
          </button>
        </div>
      </aside>
      {/* Padding para o conteúdo principal, troca cor conforme modo */}
      {children && (
        <div
          style={{ paddingLeft: sidebarWidth }}
          className={`transition-all duration-300 min-h-screen ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}
        >
          {children}
        </div>
      )}
    </>
  );
} 