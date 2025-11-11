import { Home, Search, PlusSquare, Heart, Video, MessageCircle, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileBottomNav from './MobileBottomNav';
import Header from './Header';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const SidebarNavigation: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarProvider>
      <Sidebar className="hidden md:flex md:flex-col border-r">
        <SidebarHeader className="p-6">
          <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            Timepass
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 px-3">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/') && "bg-muted font-semibold"
              )}>
                <Link to="/">
                  <Home className={cn("h-6 w-6", isActive('/') && "fill-current")} />
                  <span className="text-base">Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/reels') && "bg-muted font-semibold"
              )}>
                <Link to="/reels">
                  <Video className="h-6 w-6" />
                  <span className="text-base">Reels</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/create') && "bg-muted font-semibold"
              )}>
                <Link to="/create">
                  <PlusSquare className="h-6 w-6" />
                  <span className="text-base">Create</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/messages') && "bg-muted font-semibold"
              )}>
                <Link to="/messages">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-base">Messages</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/notifications') && "bg-muted font-semibold"
              )}>
                <Link to="/notifications">
                  <Heart className={cn("h-6 w-6", isActive('/notifications') && "fill-current")} />
                  <span className="text-base">Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className={cn(
                "w-full justify-start gap-4 px-3 py-3 rounded-lg transition-all hover:bg-muted",
                isActive('/profile') && "bg-muted font-semibold"
              )}>
                <Link to="/profile" className="flex items-center gap-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userProfile?.profilePicUrl || user?.photoURL || ''} />
                    <AvatarFallback className="text-xs">
                      {(userProfile?.username || user?.displayName)?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base">Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3 mt-auto border-t">
          <Button 
            variant="ghost" 
            onClick={logout} 
            className="w-full justify-start gap-4 px-3 py-3 rounded-lg hover:bg-muted text-base font-normal"
          >
            <LogOut className="h-6 w-6" />
            <span>Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Content area that will align with the sidebar provider on desktop */}
      <SidebarInset className="md:flex-1 flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SidebarNavigation;
