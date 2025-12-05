import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Trash2, ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
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

  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !reel.authorId || user.uid === reel.authorId) return;
      
      try {
        const followsQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followingId', '==', reel.authorId)
        );
        const followsSnapshot = await getDocs(followsQuery);
        setIsFollowing(!followsSnapshot.empty);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    checkFollowStatus();
  }, [user, reel.authorId]);

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

  const handleFollow = async () => {
    if (!user || !reel.authorId) return;

    try {
      if (isFollowing) {
        // Unfollow
        const followsQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followingId', '==', reel.authorId)
        );
        const followsSnapshot = await getDocs(followsQuery);
        followsSnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(docSnapshot.ref);
        });
        setIsFollowing(false);
        toast({ title: 'Unfollowed successfully' });
      } else {
        // Follow
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: reel.authorId,
          timestamp: new Date().toISOString(),
        });
        setIsFollowing(true);
        toast({ title: 'Following successfully' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({ title: 'Error', description: 'Failed to update follow status', variant: 'destructive' });
    }
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Back Button - Top Left Corner - Standalone */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 h-12 w-12 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all shadow-2xl backdrop-blur-md border border-white/20"
        title="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* User Info Bar - Separated from Back Button */}
      <div className="absolute top-6 left-24 right-6 flex items-center justify-between z-10 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 shadow-xl border border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-white/40 shadow-lg">
            <AvatarImage src={reel.author.profilePic} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
              {reel.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-white text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {reel.author.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isReelAuthor && (
            <Button 
              size="sm" 
              onClick={handleFollow}
              className={`h-9 px-5 font-bold rounded-full shadow-xl transition-all transform hover:scale-105 ${
                isFollowing 
                  ? 'bg-white/20 text-white border-2 border-white/50 hover:bg-white/30' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 border-none'
              }`}
            >
              <UserPlus className="h-4 w-4 mr-2" />
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
