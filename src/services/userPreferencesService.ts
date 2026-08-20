import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserFoodPreferences, UserProfileData } from '../types/userPreferences';

class UserPreferencesService {
  private currentPreferences: UserFoodPreferences | null = null;
  private currentRole: 'user' | 'admin' = 'user'; // Default seguro para qualquer usuário

  private getStorageKey(uid: string): string {
    return `spaget_user_food_preferences_${uid}`;
  }

  public async loadPreferences(uid: string): Promise<UserFoodPreferences> {
    const localKey = this.getStorageKey(uid);
    let localData: UserFoodPreferences | null = null;

    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        localData = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências locais:', e);
    }

    try {
      const userPrefRef = doc(db, 'user_food_preferences', uid);
      const snap = await getDoc(userPrefRef);
      if (snap.exists()) {
        const cloudData = snap.data() as UserFoodPreferences;
        this.currentPreferences = cloudData;
        localStorage.setItem(localKey, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (e) {
      console.warn('Erro ao consultar Firestore para preferências:', e);
    }

    if (localData) {
      this.currentPreferences = localData;
      return localData;
    }

    const defaultPrefs: UserFoodPreferences = {
      userId: uid,
      dietaryStyle: 'omnivore',
      blacklistedFoods: [],
      allergies: [],
      favoriteArchetypeIds: [],
      hiddenArchetypeIds: [],
      updatedAt: new Date().toISOString(),
    };

    this.currentPreferences = defaultPrefs;
    return defaultPrefs;
  }

  public async savePreferences(prefs: UserFoodPreferences): Promise<void> {
    prefs.updatedAt = new Date().toISOString();
    this.currentPreferences = prefs;

    const localKey = this.getStorageKey(prefs.userId);
    try {
      localStorage.setItem(localKey, JSON.stringify(prefs));
    } catch (e) {}

    try {
      const userPrefRef = doc(db, 'user_food_preferences', prefs.userId);
      await setDoc(userPrefRef, prefs, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar preferências no Firestore (armazenado localmente):', e);
    }
  }

  public getPreferences(): UserFoodPreferences | null {
    return this.currentPreferences;
  }

  public async getUserRole(uid: string): Promise<'user' | 'admin'> {
    try {
      const profileRef = doc(db, 'user_profiles', uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfileData;
        if (data.role === 'admin' || data.role === 'user') {
          this.currentRole = data.role;
          localStorage.setItem(`spaget_user_role_${uid}`, data.role);
          return data.role;
        }
      }

      const savedRole = localStorage.getItem(`spaget_user_role_${uid}`);
      if (savedRole === 'user' || savedRole === 'admin') {
        this.currentRole = savedRole;
        return savedRole;
      }
    } catch (e) {
      console.warn('Erro ao consultar perfil de usuário no Firestore:', e);
    }

    this.currentRole = 'user';
    return 'user';
  }
}

export const userPreferencesService = new UserPreferencesService();
