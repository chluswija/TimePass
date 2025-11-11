import { Home, Search, PlusSquare, Heart, User, Video, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MobileBottomNav from './MobileBottomNav';
import Header from './Header';

const SidebarNavigation: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { logout } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar className="hidden md:block">
        <SidebarHeader>
          <Link to="/" className="text-2xl font-bold block mb-4">
            Timepass
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <Home className="h-5 w-5 mr-2" /> Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/search">
                  <Search className="h-5 w-5 mr-2" /> Search
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/reels">
                  <Video className="h-5 w-5 mr-2" /> Reels
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/create">
                  <PlusSquare className="h-5 w-5 mr-2" /> Create
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/notifications">
                  <Heart className="h-5 w-5 mr-2" /> Notifications
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/messages">
                  <MessageCircle className="h-5 w-5 mr-2" /> Messages
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/profile">
                  <User className="h-5 w-5 mr-2" /> Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-4">
          <Button variant="ghost" onClick={logout} className="w-full">
            Logout
          </Button>
        </div>
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
