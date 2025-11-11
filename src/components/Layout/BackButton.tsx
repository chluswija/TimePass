import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on home page or auth page
  const shouldShowBack = location.pathname !== '/' && !location.pathname.startsWith('/auth');

  if (!shouldShowBack) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className="h-10 w-10 hover:bg-muted transition-colors duration-200"
      title="Go back"
      aria-label="Go back to previous page"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
};

export default BackButton;
