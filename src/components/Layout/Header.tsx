import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from './BackButton';
import { MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Header = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // Check if the current route matches
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BackButton />
            <Link to="/" className="text-2xl font-bold">
              Timepass
            </Link>
          </div>

          {/* Mobile-only Messages and Notifications icons */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-colors',
                  isActive('/notifications')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Notifications"
                aria-label="Notifications"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/messages">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-colors',
                  isActive('/messages')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Messages"
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
