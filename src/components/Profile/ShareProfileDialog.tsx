import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const ShareProfileDialog = ({ isOpen, onClose, user }: ShareProfileDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${user?.uid}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Profile link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out ${user?.displayName || user?.username}'s profile`,
      text: `Follow ${user?.displayName || user?.username} on Timepass`,
      url: profileUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy link
        handleCopyLink();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
          <DialogDescription>
            Share your profile with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Link */}
          <div className="space-y-2">
            <Label htmlFor="profile-link">Profile Link</Label>
            <div className="flex gap-2">
              <Input
                id="profile-link"
                value={profileUrl}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click to copy your profile link
            </p>
          </div>

          {/* Share via social/system */}
          <div className="pt-4">
            <Button
              onClick={handleShare}
              className="w-full"
              variant="default"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>

          {/* Share Info */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Share your profile with:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Copy and paste the link to friends</li>
              <li>• Share on social media</li>
              <li>• Send via messaging apps</li>
              <li>• Post on websites</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileDialog;
