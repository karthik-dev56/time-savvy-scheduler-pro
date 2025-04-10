
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, ShieldCheck, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { userRole, loading: roleLoading } = useRoleManagement();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Sign In
      </Button>
    );
  }

  const initials = user.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : 'U';

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {userRole && !roleLoading && (
              <div className="mt-2">
                <Badge variant="outline" className={`${getRoleBadgeColor()} flex items-center gap-1`}>
                  <ShieldCheck className="h-3 w-3" /> {userRole}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {(userRole === 'admin' || userRole === 'manager') && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Admin Panel</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/', { state: { activeTab: 'settings' }})}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
