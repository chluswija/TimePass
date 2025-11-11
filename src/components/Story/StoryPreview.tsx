import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface StoryPreviewProps {
  story: {
    id: string;
    authorId: string;
    author: {
      username: string;
      profilePic?: string;
    };
    mediaUrl: string;
    caption?: string;
    timestamp: string;
  };
  isOwnStory?: boolean;
  userName?: string;
}

const StoryPreview = ({ story, isOwnStory = false, userName }: StoryPreviewProps) => {
  if (isOwnStory) {
    // Get first letter of username for fallback
    const firstLetter = userName ? userName[0].toUpperCase() : 'U';
    
    return (
      <Link
        to="/create?mode=story"
        className="flex flex-col items-center gap-2 cursor-pointer group"
      >
        <div className="relative">
          <Avatar className="h-16 w-16 ring-2 ring-gray-300 group-hover:ring-primary transition-all">
            <AvatarImage src={story.author.profilePic} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
            <Plus className="h-3 w-3" />
          </div>
        </div>
        <p className="text-xs font-medium text-center truncate max-w-[80px]">Your Story</p>
      </Link>
    );
  }

  return (
    <Link
      to={`/profile/${story.authorId}`}
      className="flex flex-col items-center gap-2 cursor-pointer group"
    >
      <div className="relative">
        <Avatar className="h-16 w-16 ring-2 ring-pink-500 group-hover:ring-pink-600 transition-all">
          <AvatarImage src={story.author.profilePic} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
            {story.author.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className="text-xs font-medium text-center truncate max-w-[80px]">
        {story.author.username}
      </p>
    </Link>
  );
};

export default StoryPreview;
