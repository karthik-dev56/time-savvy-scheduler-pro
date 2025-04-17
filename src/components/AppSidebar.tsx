import React from 'react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Bell, 
  Menu, 
  Home,
  Settings,
  User,
  Database
} from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  const handleClick = () => {
    navigate(to);
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "justify-start px-4",
        isActive ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={handleClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
};

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const sidebarClasses = cn(
    "bg-background border-r border-r-border min-h-screen fixed top-0 left-0 w-64 transition-transform duration-300 z-50",
    isOpen ? "translate-x-0" : "-translate-x-full",
    {
      "shadow-md": isOpen,
    }
  );

  return (
    <aside className={cn(sidebarClasses)}>
      <nav className="space-y-2 px-2 py-5">
        <SidebarLink
          to="/"
          icon={<Home className="h-5 w-5" />}
          label="Dashboard"
        />
        <SidebarLink
          to="/calendar"
          icon={<Calendar className="h-5 w-5" />}
          label="Calendar"
        />
        <SidebarLink
          to="/notifications"
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
        />
        <SidebarLink
          to="/profile"
          icon={<User className="h-5 w-5" />}
          label="Profile"
        />
        <SidebarLink
          to="/admin"
          icon={<Settings className="h-5 w-5" />}
          label="Admin"
        />
        
        <SidebarLink
          to="/supabase-data"
          icon={<Database className="h-5 w-5" />}
          label="Supabase Data"
        />
      </nav>
    </aside>
  );
};

export default AppSidebar;
