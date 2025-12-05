import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Trash2, ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, query, collection, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReelCardProps {
  reel: {
    id: string;
    authorId?: string;
    author: {
      username: string;
      profilePic?: string;
    };
    mediaUrl: string;
    caption: string;
    likes: number;
    comments: number;
  };
  isActive: boolean;
}

const ReelCard = ({ reel, isActive }: ReelCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(false); // Changed from true to false - audio enabled by default
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleDeleteReel = async () => {
    if (!user || !reel.authorId || user.uid !== reel.authorId) return;

    try {
      // Delete the reel (post)
      await deleteDoc(doc(db, 'posts', reel.id));

      // Delete all likes for this reel
      const likesQuery = query(collection(db, 'likes'), where('postId', '==', reel.id));
      const likesSnapshot = await getDocs(likesQuery);
      likesSnapshot.forEach(async (likeDoc) => {
        await deleteDoc(likeDoc.ref);
      });

      // Delete all comments for this reel
      const commentsQuery = query(collection(db, 'comments'), where('postId', '==', reel.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach(async (commentDoc) => {
        await deleteDoc(commentDoc.ref);
      });

      // Delete all saves for this reel
      const savesQuery = query(collection(db, 'saves'), where('postId', '==', reel.id));
      const savesSnapshot = await getDocs(savesQuery);
      savesSnapshot.forEach(async (saveDoc) => {
        await deleteDoc(saveDoc.ref);
      });

      toast({ title: 'Reel deleted successfully' });
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast({ title: 'Error', description: 'Failed to delete reel', variant: 'destructive' });
    }
  };

  const isReelAuthor = user && reel.authorId && user.uid === reel.authorId;

  return (
    <div 
      className="relative h-screen w-full snap-start snap-always bg-background"
      onClick={() => isReelAuthor && setShowDeleteButton(!showDeleteButton)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.mediaUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={muted}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* Back Button - Top Left */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
        title="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* User Info - Top Center/Right */}
      <div className="absolute top-4 left-20 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/30">
            <AvatarImage src={reel.author.profilePic} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {reel.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-white text-base drop-shadow-lg">
            {reel.author.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isReelAuthor && (
            <Button 
              size="sm" 
              onClick={() => setIsFollowing(!isFollowing)}
              className={`h-8 px-4 font-semibold rounded-full shadow-lg transition-all ${
                isFollowing 
                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
          {isReelAuthor && showDeleteButton && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive bg-background/80 hover:bg-background animate-in fade-in-0 zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Reel</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this reel? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteReel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleLike}
          >
            <Heart 
              className={`h-7 w-7 ${liked ? 'fill-destructive text-destructive' : ''}`} 
            />
          </Button>
          <span className="text-xs font-semibold text-primary-foreground">
            {reel.likes + (liked ? 1 : 0)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          >
            <MessageCircle className="h-7 w-7" />
          </Button>
          <span className="text-xs font-semibold text-primary-foreground">
            {reel.comments}
          </span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
        >
          <Send className="h-7 w-7" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          onClick={handleSave}
        >
          <Bookmark 
            className={`h-7 w-7 ${saved ? 'fill-primary-foreground' : ''}`} 
          />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          onClick={toggleMute}
        >
          {muted ? (
            <VolumeX className="h-7 w-7" />
          ) : (
            <Volume2 className="h-7 w-7" />
          )}
        </Button>
      </div>

      {/* Bottom Caption */}
      <div className="absolute bottom-4 left-4 right-20 z-10">
        <p className="text-sm text-primary-foreground line-clamp-2">
          <span className="font-semibold">{reel.author.username}</span> {reel.caption}
        </p>
      </div>
    </div>
  );
};

export default ReelCard;
