import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Package, ScanLine, CalendarDays, User,
  Leaf, LogOut, Menu, X, ChevronRight, Crown, Shield
} from 'lucide-react';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/',        label: 'Inicio',   icon: Home },
  { to: '/pantry',  label: 'Despensa', icon: Package },
  { to: '/scanner', label: 'Escáner',  icon: ScanLine },
  { to: '/menus',   label: 'Menús',    icon: CalendarDays },
  { to: '/profile', label: 'Perfil',   icon: User },
];

const RoleBadge = ({ role }) => {
  if (role === 'admin')   return <span className={`${styles.roleBadge} ${styles.admin}`}><Shield size={11} /> Admin</span>;
  if (role === 'premium') return <span className={`${styles.roleBadge} ${styles.premium}`}><Crown size={11} /> Premium</span>;
  return null;
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}><Leaf size={22} /></div>
        <span className={styles.logoText}>SmartFoodAI</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>Menú principal</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => setOpen(false)}
          >
            <Icon size={18} className={styles.navIcon} />
            <span>{label}</span>
            <ChevronRight size={14} className={styles.chevron} />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user?.name}</p>
          <p className={styles.userEmail}>{user?.email}</p>
          <RoleBadge role={user?.role} />
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className={styles.layout}>
      {/* Sidebar desktop */}
      <SidebarContent />

      {/* Overlay móvil */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Sidebar móvil */}
      <div className={`${styles.mobileSidebar} ${open ? styles.mobileOpen : ''}`}>
        <SidebarContent />
      </div>

      {/* Main */}
      <div className={styles.main}>
        {/* Header móvil */}
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className={styles.mobileLogo}>
            <Leaf size={18} />
            <span>SmartFoodAI</span>
          </div>
          <div style={{ width: 36 }} />
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
