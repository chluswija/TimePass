# Timepass - Instagram Clone

A modern photo and video sharing platform built with React, Firebase, and Cloudinary.

## 🚀 Features

- **User Authentication** - Secure signup/login with Firebase Authentication
- **Photo & Video Posts** - Upload and share media with captions
- **Social Feed** - View posts from users in chronological order
- **Like & Comment** - Interact with posts in real-time
- **Save Posts** - Bookmark posts and reels for later viewing ⭐ NEW
- **Saved Collections** - "Your Saved Posts" and "Your Saved Reels" sections ⭐ NEW
- **User Profiles** - View and edit your profile with post grid
- **Search** - Find users across the platform
- **Stories & Reels** - Short-form video content
- **Notifications** - Stay updated with activity
- **Real-time Updates** - Instant sync with Firebase listeners
- **Responsive Design** - Beautiful UI on all devices (mobile, tablet, desktop)

## ⭐ Latest Updates (v1.1)

### Simplified Search
- Removed post search functionality
- Focus on user discovery
- Popular posts preview on search page

### Save Functionality
- Working bookmark button on posts
- Visual feedback (filled bookmark when saved)
- Toast notifications for save/unsave actions

### Saved Collections
- "Your Saved Reels" section (horizontal scroll)
- "Your Saved Posts" section (vertical feed)
- Only displays when you have saved items
- Real-time updates as you save/unsave

## 🛠️ Tech Stack

- **Frontend**: React.js 18.3.1 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore + Authentication)
- **Media Storage**: Cloudinary
- **Routing**: React Router v6
- **State Management**: React Context API + Firestore Real-time Listeners
- **Date Formatting**: date-fns v3.6.0

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd timepass
```

2. Install dependencies:
```bash
npm install
```

3. The Firebase and Cloudinary configurations are already set up in the code.

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Firebase Configuration
The app uses the following Firebase project:
- Project ID: `time-pass-c1b91`
- Configuration is in `src/lib/firebase.ts`

### Cloudinary Configuration
- Cloud Name: `dqjhjeqrj`
- Upload Preset: `timepass`
- Configuration is in `src/lib/cloudinary.ts`

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   └── Header.tsx        # Navigation header
│   ├── Post/
│   │   └── PostCard.tsx      # Post display component
│   └── ui/                   # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   └── cloudinary.ts         # Cloudinary upload utility
├── pages/
│   ├── Auth.tsx              # Login/Signup page
│   ├── Feed.tsx              # Home feed
│   ├── Profile.tsx           # User profile
│   ├── CreatePost.tsx        # Post creation
│   ├── Search.tsx            # User search
│   └── Notifications.tsx     # Notifications
└── App.tsx                   # Main app with routing
```

## 🎨 Design System

The app uses an Instagram-inspired design with:
- Primary color: Instagram Blue (#0095f6)
- Clean, minimal interface
- Responsive mobile-first design
- Smooth transitions and interactions

## 🔐 Authentication Flow

1. Users can sign up with email, username, and password
2. Firebase Authentication handles user management
3. User profiles are created in Firestore
4. Protected routes ensure only authenticated users can access the app

## 📸 Post Creation Flow

1. Select image or video file
2. Upload to Cloudinary (automatic)
3. Add caption
4. Post metadata saved to Firestore
5. Real-time feed update

## 🚧 Next Steps

To complete the full Instagram clone, implement:

1. **Comments System** - Add comment creation, display, and deletion
2. **Likes with Firestore** - Store and sync likes in real-time
3. **Follow/Unfollow** - User relationship management
4. **Real-time Updates** - Firestore listeners for live feed
5. **Stories** - 24-hour ephemeral content
6. **Direct Messages** - Chat functionality
7. **Explore Page** - Trending and suggested posts
8. **Notifications** - Real-time activity updates

## 📝 Firebase Security Rules

Remember to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }
  }
}
```

## 🌐 Deployment

Deploy to Firebase Hosting:

```bash
npm run build
firebase init hosting
firebase deploy
```

## 📄 License

MIT License - feel free to use this project for learning or building your own social platform!

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

---

Built with ❤️ using React, Firebase & Cloudinary
