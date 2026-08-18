import React, { createContext, useContext, useState, useEffect } from 'react';
import { SpagetData, Debt, Expense, Skill, ActionStep } from '../types';
import { 
  auth, 
  db, 
  googleProvider 
} from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

interface SpagetContextType {
  data: SpagetData;
  updateData: (updater: (prev: SpagetData) => SpagetData) => void;
  isSaving: boolean;
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
  resetData: (preserveBase?: boolean) => void;
  getDayCount: () => number;
  getCompletedItemsCount: (stage: string) => { completed: number; total: number };
  moveToStage: (stage: SpagetData['currentStage']) => void;
  
  // Dual-Engine Cloud Auth State & Methods
  user: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginOrRegisterWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isSynced: boolean;
}

import { getDefaultExpenses } from '../data/defaultCategories';

const defaultState = (userId = 'user-default'): SpagetData => {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 20); // 21 days total (today is Day 1)

  return {
    userId: userId,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    challengeStartDate: today.toISOString().split('T')[0],
    challengeEndDate: endDate.toISOString().split('T')[0],
    currentStage: 'diagnostico',
    completedStages: [],
    
    // Etapa 1
    categorizedExpenses: getDefaultExpenses(),
    debts: [],
    fixedExpenses: [],
    variableExpenses: [],
    currentRevenue: 0,
    forgottenCategoriesChecked: [],
    stage1Confirmed: false,

    // Etapa 2
    skills: [],
    stage2Confirmed: false,

    // Etapa 3
    debtStrategy: 'snowball',
    plannedExpenses: {},
    plannedRevenue: {},
    priorityDebtId: '',
    priorityDebtPayment: 0,
    otherDebtsPayments: {},
    debtPriorityOrder: [],
    whatToCutFirst: '',
    stage3Confirmed: false,

    // Etapa 4
    selectedRevenueSourceId: '',
    actions: [],
    debtStartDates: {},
    whatToResolveNext: '',
    safetyMarginFactor: 1.5,
    stage4Confirmed: false,
  };
};

const SpagetContext = createContext<SpagetContextType | undefined>(undefined);

export const SpagetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Raw local data state
  const [data, setData] = useState<SpagetData>(() => {
    const saved = localStorage.getItem('spaget_user_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const defaults = getDefaultExpenses();
        const loadedCategorized = parsed.categorizedExpenses || {};
        
        Object.keys(defaults).forEach((key) => {
          if (!loadedCategorized[key] || !Array.isArray(loadedCategorized[key]) || loadedCategorized[key].length === 0) {
            loadedCategorized[key] = defaults[key as keyof typeof defaults];
          }
        });

        return {
          ...defaultState(),
          ...parsed,
          categorizedExpenses: loadedCategorized,
          debtStrategy: parsed.debtStrategy || 'snowball',
        };
      } catch (e) {
        console.error('Error parsing saved SPAGET local data', e);
      }
    }
    return defaultState();
  });

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Logged in: Sync Local vs Cloud
        const userRef = doc(db, 'cycles', currentUser.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const cloudData = docSnap.data() as SpagetData;
            
            // Timestamp strategy: newer wins
            const localSaved = localStorage.getItem('spaget_user_data');
            let localData: SpagetData | null = null;
            if (localSaved) {
              try {
                localData = JSON.parse(localSaved);
              } catch (e) {}
            }

            const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
            const localTime = localData ? new Date(localData.updatedAt || 0).getTime() : 0;

            if (cloudTime >= localTime) {
              // Cloud is more updated
              setData(cloudData);
              localStorage.setItem('spaget_user_data', JSON.stringify(cloudData));
            } else if (localData) {
              // Local is newer: push to cloud
              const syncedLocal = { ...localData, userId: currentUser.uid, updatedAt: new Date().toISOString() };
              setData(syncedLocal);
              await setDoc(userRef, syncedLocal);
              localStorage.setItem('spaget_user_data', JSON.stringify(syncedLocal));
            }
          } else {
            // First time login: push current local state to cloud under the user's UID
            const localSaved = localStorage.getItem('spaget_user_data');
            let initialData = localSaved ? JSON.parse(localSaved) : defaultState();
            initialData = { ...initialData, userId: currentUser.uid, updatedAt: new Date().toISOString() };
            
            setData(initialData);
            await setDoc(userRef, initialData);
            localStorage.setItem('spaget_user_data', JSON.stringify(initialData));
          }
          setIsSynced(true);
        } catch (error) {
          console.error('Error during initial Firebase sync:', error);
          setIsSynced(false);
        }
      } else {
        // Logged out: fallback fully to local storage
        setIsSynced(false);
        const saved = localStorage.getItem('spaget_user_data');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setData({ ...defaultState(), ...parsed, userId: 'user-default' });
          } catch (e) {
            setData(defaultState('user-default'));
          }
        } else {
          setData(defaultState('user-default'));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up live realtime updates when logged in
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'cycles', user.uid);
    
    const unsubscribeSnapshot = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as SpagetData;
        
        // Prevent infinite loops: only update if cloudData is strictly newer
        setData((currentLocal) => {
          const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
          const localTime = new Date(currentLocal.updatedAt || 0).getTime();
          if (cloudTime > localTime) {
            localStorage.setItem('spaget_user_data', JSON.stringify(cloudData));
            return cloudData;
          }
          return currentLocal;
        });
        setIsSynced(true);
      }
    }, (error) => {
      console.error('Firestore snapshot sync error:', error);
      setIsSynced(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // Handle local save & cloud push on data change
  useEffect(() => {
    setIsSaving(true);
    
    // Save to local storage immediately
    localStorage.setItem('spaget_user_data', JSON.stringify(data));
    
    const syncToCloud = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'cycles', user.uid);
          await setDoc(userRef, data);
          setIsSynced(true);
        } catch (error) {
          console.error('Error syncing data to Firestore:', error);
          setIsSynced(false);
        }
      }
    };

    const timer = setTimeout(() => {
      syncToCloud();
      setIsSaving(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [data, user]);

  const updateData = (updater: (prev: SpagetData) => SpagetData) => {
    setData((prev) => {
      const updated = updater(prev);
      return {
        ...updated,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Google Sign-In helper
  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      // Give details of block or iframe error
      if (err.code === 'auth/popup-blocked') {
        alert('O popup de login do Google foi bloqueado pelo seu navegador. Por favor, libere os popups para este site ou utilize o login rápido por e-mail.');
      } else {
        alert('Erro ao realizar login com o Google. Use o login rápido por e-mail se as restrições do navegador bloquearem o Google.');
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Frictionless Email login or automatic register helper
  const loginOrRegisterWithEmail = async (email: string, pass: string) => {
    try {
      setAuthLoading(true);
      if (pass.length < 6) {
        throw new Error('A senha de segurança deve conter pelo menos 6 caracteres.');
      }
      try {
        // Try logging in first
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // Automatic seamless creation for seamless experience
          await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Error with email authentication:', err);
      let BrazilianMsg = 'Erro ao realizar login por e-mail.';
      if (err.code === 'auth/wrong-password') {
        BrazilianMsg = 'Senha de segurança incorreta para este e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        BrazilianMsg = 'O endereço de e-mail fornecido é inválido.';
      } else if (err.message) {
        BrazilianMsg = err.message;
      }
      alert(BrazilianMsg);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out helper
  const logout = async () => {
    try {
      setAuthLoading(true);
      await signOut(auth);
      // Remove local copy of user data to start clean for next guest or user
      localStorage.removeItem('spaget_user_data');
      setData(defaultState('user-default'));
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const getDayCount = () => {
    if (!data.challengeStartDate) return 1;
    const start = new Date(data.challengeStartDate);
    const today = new Date();
    const startMidnight = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const diffInMs = todayMidnight - startMidnight;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
    if (diffInDays < 1) return 1;
    if (diffInDays > 21) return 21; 
    return diffInDays;
  };

  const getCompletedItemsCount = (stage: string) => {
    switch (stage) {
      case 'diagnostico': {
        const total = 4;
        let completed = 0;
        if (data.fixedExpenses.length >= 0) completed += 1;
        if (data.variableExpenses.length >= 0) completed += 1;
        if (data.forgottenCategoriesChecked.length > 0) completed += 1;
        if (data.stage1Confirmed) completed += 1;
        return { completed, total };
      }
      case 'receita': {
        const total = 3;
        let completed = 0;
        if (data.skills.length > 0) completed += 1;
        const selectedSkills = data.skills.filter(s => s.selecionada);
        const hasSteps = selectedSkills.length > 0 && selectedSkills.every(s => s.primeiroPasso && s.primeiroPasso.trim() !== '');
        if (hasSteps) completed += 1;
        if (data.stage2Confirmed) completed += 1;
        return { completed: Math.min(completed, total), total };
      }
      case 'orcamento': {
        const total = 4;
        let completed = 0;
        const allFixedPlanned = data.fixedExpenses.every(e => data.plannedExpenses[e.id] !== undefined);
        if (allFixedPlanned && data.fixedExpenses.length > 0) completed += 1;
        else if (data.fixedExpenses.length === 0) completed += 1;

        const allVarPlanned = data.variableExpenses.every(e => data.plannedExpenses[e.id] !== undefined);
        if (allVarPlanned && data.variableExpenses.length > 0) completed += 1;
        else if (data.variableExpenses.length === 0) completed += 1;

        const selectedSkills = data.skills.filter(s => s.selecionada);
        const allRevenuePlanned = selectedSkills.every(s => data.plannedRevenue[s.id] !== undefined) && data.plannedRevenue['base'] !== undefined;
        if (allRevenuePlanned) completed += 1;

        if (data.stage3Confirmed) completed += 1;
        return { completed, total };
      }
      case 'plano': {
        const total = 4;
        let completed = 0;
        if (data.selectedRevenueSourceId) completed += 1;
        if (data.actions.length > 0) completed += 1;
        if (data.whatToResolveNext.trim() !== '') completed += 1;
        if (data.stage4Confirmed) completed += 1;
        return { completed, total };
      }
      default:
        return { completed: 0, total: 0 };
    }
  };

  const exportBackup = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `spaget-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && typeof parsed === 'object') {
        const uid = user ? user.uid : 'user-default';
        setData({
          ...defaultState(uid),
          ...parsed,
          userId: uid,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to import backup file', e);
    }
    return false;
  };

  const resetData = (preserveBase: boolean = false) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 20);

    const uid = user ? user.uid : 'user-default';

    if (preserveBase) {
      setData((prev) => ({
        ...defaultState(uid),
        debts: prev.debts,
        fixedExpenses: prev.fixedExpenses,
        variableExpenses: prev.variableExpenses,
        currentRevenue: prev.currentRevenue,
        forgottenCategoriesChecked: prev.forgottenCategoriesChecked,
        skills: prev.skills,
        challengeStartDate: today.toISOString().split('T')[0],
        challengeEndDate: endDate.toISOString().split('T')[0],
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      }));
    } else {
      if (window.confirm('Tem certeza de que deseja apagar todos os dados e reiniciar seu ciclo SPAGET do zero?')) {
        setData(defaultState(uid));
      }
    }
  };

  const moveToStage = (stage: SpagetData['currentStage']) => {
    if (stage === 'diagnostico') {
      updateData(prev => ({ ...prev, currentStage: 'diagnostico' }));
      return;
    }
    if (stage === 'receita') {
      if (data.stage1Confirmed || data.completedStages.includes('diagnostico')) {
        updateData(prev => ({ ...prev, currentStage: 'receita' }));
      }
      return;
    }
    if (stage === 'orcamento') {
      if ((data.stage1Confirmed && data.stage2Confirmed) || data.completedStages.includes('receita')) {
        updateData(prev => ({ ...prev, currentStage: 'orcamento' }));
      }
      return;
    }
    if (stage === 'plano') {
      if ((data.stage1Confirmed && data.stage2Confirmed && data.stage3Confirmed) || data.completedStages.includes('orcamento')) {
        updateData(prev => ({ ...prev, currentStage: 'plano' }));
      }
      return;
    }
    if (stage === 'concluido') {
      if (data.stage1Confirmed && data.stage2Confirmed && data.stage3Confirmed && data.stage4Confirmed) {
        updateData(prev => ({ ...prev, currentStage: 'concluido' }));
      }
      return;
    }
  };

  return (
    <SpagetContext.Provider
      value={{
        data,
        updateData,
        isSaving,
        exportBackup,
        importBackup,
        resetData,
        getDayCount,
        getCompletedItemsCount,
        moveToStage,
        
        // Cloud integration exports
        user,
        authLoading,
        signInWithGoogle,
        loginOrRegisterWithEmail,
        logout,
        isSynced
      }}
    >
      {children}
    </SpagetContext.Provider>
  );
};

export const useSpaget = () => {
  const context = useContext(SpagetContext);
  if (context === undefined) {
    throw new Error('useSpaget must be used within a SpagetProvider');
  }
  return context;
};
