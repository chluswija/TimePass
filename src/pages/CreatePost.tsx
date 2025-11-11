import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SidebarNavigation from '@/components/Layout/SidebarNavigation';
import { Upload } from 'lucide-react';

const CreatePost = () => {
  const [searchParams] = useSearchParams();
  const isStoryMode = searchParams.get('mode') === 'story';
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // If story mode, only allow videos
      if (isStoryMode && !selectedFile.type.startsWith('video')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Stories can only be videos. Please select a video file.',
        });
        return;
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user) return;

    setLoading(true);

    try {
      // Upload to Cloudinary
      const mediaUrl = await uploadToCloudinary(file);

      // Create post in Firestore
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        author: {
          username: user.displayName || 'Anonymous',
          profilePic: user.photoURL || '',
        },
        mediaUrl,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        contentType: isStoryMode ? 'story' : (file.type.startsWith('video') ? 'reel' : 'post'), // Add contentType to distinguish
        caption,
        likes: 0,
        comments: 0,
        timestamp: new Date().toISOString(),
      });

      const isVideo = file.type.startsWith('video');
      
      toast({
        title: 'Success',
        description: isStoryMode 
          ? 'Story created successfully!' 
          : isVideo 
            ? 'Reel created successfully! Check the Reels section to view it.' 
            : 'Post created successfully!',
      });

      // Navigate to reels if it's a video, otherwise home
      navigate(isVideo && !isStoryMode ? '/reels' : '/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: isStoryMode ? 'Failed to create story. Please try again.' : 'Failed to create post. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-2xl pt-6 pb-20 md:pb-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{isStoryMode ? 'Create New Story' : 'Create New Post'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <input
                  type="file"
                  accept={isStoryMode ? "video/*" : "image/*,video/*"}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  {preview ? (
                    file?.type.startsWith('video') ? (
                      <video
                        src={preview}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {isStoryMode 
                          ? 'Click to upload video for your story'
                          : 'Click to upload image or video'}
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Caption */}
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px]"
              />

              {/* Info message for videos */}
              {file && file.type.startsWith('video') && !isStoryMode && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="text-primary font-medium">📹 Creating a Reel</p>
                  <p className="text-muted-foreground mt-1">
                    Your video will appear in the Reels section and can be viewed by all users.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!file || loading}
              >
                {loading 
                  ? (isStoryMode ? 'Creating...' : file?.type.startsWith('video') ? 'Creating Reel...' : 'Posting...')
                  : (isStoryMode ? 'Share Story' : file?.type.startsWith('video') ? 'Share Reel' : 'Share Post')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
    </SidebarNavigation>
  );
};

export default CreatePost;
