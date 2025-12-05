import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Trash2, Reply, Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface PostCardProps {
  post: {
    id: string;
    authorId?: string;
    author: {
      username: string;
      profilePic?: string;
    };
    mediaUrl: string;
    mediaType?: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: string;
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentsData, setCommentsData] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const emojis = ['❤️', '😂', '😮', '😢', '👍', '🔥', '🎉', '💯'];
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has liked this post
    const checkLikeStatus = async () => {
      const likesQuery = query(
        collection(db, 'likes'),
        where('postId', '==', post.id),
        where('userId', '==', user.uid)
      );
      const likesSnapshot = await getDocs(likesQuery);
      setLiked(!likesSnapshot.empty);
    };

    // Check if user has saved this post
    const checkSaveStatus = async () => {
      const savesQuery = query(
        collection(db, 'saves'),
        where('postId', '==', post.id),
        where('userId', '==', user.uid)
      );
      const savesSnapshot = await getDocs(savesQuery);
      setSaved(!savesSnapshot.empty);
    };

    // Listen to real-time likes count
    const likesQuery = query(collection(db, 'likes'), where('postId', '==', post.id));
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      setLikesCount(snapshot.size);
    });

    // Listen to real-time comments
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', post.id)
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommentsData(comments);
    });

    checkLikeStatus();
    checkSaveStatus();

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        // Unlike
        const likesQuery = query(
          collection(db, 'likes'),
          where('postId', '==', post.id),
          where('userId', '==', user.uid)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likesSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        setLiked(false);
      } else {
        // Like
        await addDoc(collection(db, 'likes'), {
          postId: post.id,
          userId: user.uid,
          timestamp: new Date().toISOString(),
        });
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({ title: 'Error', description: 'Failed to update like', variant: 'destructive' });
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData: any = {
        postId: post.id,
        userId: user.uid,
        username: user.displayName || 'User',
        text: commentText,
        timestamp: new Date().toISOString(),
      };

      // If replying to someone
      if (replyingTo) {
        commentData.replyTo = replyingTo.id;
        commentData.replyToUsername = replyingTo.username;
        
        // Create notification for the person being replied to
        await addDoc(collection(db, 'commentReplies'), {
          postId: post.id,
          commentId: replyingTo.id,
          userId: replyingTo.id, // The person being notified
          replyUserId: user.uid,
          replyUsername: user.displayName || 'User',
          text: commentText,
          timestamp: new Date().toISOString(),
        });
      }

      await addDoc(collection(db, 'comments'), commentData);
      setCommentText('');
      setReplyingTo(null);
      toast({ title: replyingTo ? 'Reply added successfully' : 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author.username}`,
          text: post.caption,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link copied to clipboard!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (saved) {
        // Unsave post
        const savesQuery = query(
          collection(db, 'saves'),
          where('postId', '==', post.id),
          where('userId', '==', user.uid)
        );
        const savesSnapshot = await getDocs(savesQuery);
        savesSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        setSaved(false);
        toast({ title: 'Post removed from saved' });
      } else {
        // Save post
        await addDoc(collection(db, 'saves'), {
          postId: post.id,
          userId: user.uid,
          timestamp: new Date().toISOString(),
        });
        setSaved(true);
        toast({ title: 'Post saved successfully' });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' });
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post.authorId || user.uid !== post.authorId) return;

    try {
      // Delete the post
      await deleteDoc(doc(db, 'posts', post.id));

      // Delete all likes for this post
      const likesQuery = query(collection(db, 'likes'), where('postId', '==', post.id));
      const likesSnapshot = await getDocs(likesQuery);
      likesSnapshot.forEach(async (likeDoc) => {
        await deleteDoc(likeDoc.ref);
      });

      // Delete all comments for this post
      const commentsQuery = query(collection(db, 'comments'), where('postId', '==', post.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach(async (commentDoc) => {
        await deleteDoc(commentDoc.ref);
      });

      // Delete all saves for this post
      const savesQuery = query(collection(db, 'saves'), where('postId', '==', post.id));
      const savesSnapshot = await getDocs(savesQuery);
      savesSnapshot.forEach(async (saveDoc) => {
        await deleteDoc(saveDoc.ref);
      });

      toast({ title: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user || user.uid !== commentUserId) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      toast({ title: 'Comment deleted' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const isPostAuthor = user && post.authorId && user.uid === post.authorId;

  return (
    <Card 
      className="border border-border rounded-none md:rounded-lg overflow-hidden mb-4 relative"
      onClick={() => isPostAuthor && setShowDeleteButton(!showDeleteButton)}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.profilePic} />
            <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{post.author.username}</span>
        </div>
        {isPostAuthor && showDeleteButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 animate-in fade-in-0 zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Post Media */}
      <div className="relative aspect-square bg-muted" onClick={(e) => e.stopPropagation()}>
        {post.mediaType === 'video' ? (
          <video
            src={post.mediaUrl}
            className="w-full h-full object-cover"
            controls
            loop
            playsInline
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full h-full object-cover"
            onDoubleClick={handleLike}
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-accent transition-colors"
              onClick={handleLike}
            >
              <Heart 
                className={`h-6 w-6 transition-all ${liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} 
              />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 hover:bg-accent transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] flex flex-col">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-center font-semibold">Comments ({commentsData.length})</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Comments List - Scrollable */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {commentsData.length > 0 ? (
                      commentsData.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group px-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="font-semibold text-sm">{comment.username}</span>
                                {comment.replyToUsername && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    replying to @{comment.replyToUsername}
                                  </span>
                                )}
                                <p className="text-sm mt-0.5">{comment.text}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                  </span>
                                  {user && comment.userId !== user.uid && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                        onClick={() => setReplyingTo({ id: comment.userId, username: comment.username })}
                                      >
                                        <Reply className="h-3 w-3 mr-1" />
                                        Reply
                                      </Button>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                          >
                                            <Smile className="h-3 w-3 mr-1" />
                                            React
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2">
                                          <div className="flex gap-1">
                                            {emojis.map((emoji) => (
                                              <button
                                                key={emoji}
                                                onClick={() => {
                                                  setCommentText(emoji);
                                                  setReplyingTo({ id: comment.userId, username: comment.username });
                                                }}
                                                className="text-xl hover:scale-125 transition-transform p-1"
                                              >
                                                {emoji}
                                              </button>
                                            ))}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </>
                                  )}
                                </div>
                              </div>
                              {user && comment.userId === user.uid && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this comment? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteComment(comment.id, comment.userId)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center py-8">
                        <div>
                          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No comments yet</p>
                          <p className="text-sm text-muted-foreground">Be the first to comment!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Comment Input - Fixed at Bottom */}
                  <div className="border-t bg-background p-4 mt-auto">
                    <div className="flex gap-3 items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback>{user?.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                          className="flex-1 border-2 focus-visible:ring-2 focus-visible:ring-primary"
                          disabled={isSubmitting}
                        />
                        <Button 
                          onClick={handleComment} 
                          disabled={isSubmitting || !commentText.trim()}
                          className="px-6"
                          size="default"
                        >
                          {isSubmitting ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-accent transition-colors"
              onClick={handleShare}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 hover:bg-accent transition-colors"
            onClick={handleSave}
          >
            <Bookmark className={`h-6 w-6 transition-all ${saved ? 'fill-primary text-primary' : 'text-foreground'}`} />
          </Button>
        </div>

        {/* Likes Count with Badge */}
        <div className="text-sm font-semibold mb-2 text-foreground px-1">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        <div className="text-sm mb-3 px-1">
          <span className="font-semibold text-foreground">{post.author.username}</span>
          <span className="ml-2 text-foreground">{post.caption}</span>
        </div>

        {/* Comments Count Link */}
        {commentsData.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 px-1">
                View all {commentsData.length} {commentsData.length === 1 ? 'comment' : 'comments'}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Comments</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full mt-4">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {commentsData.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-sm">{comment.username}</span>
                        <p className="text-sm">{comment.text}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <Button onClick={handleComment} disabled={isSubmitting}>
                    Post
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground px-1">
          {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
