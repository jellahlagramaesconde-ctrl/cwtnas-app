
# Firebase Integration Guide for CWTNAS

## 1. Fix the "Error Saving Rules" (Critical)

The error in your screenshot happened because of missing brackets `}` in the code. 
**Choose OPTION 1 to get everything working immediately.**

### OPTION 1: Development Mode (Recommended for Setup)
Use this to fix "No drivers found" and "Permission Denied" errors instantly.

1.  Go to **Firebase Console** > **Firestore Database** > **Rules**.
2.  Delete all existing code.
3.  Paste this exact block:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4.  Click **Publish**.

---

### OPTION 2: Secure Mode (Advanced)
Only use this if you are ready for production. This matches what you were trying to type in the screenshot but **fixes the syntax errors**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to access their own profiles
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Allow admins to read/write everything
    match /{document=**} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    // Allow residents to create reports and read their own
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        resource.data.reporterId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
      );
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    // Allow drivers to update their routes
    match /waste_routes/{routeId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null; // Simplified for drivers
    }
    
    // Allow everyone to read schedules and alerts
    match /schedules/{id} { allow read: if true; }
    match /alerts/{id} { allow read: if true; }
  }
}
```
