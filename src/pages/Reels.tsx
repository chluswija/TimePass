import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReelCard from '@/components/Reel/ReelCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PlusSquare } from 'lucide-react';

const Reels = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Real-time listener for reels (only reel-type content)
    const reelsQuery = query(
      collection(db, 'posts'),
      where('contentType', '==', 'reel'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      reelsQuery,
      (snapshot) => {
        const reelsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReels(reelsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching reels:', error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = window.innerHeight;
      const index = Math.round(scrollTop / height);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background relative">
        {/* Back button for empty state */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-50 h-10 w-10 hover:bg-muted transition-colors"
          title="Go back to home"
          aria-label="Go back to home"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="text-center space-y-4">
          <div className="mb-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <video className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2 text-lg font-medium">No reels yet</p>
            <p className="text-sm text-muted-foreground mb-6">Upload a video to create your first reel!</p>
          </div>
          <Button 
            onClick={() => navigate('/create')}
            size="lg"
            className="mx-auto"
          >
            Create Reel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">

      {/* Create Reel Button - floating bottom right */}
      <Button
        variant="default"
        size="icon"
        onClick={() => navigate('/create')}
        className="absolute bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Create new reel"
        aria-label="Create new reel"
      >
        <PlusSquare className="h-6 w-6" />
      </Button>

      <div 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {reels.map((reel, index) => (
          <ReelCard 
            key={reel.id} 
            reel={reel} 
            isActive={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default Reels;
