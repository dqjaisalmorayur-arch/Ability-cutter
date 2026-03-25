import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile, Language } from '../types';

export const authService = {
  // Google Sign In
  signInWithGoogle: async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return await authService.syncUserProfile(user);
  },

  // Email/Password Login
  login: async (email: string, password: string): Promise<UserProfile> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return await authService.syncUserProfile(result.user);
  },

  // Email/Password Registration
  register: async (email: string, password: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      fullName: profileData.fullName || user.displayName || email.split('@')[0],
      role: user.email === 'dqjaisalmorayur@gmail.com' ? 'admin' : 'student',
      age: profileData.age,
      phone: profileData.phone,
      preferredLanguage: profileData.preferredLanguage || 'ml',
      preferredScreenReader: profileData.preferredScreenReader || 'nvda'
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return profile;
  },

  // Sync profile from Firestore
  syncUserProfile: async (user: User): Promise<UserProfile> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      // Create default profile if it doesn't exist (e.g., first time Google Login)
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        fullName: user.displayName || user.email?.split('@')[0] || 'User',
        role: user.email === 'dqjaisalmorayur@gmail.com' ? 'admin' : 'student',
        preferredLanguage: 'ml',
        preferredScreenReader: 'nvda'
      };
      
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return profile;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  onAuthChange: (callback: (profile: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await authService.syncUserProfile(user);
        callback(profile);
      } else {
        callback(null);
      }
    });
  }
};
