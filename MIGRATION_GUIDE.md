# Data Migration Guide

## Overview
This guide helps migrate existing video posts to use the new `contentType` field.

## What Changed?

### New Field: `contentType`
All posts now have a `contentType` field with these values:
- `'story'` - Videos created via story mode (`/create?mode=story`)
- `'reel'` - Videos created as regular reels (`/create` with video)
- `'post'` - Image posts

### Why This Change?
Previously, stories and reels were both stored with `mediaType: 'video'`, causing regular reels to appear in the stories section. Now they're properly separated.

## Migration Steps

### Option 1: Automatic Migration (Recommended for Development)

If you have existing video posts in your database, they need a `contentType` field. 

**For Firebase Console:**
1. Go to Firebase Console → Firestore Database
2. Open the `posts` collection
3. For each video post:
   - If it was created as a story: Add `contentType: 'story'`
   - If it was created as a reel: Add `contentType: 'reel'`
   - For image posts: Add `contentType: 'post'`

### Option 2: Migration Script (For Production)

Create a one-time migration script:

```javascript
// migration-script.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // ... your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);
  
  let updated = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Skip if already has contentType
    if (data.contentType) continue;
    
    let contentType;
    if (data.mediaType === 'video') {
      // Default existing videos to 'reel' (adjust based on your data)
      contentType = 'reel';
    } else {
      contentType = 'post';
    }
    
    await updateDoc(doc(db, 'posts', docSnap.id), {
      contentType: contentType
    });
    
    updated++;
    console.log(`Updated post ${docSnap.id} with contentType: ${contentType}`);
  }
  
  console.log(`Migration complete! Updated ${updated} posts.`);
}

migrateData().catch(console.error);
```

### Option 3: Clean Start (Development Only)

If you're in development and don't have important data:
1. Delete all existing posts from Firestore
2. Create new posts - they'll automatically have the `contentType` field

## Firestore Indexes

The new queries require composite indexes. Apply these indexes:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add these indexes:

**Index 1: contentType + timestamp**
- Collection: `posts`
- Fields to index:
  - `contentType` (Ascending)
  - `timestamp` (Descending)

**Index 2: authorId + timestamp** (for profile queries)
- Collection: `posts`
- Fields to index:
  - `authorId` (Ascending)
  - `timestamp` (Descending)

Or use the provided `firestore.indexes.json` file:
```bash
firebase deploy --only firestore:indexes
```

## Testing

After migration, verify:

1. **Create a Reel:**
   - Upload video via `/create`
   - Should show in `/reels` page
   - Should NOT appear in stories section on home

2. **Create a Story:**
   - Click "Your Story" → uploads video
   - Should appear in stories carousel on home
   - Should NOT appear in `/reels` page

3. **Check Existing Content:**
   - Visit home page
   - Stories section should only show story-type videos
   - Reels section should only show reel-type videos
   - Posts section should show all content

## Rollback

If you need to rollback:

1. Revert code changes in:
   - `src/pages/CreatePost.tsx`
   - `src/pages/Feed.tsx`
   - `src/pages/Reels.tsx`

2. The `contentType` field won't affect old queries (they use `mediaType`)

## Support

If you encounter issues:
- Check browser console for Firestore errors
- Verify indexes are created in Firebase Console
- Ensure all video posts have `contentType` field
