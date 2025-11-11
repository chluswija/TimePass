# Implementation Guide - Timepass Updates

## 🎯 Quick Start for Developers

### What Was Changed?
1. **Search Page:** Removed post search, focus on users
2. **Save Functionality:** Added working bookmark button  
3. **Saved Sections:** Added saved posts/reels to feed

### Files to Review
- `src/pages/Search.tsx` - Simplified search
- `src/components/Post/PostCard.tsx` - Save functionality
- `src/pages/Feed.tsx` - Saved sections

---

## 💾 File Changes Reference

### 1. Search.tsx - Complete Refactor

**Removed:**
```tsx
// ❌ OLD - Remove these
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
const [postResults, setPostResults] = useState<any[]>([]);
const [activeTab, setActiveTab] = useState('users');

// Remove entire post search logic
const posts = postsSnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter((post: any) => 
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .slice(0, 20);
setPostResults(posts);

// Remove tabs JSX rendering
```

**Kept:**
```tsx
// ✅ Keep these
const [searchResults, setSearchResults] = useState<any[]>([]);
const [dynamicPosts, setDynamicPosts] = useState<any[]>([]);

// Keep user search only
const users = usersSnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter((user: any) => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
```

**Updated Placeholder:**
```tsx
// ❌ OLD
placeholder="Search users or posts..."

// ✅ NEW
placeholder="Search users..."
```

---

### 2. PostCard.tsx - Save Functionality

**Add to imports (if not present):**
```tsx
import { deleteDoc } from 'firebase/firestore'; // Add if missing
```

**Add state:**
```tsx
const [saved, setSaved] = useState(false); // Add to state array
```

**Add checkSaveStatus function:**
```tsx
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
```

**Call in useEffect:**
```tsx
checkSaveStatus(); // Add to useEffect after checkLikeStatus()
```

**Add handleSave function:**
```tsx
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
```

**Update Bookmark Button:**
```tsx
// ❌ OLD
<Button 
  variant="ghost" 
  size="icon" 
  className="h-10 w-10 hover:bg-accent transition-colors"
>
  <Bookmark className="h-6 w-6" />
</Button>

// ✅ NEW
<Button 
  variant="ghost" 
  size="icon" 
  className="h-10 w-10 hover:bg-accent transition-colors"
  onClick={handleSave}
>
  <Bookmark className={`h-6 w-6 transition-all ${saved ? 'fill-primary text-primary' : 'text-foreground'}`} />
</Button>
```

---

### 3. Feed.tsx - Saved Sections

**Update imports:**
```tsx
// ✅ Add these imports
import { getDoc, doc } from 'firebase/firestore';
// Remove if not needed: import { getDocs, where, onSnapshot, ... }
```

**Add states:**
```tsx
const [savedPosts, setSavedPosts] = useState<any[]>([]);
const [savedReels, setSavedReels] = useState<any[]>([]);
```

**Add unsubscribe refs:**
```tsx
let unsubscribeSavedPosts: (() => void) | null = null;
let unsubscribeSavedReels: (() => void) | null = null;
```

**Add saved posts listener (in setupListeners):**
```tsx
if (user) {
  const savedPostsQuery = query(
    collection(db, 'saves'),
    where('userId', '==', user.uid),
    orderBy('timestamp', 'desc')
  );
  unsubscribeSavedPosts = onSnapshot(savedPostsQuery, async (snapshot) => {
    const saves = snapshot.docs.map(doc => doc.data());
    if (saves.length > 0) {
      try {
        const savedPostsData: any[] = [];
        for (const save of saves) {
          const postDoc = await getDoc(doc(db, 'posts', save.postId));
          if (postDoc.exists()) {
            savedPostsData.push({
              id: postDoc.id,
              ...postDoc.data()
            });
          }
        }
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      }
    } else {
      setSavedPosts([]);
    }
  });
}
```

**Add saved reels listener (in setupListeners):**
```tsx
if (user) {
  const savedReelsQuery = query(
    collection(db, 'saves'),
    where('userId', '==', user.uid),
    orderBy('timestamp', 'desc')
  );
  unsubscribeSavedReels = onSnapshot(savedReelsQuery, async (snapshot) => {
    const saves = snapshot.docs.map(doc => doc.data());
    if (saves.length > 0) {
      try {
        const savedReelsData: any[] = [];
        for (const save of saves) {
          const reelDoc = await getDoc(doc(db, 'posts', save.postId));
          if (reelDoc.exists()) {
            const reelData = reelDoc.data();
            if (reelData.mediaType === 'video') {
              savedReelsData.push({
                id: reelDoc.id,
                ...reelData
              });
            }
          }
        }
        setSavedReels(savedReelsData);
      } catch (error) {
        console.error('Error fetching saved reels:', error);
      }
    } else {
      setSavedReels([]);
    }
  });
}
```

**Add unsubscribes to cleanup:**
```tsx
return () => {
  if (unsubscribePosts) unsubscribePosts();
  if (unsubscribeReels) unsubscribeReels();
  if (unsubscribeStories) unsubscribeStories();
  if (unsubscribeSavedPosts) unsubscribeSavedPosts();   // ✅ ADD
  if (unsubscribeSavedReels) unsubscribeSavedReels();   // ✅ ADD
};
```

**Add UI sections (after main posts, before closing):**
```tsx
{/* Divider before Saved Sections */}
{(savedPosts.length > 0 || savedReels.length > 0) && (
  <div className="my-8 border-t border-border" />
)}

{/* Saved Reels Section */}
{!loading && savedReels.length > 0 && (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4 text-primary">Your Saved Reels</h2>
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
      {savedReels.map(reel => (
        <div key={reel.id} className="flex-shrink-0 snap-start">
          <ReelPreview reel={reel} />
        </div>
      ))}
    </div>
  </div>
)}

{/* Divider */}
{!loading && savedReels.length > 0 && savedPosts.length > 0 && (
  <div className="my-8 border-t border-border" />
)}

{/* Saved Posts Section */}
{!loading && savedPosts.length > 0 && (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-4 text-primary">Your Saved Posts</h2>
    <div className="space-y-4">
      {savedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  </div>
)}
```

---

## 🧪 Testing Guide

### Test 1: Save/Unsave Post
```
Steps:
1. Go to home page
2. Find a post
3. Click bookmark icon
4. Verify:
   - Icon fills with color
   - Toast shows "Post saved successfully"
5. Click again to unsave
6. Verify:
   - Icon becomes empty
   - Toast shows "Post removed from saved"
```

### Test 2: View Saved Posts
```
Steps:
1. Save 2-3 posts
2. Refresh page or wait for real-time update
3. Scroll to bottom of feed
4. Verify:
   - "Your Saved Posts" section appears
   - All saved posts visible
   - Bookmark icon is filled
```

### Test 3: View Saved Reels
```
Steps:
1. Save 2-3 video posts (reels)
2. Refresh page or wait for real-time update
3. Scroll below main posts
4. Verify:
   - "Your Saved Reels" section appears
   - Reels show in horizontal scroll
   - All saved reels visible
```

### Test 4: Search Users
```
Steps:
1. Go to Search page
2. Type a username
3. Verify:
   - Only users shown (no posts)
   - Results filter correctly
4. Click a user
5. Verify:
   - Navigate to their profile
6. Clear search
7. Verify:
   - Popular posts show again
```

### Test 5: No Breaking Changes
```
Steps:
1. Check Profile page - works ✓
2. Check Reels page - works ✓
3. Check Messages page - works ✓
4. Check Notifications - works ✓
5. Check Create Post - works ✓
6. Like/unlike posts - works ✓
7. Add comments - works ✓
8. Follow/unfollow users - works ✓
```

---

## 🐛 Troubleshooting

### Issue: Saved posts not showing up

**Solution:**
1. Check Firestore console - verify saves collection exists
2. Check browser console for errors
3. Verify user is authenticated
4. Clear browser cache and reload
5. Check if posts are being saved (bookmark fills)

**Debug steps:**
```tsx
// Add to Feed.tsx useEffect for debugging
console.log('Saves:', saves);
console.log('Saved Posts:', savedPostsData);
console.log('Saved Reels:', savedReelsData);
```

### Issue: Bookmark not changing color

**Solution:**
1. Check if `saved` state is updating
2. Verify CSS classes applied correctly
3. Check if fill-primary is in tailwind config
4. Clear tailwind cache

**Debug steps:**
```tsx
// Add to PostCard useEffect
console.log('Post saved status:', saved);
```

### Issue: Search not showing users

**Solution:**
1. Verify users collection in Firestore
2. Check if username field exists
3. Verify search query syntax
4. Check browser console for errors

**Debug steps:**
```tsx
// Add to Search.tsx
console.log('Search results:', users);
console.log('Search query:', searchQuery);
```

---

## 📱 Mobile Responsive

### Already Responsive Features
- ✅ Saved Reels: Horizontal scroll on mobile
- ✅ Saved Posts: Full width on mobile
- ✅ Search: Full width input
- ✅ User results: Touch-friendly spacing
- ✅ Dividers: Adjust padding on mobile

### Test Mobile
1. Use Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at 375px width (iPhone SE)
4. Verify touch targets are 44px+ minimum
5. Check landscape orientation

---

## 🔐 Security Checklist

- [ ] Add Firestore rules for `saves` collection
- [ ] Verify users can only see their own saves
- [ ] Test deletion of saves (should fail for other users)
- [ ] Verify authentication required for saving
- [ ] Check rate limiting on save operations

**Firestore Rule for saves:**
```javascript
match /saves/{saveId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
  allow delete: if request.auth.uid == resource.data.userId;
}
```

---

## 📊 Performance Tips

### Optimize Feed Loading
```tsx
// Already optimized:
limit(20) on posts
limit(12) on popular posts
limit(8) on reels
onSnapshot() for real-time

// Further optimizations (future):
- Pagination for saved posts
- Client-side caching
- Lazy loading images
```

### Optimize Search
```tsx
// Already optimized:
300ms debounce on search
Client-side filtering

// Future optimizations:
- Server-side search (Firestore index)
- Full-text search extension
- Cache popular users
```

---

## 📝 Code Examples

### How to add similar feature to ReelCard

```tsx
// In ReelCard component
const [saved, setSaved] = useState(false);

// Add checkSaveStatus in useEffect
const checkSaveStatus = async () => {
  const savesQuery = query(
    collection(db, 'saves'),
    where('reelId', '==', reel.id),
    where('userId', '==', user.uid)
  );
  const snapshot = await getDocs(savesQuery);
  setSaved(!snapshot.empty);
};

// Add handleSave function (same pattern as PostCard)
```

### How to export saved posts

```tsx
const exportSavedPosts = () => {
  const data = JSON.stringify(savedPosts, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'saved-posts.json';
  link.click();
};
```

---

## 🚀 Deployment

### Before Deploying to Production

1. **Code Review**
   - [ ] All changes reviewed
   - [ ] No console errors
   - [ ] No TypeScript errors

2. **Testing**
   - [ ] Save functionality works
   - [ ] Saved sections display
   - [ ] Search works with users
   - [ ] No breaking changes
   - [ ] Mobile responsive

3. **Firestore**
   - [ ] Create `saves` collection index
   - [ ] Add security rules
   - [ ] Test rule restrictions

4. **Deployment**
   - [ ] Build successfully (`npm run build`)
   - [ ] Deploy to staging first
   - [ ] Test in staging environment
   - [ ] Deploy to production
   - [ ] Monitor errors in console

### Post-Deployment

1. Monitor Firestore usage
2. Check for error logs
3. Verify users can save/unsave
4. Monitor performance metrics

---

## 📚 Reference Links

- Firestore Queries: https://firebase.google.com/docs/firestore/query-data
- Real-time Updates: https://firebase.google.com/docs/firestore/query-data/listen
- Security Rules: https://firebase.google.com/docs/firestore/security/rules-structure
- React Hooks: https://react.dev/reference/react

---

## 📞 Support & Questions

For issues or questions:
1. Check browser console for errors
2. Review Firestore database state
3. Check user authentication status
4. Review component props/state
5. Test with different user accounts

