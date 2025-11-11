import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ReelPreviewProps {
  reel: {
    id: string;
    author: {
      username: string;
      profilePic?: string;
    };
    mediaUrl: string;
    caption: string;
  };
}

const ReelPreview = ({ reel }: ReelPreviewProps) => {
  return (
    <div className="group relative rounded-lg overflow-hidden bg-muted aspect-video hover:opacity-80 transition-opacity cursor-pointer">
      {/* Reel Thumbnail */}
      <div className="absolute inset-0 w-full h-full">
        <video
          src={reel.mediaUrl}
          className="w-full h-full object-cover"
          muted
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Reel Badge */}
      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
        Reel
      </Badge>

      {/* Author Info at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
        <Avatar className="h-8 w-8 border-2 border-white">
          <AvatarImage src={reel.author.profilePic} />
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {reel.author.username}
          </p>
          <p className="text-white/70 text-xs truncate line-clamp-1">
            {reel.caption}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReelPreview;
