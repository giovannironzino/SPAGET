import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Sliders,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  UtensilsCrossed,
  Sparkles,
  Shield
} from 'lucide-react';
import { userPreferencesService } from '../services/userPreferencesService';
import { systemConfig } from '../services/systemConfigService';
import { useSpaget } from '../context/SpagetContext';
import type { UserFoodPreferences } from '../types/userPreferences';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useSpaget();
  const userId = user?.uid || 'guest-user';

  const [preferences, setPreferences] = useState<UserFoodPreferences>({
    userId,
    dietaryStyle: 'omnivore',
    blacklistedFoods: [],
    allergies: [],
    favoriteArchetypeIds: [],
    hiddenArchetypeIds: [],
    updatedAt: new Date().toISOString(),
  });

  const [newBlacklistInput, setNewBlacklistInput] = useState('');
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      userPreferencesService.loadPreferences(userId).then((loaded) => {
        setPreferences(loaded);
      });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await userPreferencesService.savePreferences(preferences);
    showToast('Preferências salvas com sucesso no seu perfil!');
    setTimeout(() => onClose(), 800);
  };

  const handleAddBlacklist = () => {
    if (!newBlacklistInput.trim()) return;
    const val = newBlacklistInput.trim();
    if (!preferences.blacklistedFoods?.includes(val)) {
      setPreferences({
        ...preferences,
        blacklistedFoods: [...(preferences.blacklistedFoods || []), val],
      });
    }
    setNewBlacklistInput('');
  };

  const handleRemoveBlacklist = (item: string) => {
    setPreferences({
      ...preferences,
      blacklistedFoods: (preferences.blacklistedFoods || []).filter((b) => b !== item),
    });
  };

  const handleAddAllergy = () => {
    if (!newAllergyInput.trim()) return;
    const val = newAllergyInput.trim();
    if (!preferences.allergies?.includes(val)) {
      setPreferences({
        ...preferences,
        allergies: [...(preferences.allergies || []), val],
      });
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (item: string) => {
    setPreferences({
      ...preferences,
      allergies: (preferences.allergies || []).filter((a) => a !== item),
    });
  };

  const archetypes = systemConfig.getArchetypes();

  return (
    <div className="fixed inset-0 bg-[#22201D]/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in text-left">
      <div className="bg-[#FAF7F1] border border-[#E1DBD2] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-white border-b border-[#E1DBD2] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F0E6] border border-[#4F7655]/30 flex items-center justify-center text-[#4F7655]">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#22201D] tracking-tight">
                Minhas Preferências Alimentares
              </h2>
              <p className="text-[11px] text-[#5C5852]">
                Personalize seu estilo, aversões e alimentos favoritos salvos exclusivamente na sua conta.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOAST FEEDBACK */}
        {feedbackMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{feedbackMessage}</span>
            </div>
          </div>
        )}

        {/* CONTENT FORM */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* ESTILO ALIMENTAR */}
          <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl space-y-2.5">
            <label className="font-black text-[#22201D] block">
              1. Meu Estilo Alimentar Principal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'omnivore', label: '🥩 Onívoro (Completo)' },
                { id: 'vegetarian', label: '🧀 Vegetariano (Com Ovos/Queijos)' },
                { id: 'vegan', label: '🌱 100% Vegano (Sem Animal)' },
                { id: 'glutenFree', label: '🌾 Sem Glúten' },
                { id: 'lactoseFree', label: '🥛 Sem Lactose' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setPreferences({ ...preferences, dietaryStyle: st.id as any })}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    preferences.dietaryStyle === st.id
                      ? 'border-[#4F7655] bg-[#E6F0E6] text-[#4F7655] shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* BLACKLIST DE ALIMENTOS QUE DETESTA */}
          <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl space-y-2.5">
            <label className="font-black text-[#22201D] block">
              2. Alimentos que DETESTO (Nunca colocar no meu cardápio):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: quiabo, coentro, fígado..."
                value={newBlacklistInput}
                onChange={(e) => setNewBlacklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBlacklist();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-[#E1DBD2] rounded-lg font-bold bg-[#FAF7F1]/40"
              />
              <button
                type="button"
                onClick={handleAddBlacklist}
                className="px-3 py-1.5 bg-[#4F7655] hover:bg-[#3d5d42] text-white font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(preferences.blacklistedFoods || []).map((food) => (
                <span
                  key={food}
                  className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full font-bold flex items-center gap-1.5"
                >
                  <span>{food}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlacklist(food)}
                    className="text-red-500 hover:text-red-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(preferences.blacklistedFoods || []).length === 0 && (
                <span className="text-gray-400 italic text-[11px]">Nenhum alimento na lista de exclusão.</span>
              )}
            </div>
          </div>

          {/* ALERGIAS E INTOLERÂNCIAS */}
          <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl space-y-2.5">
            <label className="font-black text-[#22201D] block">
              3. Alergias e Intolerâncias Diagnosticadas:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: camarão, amendoim, nozes..."
                value={newAllergyInput}
                onChange={(e) => setNewAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-[#E1DBD2] rounded-lg font-bold bg-[#FAF7F1]/40"
              />
              <button
                type="button"
                onClick={handleAddAllergy}
                className="px-3 py-1.5 bg-[#C8442F] hover:bg-[#9F3022] text-white font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(preferences.allergies || []).map((allergy) => (
                <span
                  key={allergy}
                  className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-bold flex items-center gap-1.5"
                >
                  <span>{allergy}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(allergy)}
                    className="text-amber-700 hover:text-amber-950"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(preferences.allergies || []).length === 0 && (
                <span className="text-gray-400 italic text-[11px]">Nenhuma alergia cadastrada.</span>
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Salvo com segurança em user_food_preferences/{userId}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Preferências</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
