import React, { useState, useEffect } from 'react';
import { BRAZIL_STATES } from '../data/brazilLocations';
import { 
  BehavioralFoodItem, 
  ShoppingLocation, 
  SHOPPING_LOCATIONS_INFO, 
  DEFAULT_BEHAVIORAL_ITEMS, 
  analyzeBehavioralEnergyBalance 
} from '../services/behaviorAnalyzer';
import { 
  BiometricProfile, 
  BiometricResult, 
  calculateBiometrics, 
  ResearchEvidence 
} from '../services/nutritionCalculator';
import { 
  X, 
  Heart, 
  Globe, 
  Search, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShoppingBag, 
  MapPin, 
  FileText, 
  Apple, 
  Plus, 
  Minus, 
  Edit3, 
  MessageSquare, 
  Store, 
  Coffee,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface NutritionalFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportToDiagnostico: (breakdown: { mercado: number; feira: number; padaria: number }) => void;
}

export const NutritionalFoodModal: React.FC<NutritionalFoodModalProps> = ({
  isOpen,
  onClose,
  onExportToDiagnostico,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputMode, setInputMode] = useState<'routineText' | 'shoppingLocations'>('routineText');
  const [activeLocationTab, setActiveLocationTab] = useState<ShoppingLocation>('supermarket');

  // Location State
  const [selectedUf, setSelectedUf] = useState<string>('SP');
  const [selectedCity, setSelectedCity] = useState<string>('São Paulo');

  // Profile State
  const [profile, setProfile] = useState<BiometricProfile>({
    weightKg: 70,
    heightCm: 172,
    ageYears: 32,
    sex: 'male',
    activityLevel: 'light',
    numberOfDependents: 1,
    cityState: 'São Paulo / SP',
    weightGoal: 'maintain',
  });

  // Natural Language Routine Text State
  const [routineText, setRoutineText] = useState<string>(
    'No café da manhã tomamos café com leite e 2 pães com manteiga. No almoço comemos arroz, feijão e frango de segunda a sexta, e peixe no fim de semana. À noite comemos sopa de legumes ou cuscuz. Na feira compramos banana, laranja, tomate e alface semanalmente.'
  );
  const [isAnalyzingRoutine, setIsAnalyzingRoutine] = useState(false);
  const [routineFeedbackNote, setRoutineFeedbackNote] = useState<string | null>(null);

  // Behavioral Active Items List
  const [behavioralItems, setBehavioralItems] = useState<BehavioralFoodItem[]>(DEFAULT_BEHAVIORAL_ITEMS);
  const [newItemName, setNewItemName] = useState('');

  // Web Research Evidence State
  const [researchEvidence, setResearchEvidence] = useState<ResearchEvidence | null>(null);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [safetyMarginPct, setSafetyMarginPct] = useState<number>(15);

  // Synchronize cityState
  useEffect(() => {
    setProfile((prev) => ({ ...prev, cityState: `${selectedCity} / ${selectedUf}` }));
  }, [selectedUf, selectedCity]);

  if (!isOpen) return null;

  const householdCount = Math.max(1, 1 + profile.numberOfDependents);
  const biometrics: BiometricResult = calculateBiometrics(profile);
  const energyBalance = analyzeBehavioralEnergyBalance(
    householdCount,
    biometrics.totalHouseholdKcal,
    behavioralItems,
    safetyMarginPct
  );

  // Natural Language Routine Parser Handler via Gemini AI
  const handleAnalyzeRoutineText = async () => {
    if (!routineText.trim()) return;
    setIsAnalyzingRoutine(true);
    setRoutineFeedbackNote(null);

    try {
      const response = await fetch('/api/gemini/analyze-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineText,
          cityState: profile.cityState,
          householdCount,
          weightGoal: profile.weightGoal,
          targetWeeklyKcal: energyBalance.targetWeeklyKcal,
        }),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.items && Array.isArray(res.items)) {
          setBehavioralItems(res.items);
          setInputMode('shoppingLocations');
        }
        if (res.feedbackNote) {
          setRoutineFeedbackNote(res.feedbackNote);
        }
      }
    } catch (err) {
      console.error('Erro ao analisar rotina alimentar:', err);
    } finally {
      setIsAnalyzingRoutine(false);
    }
  };

  // Item Handlers
  const handleQuantityChange = (id: string, delta: number) => {
    setBehavioralItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, weeklyQuantity: Math.max(0, Number((item.weeklyQuantity + delta).toFixed(1))) } : item
      )
    );
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setBehavioralItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estimatedPricePerUnit: Math.max(0, newPrice) } : item))
    );
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    const item: BehavioralFoodItem = {
      id: `custom-beh-${Date.now()}`,
      name: newItemName.trim(),
      location: activeLocationTab,
      weeklyQuantity: 1,
      unit: 'kg',
      estimatedPricePerUnit: 12.0,
      estimatedKcalPerUnit: 2000,
    };
    setBehavioralItems((prev) => [...prev, item]);
    setNewItemName('');
  };

  const handleRemoveItem = (id: string) => {
    setBehavioralItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Real Web Search Handler
  const handleWebSearchRegionalPrices = async () => {
    const activeItems = behavioralItems.filter((i) => i.weeklyQuantity > 0);
    if (activeItems.length === 0) {
      alert('Sua lista de alimentos está vazia. Adicione itens ou descreva a rotina no Passo 2.');
      return;
    }

    setIsSearchingWeb(true);
    try {
      const response = await fetch('/api/gemini/regional-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityState: profile.cityState,
          items: activeItems.map((i) => ({ id: i.id, name: i.name, defaultPricePerUnit: i.estimatedPricePerUnit })),
        }),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.prices) {
          setBehavioralItems((prev) =>
            prev.map((item) => ({
              ...item,
              estimatedPricePerUnit: res.prices[item.id] !== undefined ? res.prices[item.id] : item.estimatedPricePerUnit,
            }))
          );
        }
        if (res.evidence) {
          setResearchEvidence(res.evidence);
        }
      }
    } catch (err) {
      console.error('Erro na pesquisa na WEB:', err);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  // Confirm Export to Diagnostico SPAGET
  const handleConfirmExport = () => {
    const totalMonthly = energyBalance.totalMonthlyWithSafetyMargin;
    
    // Group monthly total by real shopping locations
    let mercadoWeekly = 0;
    let feiraWeekly = 0;
    let padariaWeekly = 0;

    behavioralItems.forEach((item) => {
      if (item.weeklyQuantity > 0) {
        const cost = item.weeklyQuantity * item.estimatedPricePerUnit;
        if (item.location === 'supermarket') mercadoWeekly += cost;
        if (item.location === 'farmersMarket') feiraWeekly += cost;
        if (item.location === 'bakery') padariaWeekly += cost;
      }
    });

    const totalWeekly = mercadoWeekly + feiraWeekly + padariaWeekly;
    const factor = totalWeekly > 0 ? (totalMonthly / (totalWeekly * 4.33)) : 1;

    const mercado = Math.round(mercadoWeekly * 4.33 * factor);
    const feira = Math.round(feiraWeekly * 4.33 * factor);
    const padaria = Math.round(padariaWeekly * 4.33 * factor);

    onExportToDiagnostico({ mercado, feira, padaria });
    onClose();
  };

  const currentStateObj = BRAZIL_STATES.find((s) => s.uf === selectedUf) || BRAZIL_STATES[0];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E1DBD2] shadow-2xl max-w-3xl w-full p-6 space-y-6 animate-fade-in max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E1DBD2] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#22201D]">
                Previsor Inteligente de Alimentação (Análise por Comportamento)
              </h3>
              <p className="text-xs text-[#5C5852]">
                Passo {step} de 3 — {step === 1 ? 'Localização, IMC & Meta Calórica' : step === 2 ? 'Registro do Comportamento Real da Casa' : 'Pesquisa na WEB & Aprovação Final'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#5C5852] hover:text-[#22201D] rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Location + Biometrics + Physical Goal */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Location Input (State & Free City Input) */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>1. Escolha seu Estado e Cidade (Digitação 100% Livre para qualquer município do Brasil)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#22201D] block mb-1">Estado (UF)</label>
                  <select
                    value={selectedUf}
                    onChange={(e) => setSelectedUf(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm bg-white"
                  >
                    {BRAZIL_STATES.map((s) => (
                      <option key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#22201D] block mb-1">Cidade (Digite qualquer município)</label>
                  <input
                    type="text"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    placeholder="Ex: Tupã, Sobral, Caruaru, Curitiba..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Physical Goal / Objetivo Corporal Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#22201D] block">
                2. Seu Objetivo Corporal Atual (Ajusta a meta calórica factual do domicílio)
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, weightGoal: 'lose' })}
                  className={`p-3 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                    profile.weightGoal === 'lose'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                  }`}
                >
                  <span className="block font-bold text-sm">📉 Emagrecer</span>
                  <span className="text-[10px] opacity-90 block">Déficit calórico (-15%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, weightGoal: 'maintain' })}
                  className={`p-3 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                    profile.weightGoal === 'maintain' || !profile.weightGoal
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                  }`}
                >
                  <span className="block font-bold text-sm">⚖️ Manter Peso</span>
                  <span className="text-[10px] opacity-90 block">Manutenção calórica (0%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, weightGoal: 'gain' })}
                  className={`p-3 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                    profile.weightGoal === 'gain'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                      : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                  }`}
                >
                  <span className="block font-bold text-sm">📈 Ganhar Massa</span>
                  <span className="text-[10px] opacity-90 block">Superávit calórico (+15%)</span>
                </button>
              </div>
            </div>

            {/* IMC & Household Caloric Need Card */}
            <div className="bg-[#FAF7F1] p-4 rounded-xl border border-[#E1DBD2] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-[#5C5852] block">Seu Índice de Massa Corporal (IMC)</span>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-2xl font-extrabold text-[#22201D]">{biometrics.bmi}</span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${biometrics.bmiColorClass}`}>
                    {biometrics.bmiCategory}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-0.5 border-t sm:border-t-0 sm:border-l border-[#E1DBD2] pt-2 sm:pt-0 sm:pl-4">
                <span className="text-xs text-[#5C5852] block">Necessidade Energética Factual da Família:</span>
                <span className="text-sm font-extrabold text-emerald-800">
                  {biometrics.totalHouseholdKcal.toLocaleString('pt-BR')} kcal / dia
                </span>
                <span className="text-[11px] text-[#5C5852] block">
                  ({householdCount} pessoa(s) na casa • {biometrics.weightGoalLabel})
                </span>
              </div>
            </div>

            {/* Biometric Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#22201D]">Peso (kg)</label>
                <input
                  type="number"
                  value={profile.weightKg || ''}
                  onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D]">Altura (cm)</label>
                <input
                  type="number"
                  value={profile.heightCm || ''}
                  onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D]">Idade (anos)</label>
                <input
                  type="number"
                  value={profile.ageYears || ''}
                  onChange={(e) => setProfile({ ...profile, ageYears: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D]">Sexo Biológico</label>
                <select
                  value={profile.sex}
                  onChange={(e) => setProfile({ ...profile, sex: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-medium text-xs bg-white"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#22201D]">Dependentes na Casa (Além de você)</label>
                <input
                  type="number"
                  value={profile.numberOfDependents}
                  onChange={(e) => setProfile({ ...profile, numberOfDependents: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-brand text-white font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-brand/90 cursor-pointer"
              >
                <span>Avançar para Registro do Comportamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Behavior-Driven Routine & Shopping Locations */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Real Energy Balance Gauge */}
            <div className={`p-4 rounded-xl border space-y-2 text-xs ${
              energyBalance.coverageStatus === 'optimal'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : energyBalance.coverageStatus === 'underestimated'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {energyBalance.coverageStatus === 'underestimated' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                  )}
                  Balanço Energético Factual da Família ({householdCount} pessoa(s)):
                </span>
                <span className="text-sm font-extrabold">
                  {energyBalance.selectedWeeklyKcal.toLocaleString('pt-BR')} / {energyBalance.targetWeeklyKcal.toLocaleString('pt-BR')} kcal/semana ({energyBalance.coveragePercentage}%)
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{energyBalance.feedbackMessage}</p>

              {/* Progress Bar */}
              <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden border border-black/10">
                <div
                  className={`h-full transition-all ${
                    energyBalance.coverageStatus === 'optimal'
                      ? 'bg-emerald-600'
                      : energyBalance.coverageStatus === 'underestimated'
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, energyBalance.coveragePercentage)}%` }}
                />
              </div>
            </div>

            {/* Input Mode Selector (Linguagem Natural vs Locais de Compra) */}
            <div className="flex items-center justify-between border-b border-[#E1DBD2] pb-2 text-xs font-bold">
              <span className="text-[#22201D]">Como você prefere registrar a alimentação da sua casa?</span>
              <div className="flex items-center gap-1 bg-[#FAF7F1] p-1 rounded-xl border border-[#E1DBD2]">
                <button
                  type="button"
                  onClick={() => setInputMode('routineText')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'routineText' ? 'bg-brand text-white shadow-sm' : 'text-[#5C5852]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Descrever a Rotina (Linguagem Natural)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('shoppingLocations')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'shoppingLocations' ? 'bg-brand text-white shadow-sm' : 'text-[#5C5852]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Por Locais de Compra</span>
                </button>
              </div>
            </div>

            {/* MODE 1: Natural Language Routine Description */}
            {inputMode === 'routineText' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#22201D] block">
                    Descreva como sua família se alimenta no dia a dia (sem rótulos ou categorização forçada):
                  </label>
                  <textarea
                    rows={4}
                    value={routineText}
                    onChange={(e) => setRoutineText(e.target.value)}
                    placeholder="Ex: No café da manhã tomamos café com leite e 2 pães. No almoço comemos arroz, feijão e frango de segunda a sexta, e peixe no fim de semana. À noite comemos cuscuz com ovo..."
                    className="w-full p-3 rounded-xl border border-[#E1DBD2] text-xs font-medium text-[#22201D] bg-white leading-relaxed focus:border-brand"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5C5852]">
                    A IA lerá sua rotina e extrairá os insumos reais sem rotulá-los.
                  </span>
                  <button
                    type="button"
                    onClick={handleAnalyzeRoutineText}
                    disabled={isAnalyzingRoutine}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>{isAnalyzingRoutine ? 'Analisando Rotina...' : '✨ Analisar Rotina Familiar com IA'}</span>
                  </button>
                </div>

                {routineFeedbackNote && (
                  <div className="p-3 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl text-xs text-[#22201D] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{routineFeedbackNote}</span>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: Real Shopping Locations Tabs */}
            {inputMode === 'shoppingLocations' && (
              <div className="space-y-4">
                {/* Location Navigation Tabs */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['supermarket', 'farmersMarket', 'bakery'] as ShoppingLocation[]).map((locKey) => {
                    const locInfo = SHOPPING_LOCATIONS_INFO[locKey];
                    const itemCount = energyBalance.itemsByLocation[locKey].length;

                    return (
                      <button
                        key={locKey}
                        type="button"
                        onClick={() => setActiveLocationTab(locKey)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                          activeLocationTab === locKey
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                        }`}
                      >
                        <span className="block font-bold text-xs truncate">{locInfo.label}</span>
                        <span className="block text-[10px] opacity-80">{itemCount} item(ns) na lista</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Item to Active Location */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`+ Adicionar item no ${SHOPPING_LOCATIONS_INFO[activeLocationTab].label}`}
                    className="flex-1 px-3 py-2 border border-[#E1DBD2] rounded-xl text-xs font-bold bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-4 py-2 bg-brand text-white font-extrabold text-xs rounded-xl hover:bg-brand/90 cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Active Items List for Location */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {energyBalance.itemsByLocation[activeLocationTab].length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-[#E1DBD2] text-center text-xs text-[#5C5852]">
                      Nenhum item cadastrado para este local. Adicione itens acima ou descreva sua rotina em texto.
                    </div>
                  ) : (
                    energyBalance.itemsByLocation[activeLocationTab].map((item) => (
                      <div key={item.id} className="p-3 bg-white rounded-xl border border-[#E1DBD2] flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <strong className="font-bold text-[#22201D] block">{item.name}</strong>
                          <span className="text-[#5C5852] text-[11px]">
                            ~{item.estimatedKcalPerUnit.toLocaleString('pt-BR')} kcal por {item.unit}
                          </span>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, -0.5)}
                              className="w-6 h-6 bg-[#FAF7F1] border border-[#E1DBD2] rounded font-bold flex items-center justify-center text-[#5C5852] hover:text-[#22201D] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-extrabold text-xs text-[#22201D] w-12 text-center">
                              {item.weeklyQuantity} {item.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 0.5)}
                              className="w-6 h-6 bg-brand text-white rounded font-bold flex items-center justify-center hover:bg-brand/90 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 font-bold hover:underline text-[11px] cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-[#E1DBD2] text-[#5C5852] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:text-[#22201D] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-brand text-white font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-brand/90 cursor-pointer"
              >
                <span>Avançar para Cotação na WEB e Aprovação</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Real WEB Research + Evidence Report + 100% User Editable Table */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Real WEB Search Button */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    Cotação Real de Preços na WEB em Tempo Real
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Consultar preços praticados na WEB para a cidade de <strong>{profile.cityState}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleWebSearchRegionalPrices}
                  disabled={isSearchingWeb}
                  className="px-4 py-2.5 bg-emerald-700 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearchingWeb ? 'Pesquisando na WEB...' : `Pesquisar na WEB para ${selectedCity}`}</span>
                </button>
              </div>

              {/* Research Evidence Report */}
              {researchEvidence && (
                <div className="p-3 bg-white rounded-lg border border-emerald-300 space-y-1 text-xs text-[#22201D]">
                  <strong className="block text-emerald-800 font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Relatório Transparente da Pesquisa Realizada na WEB:
                  </strong>
                  <p className="text-[#5C5852]">{researchEvidence.evidenceNotes}</p>
                  <div className="text-[11px] text-[#5C5852]">
                    Fontes Pesquisadas: <strong>{researchEvidence.sourcesResearched.join(' • ')}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* 100% Editable Approval Table for User (User's Final Word) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#22201D] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-brand" />
                  Tabela de Aprovação de Preços por Local de Compra (Sua Palavra Final):
                </span>
                <span className="text-[#5C5852]">Altere qualquer valor se necessário</span>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(['supermarket', 'farmersMarket', 'bakery'] as ShoppingLocation[]).map((locKey) => {
                  const locItems = energyBalance.itemsByLocation[locKey];
                  if (locItems.length === 0) return null;
                  const locInfo = SHOPPING_LOCATIONS_INFO[locKey];

                  return (
                    <div key={locKey} className="space-y-1.5">
                      <span className="text-xs font-extrabold text-brand block">{locInfo.label}:</span>
                      {locItems.map((item) => (
                        <div key={item.id} className="p-2.5 bg-white rounded-xl border border-[#E1DBD2] flex items-center justify-between gap-3 text-xs">
                          <div>
                            <strong className="font-bold text-[#22201D] block">{item.name}</strong>
                            <span className="text-[#5C5852] text-[11px]">
                              Qtd Semanal: <strong>{item.weeklyQuantity} {item.unit}(s)</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[#5C5852]">R$ / {item.unit}:</span>
                            <input
                              type="number"
                              step="0.10"
                              value={item.estimatedPricePerUnit || ''}
                              onChange={(e) => handlePriceChange(item.id, Number(e.target.value) || 0)}
                              className="w-24 px-2 py-1.5 border border-emerald-400 font-extrabold text-sm text-right rounded-lg bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safety Margin Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#22201D] block">
                Margem de Segurança contra Flutuações de Mercado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSafetyMarginPct(pct)}
                    className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      safetyMarginPct === pct
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                    }`}
                  >
                    +{pct}% Margem
                  </button>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-[#FAF7F1] p-4 rounded-xl border border-[#E1DBD2] space-y-1.5 font-mono text-xs text-[#22201D]">
              <div className="flex justify-between">
                <span>Custo Semanal Base:</span>
                <span className="font-bold">R$ {energyBalance.totalWeeklyCostBase.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo Mensal Base (x 4.33 sem):</span>
                <span className="font-bold">R$ {energyBalance.totalMonthlyCostBase.toLocaleString('pt-BR')}</span>
              </div>
              <div className="border-t border-[#E1DBD2] pt-2 flex justify-between font-bold text-sm text-emerald-800">
                <span>Custo Mensal Total com Margem de Segurança (+{safetyMarginPct}%):</span>
                <span>R$ {energyBalance.totalMonthlyWithSafetyMargin.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-[#E1DBD2] text-[#5C5852] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:text-[#22201D] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleConfirmExport}
                className="px-6 py-3 bg-brand text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-brand/90 flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Aprovar e Exportar para o Diagnóstico SPAGET</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
