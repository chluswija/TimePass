# Timepass App - Updated Architecture

## 🏗️ Data Flow Architecture

### Firestore Collections Structure
```
Firestore Database
├── users/
│   └── [uid]
│       ├── username
│       ├── email
│       ├── bio
│       └── profilePicUrl
├── posts/
│   └── [postId]
│       ├── authorId
│       ├── author {}
│       ├── mediaUrl
│       ├── mediaType (image/video)
│       ├── caption
│       ├── timestamp
│       └── likes/comments (counts)
├── likes/
│   └── [likeId]
│       ├── postId
│       ├── userId
│       └── timestamp
├── comments/
│   └── [commentId]
│       ├── postId
│       ├── userId
│       ├── text
│       └── timestamp
├── follows/
│   └── [followId]
│       ├── followerId
│       ├── followingId
│       └── timestamp
├── stories/ (virtual - filtered from posts where mediaType='video')
└── saves/ ⭐ NEW
    └── [saveId]
        ├── postId
        ├── userId
        └── timestamp
```

---

## 🔄 Updated Feed Flow (Home Page)

```
Feed Component
    ↓
[1] Stories Section
    ├─ Your Story (Create Post link)
    └─ Other Users' Stories (mediaType=video)
    
[2] Reels Section  
    └─ Check out Reels (mediaType=video)
    
[3] Main Posts Section
    └─ All Posts (mixed media types)
    
⭐ [4] SAVED REELS Section (NEW)
    └─ Your Saved Reels (from saves + mediaType=video)
    
⭐ [5] SAVED POSTS Section (NEW)
    └─ Your Saved Posts (from saves collection)
```

**Real-time Updates:**
```
1. Posts Collection
   ├─ onSnapshot()
   └─ Updates: posts, stories (filtered), reels (filtered)

2. Saves Collection ⭐ NEW
   ├─ onSnapshot()
   ├─ For each save: getDoc(postId)
   └─ Updates: savedPosts, savedReels
```

---

## 🔍 Search Page Flow

### Before (Old Flow)
```
Search Page
├─ Search Input
├─ If searching:
│  ├─ [TAB 1] Users Results
│  └─ [TAB 2] Posts Results ❌ REMOVED
└─ Else: Popular Posts
```

### After (New Flow) ⭐ UPDATED
```
Search Page
├─ Search Input ("Search users...")
├─ If searching:
│  └─ Users Results (username/email match)
└─ Else: Popular Posts Preview
```

**Simplified Logic:**
- Removed: Posts tab, post search logic, postResults state
- Kept: User search, popular posts discovery
- Focus: User-centric search experience

---

## ⭐ New Save/Bookmark Flow

### User Interaction Flow
```
1. User clicks Bookmark on PostCard
         ↓
2. handleSave() function executes
         ↓
3. Check if already saved
    ├─ If YES → DELETE from saves collection
    └─ If NO → ADD to saves collection
         ↓
4. Firestore updates 'saves' collection
         ↓
5. Feed.tsx onSnapshot() listener detects change
         ↓
6. Real-time update in:
    ├─ PostCard: Bookmark button fills with color
    ├─ Feed: Saved sections populate
    └─ Toast: Show feedback message
```

### Firestore Operation
```
saves Collection Operations:
┌─ CREATE (Save Post)
│  addDoc(collection(db, 'saves'), {
│    postId: post.id,
│    userId: user.uid,
│    timestamp: ISO string
│  })
│
├─ READ (Check if saved)
│  getDocs(query(
│    collection(db, 'saves'),
│    where('postId', '==', postId),
│    where('userId', '==', userId)
│  ))
│
├─ LISTEN (Real-time updates)
│  onSnapshot(query(
│    collection(db, 'saves'),
│    where('userId', '==', userId),
│    orderBy('timestamp', 'desc')
│  ), callback)
│
└─ DELETE (Unsave Post)
   deleteDoc(saveDocRef)
```

---

## 🔌 Component Dependencies

### Feed.tsx Relations
```
Feed
├── State Management
│   ├─ posts (main posts)
│   ├─ reels (video posts)
│   ├─ stories (videos for stories section)
│   ├─ savedPosts ⭐ NEW
│   ├─ savedReels ⭐ NEW
│   └─ loading
│
├── Real-time Listeners
│   ├─ Posts Collection
│   ├─ Reels Collection
│   ├─ Stories Collection
│   └─ Saves Collection ⭐ NEW
│
└── Child Components
    ├─ StoryPreview (displays stories)
    ├─ ReelPreview (displays reels)
    ├─ PostCard (displays posts)
    ├─ PostCard (displays saved posts) ⭐ NEW
    └─ ReelPreview (displays saved reels) ⭐ NEW
```

### PostCard Relations
```
PostCard
├── Props
│   └─ post: Post data
│
├── State
│   ├─ liked (like status)
│   ├─ saved ⭐ NEW (save status)
│   ├─ likesCount
│   ├─ commentsData
│   └─ commentText
│
├── Functions
│   ├─ handleLike()
│   ├─ handleSave() ⭐ NEW
│   ├─ handleComment()
│   └─ handleShare()
│
└── Real-time Listeners
    ├─ Likes Collection
    ├─ Comments Collection
    └─ Saves Collection ⭐ NEW
```

### Search.tsx Relations
```
Search
├── State
│   ├─ searchQuery
│   ├─ searchResults (users only)
│   ├─ dynamicPosts (popular posts)
│   └─ isSearching
│
├── Query Logic
│   ├─ Users Search: matches username/email
│   └─ Popular Posts: orderBy timestamp, limit 12
│
└── Display
    ├─ If searching: Show user results
    └─ Else: Show popular posts
```

---

## 🔐 Firestore Security

### Recommended Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
      allow delete: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
    }
    
    // Saves collection ⭐ NEW
    match /saves/{saveId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.userId;
    }
    
    // Likes collection
    match /likes/{likeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.userId;
    }
    
    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.userId;
    }
    
    // Follows collection
    match /follows/{followId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.followerId;
    }
  }
}
```

---

## 📊 Data Query Patterns

### Feed Listeners Setup
```typescript
// 1. Stories Query
query(
  collection(db, 'posts'),
  where('mediaType', '==', 'video'),
  orderBy('timestamp', 'desc'),
  limit(12)
)

// 2. Posts Query
query(
  collection(db, 'posts'),
  orderBy('timestamp', 'desc'),
  limit(20)
)

// 3. Reels Query
query(
  collection(db, 'posts'),
  where('mediaType', '==', 'video'),
  orderBy('timestamp', 'desc'),
  limit(8)
)

// 4. Saved Posts Query ⭐ NEW
query(
  collection(db, 'saves'),
  where('userId', '==', currentUserId),
  orderBy('timestamp', 'desc')
)
// Then for each save, getDoc(doc(db, 'posts', saveId))

// 5. Saved Reels Query ⭐ NEW
// Same as Saved Posts, filter by mediaType='video'
```

### Search Queries
```typescript
// Users Search
query(
  collection(db, 'users')
) // Then filter client-side by username/email

// Popular Posts
query(
  collection(db, 'posts'),
  orderBy('timestamp', 'desc'),
  limit(12)
)
```

---

## ⚡ Performance Optimizations

### Current Implementation
1. **Real-time Updates:** `onSnapshot()` instead of polling
2. **Debounced Search:** 300ms delay on user input
3. **Query Limits:** 
   - Posts: 20
   - Popular posts: 12
   - Stories: 12
   - Reels: 8
4. **Lazy Loading:** Saves only fetched when user exists

### Potential Future Optimizations
1. **Pagination:** Load more saved items on demand
2. **Caching:** Cache user's saved posts locally
3. **Search Indexing:** Use Firestore full-text search extension
4. **Compression:** Compress media before upload
5. **CDN:** Use Cloudinary for image optimization

---

## 🧪 Testing Scenarios

### Scenario 1: Save a Post
```
1. User opens Feed
2. Clicks bookmark on a post
3. Expected:
   - Bookmark fills with color
   - Toast: "Post saved successfully"
   - Save appears in Firestore
   - Post shows in "Your Saved Posts"
```

### Scenario 2: Unsave a Post
```
1. User clicks filled bookmark
2. Expected:
   - Bookmark becomes empty
   - Toast: "Post removed from saved"
   - Save deleted from Firestore
   - Post removes from "Your Saved Posts"
```

### Scenario 3: Search User
```
1. User types in search (e.g., "john")
2. Expected:
   - Shows users matching "john"
   - Popular posts hidden
   - Can click user to visit profile
```

### Scenario 4: View Popular Posts
```
1. Search page loads (no query)
2. Expected:
   - Shows "Popular Posts" section
   - Displays 12 recent posts
   - Click on post to open details
```

---

## 📈 Metrics & Tracking

### Feature Usage (Recommended to add)
- Saved posts count per user
- Most saved posts (trending content)
- Save conversion rate
- Search query analysis

### Performance Metrics
- Feed load time
- Search response time
- Save operation latency
- Listener setup time

---

## 🔮 Future Features (Roadmap)

1. **Collections:** Create custom collections of saved posts
2. **Sharing:** Share saved collections with friends
3. **Export:** Download saved posts as zip
4. **Discovery:** "Trending Saves" - most saved posts
5. **Recommendations:** Based on saved content
6. **Search in Saved:** Full-text search within saves
7. **Bulk Actions:** Multi-select delete/move
8. **Smart Sort:** Sort saves by date, popularity, type

---

## 📝 Summary

The updated architecture maintains existing functionality while adding:

✅ **Search Simplification:** Focused on users, cleaner interface
✅ **Save Functionality:** Real-time bookmark system  
✅ **Saved Collections:** Dedicated sections for saved content
✅ **Real-time Sync:** Instant updates via Firebase listeners
✅ **Zero Breaking Changes:** All existing features work as before

**Total Impact:**
- 3 files modified
- 1 new Firestore collection
- 2 new UI sections
- 4 new state variables
- 3 new real-time listeners
