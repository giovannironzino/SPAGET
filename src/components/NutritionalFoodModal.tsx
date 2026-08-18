import React, { useState } from 'react';
import { BRAZIL_STATES } from '../data/brazilLocations';
import { CLINICAL_FOOD_CATALOG, ClinicalFoodItem } from '../data/foodCatalog';
import { useSpaget } from '../context/SpagetContext';
import {
  UserBiometricData,
  UserExpectation,
  UserRoutine,
  UserPreferences,
  UserRestrictions,
  PersonalNutritionContext,
  SafetyEvaluation,
  NutritionalStrategy,
  ObjectiveProjection,
} from '../types/foodPredictor';
import { UserRepetitionTolerance } from '../types/mealContext';

// Engines 1 to 22
import { evaluateDataSufficiency } from '../services/foodDataSufficiencyEngine';
import { calculateNutritionalStrategy } from '../services/objectiveEngine';
import { calculateObjectiveProjection } from '../services/objectiveProjectionEngine';
import { evaluateNutritionSafety } from '../services/nutritionSafetyEngine';
import { calculateNutritionalTargets } from '../services/nutritionCalculationEngine';
import { fractionateMealsByRoutine, FractionatedMealQuota } from '../services/mealStructureEngine';
import { generatePersonalizedMealPlan, PlannedMealSlot } from '../services/personalizedMealPlanEngine';
import { evaluateAndCompensatePlan } from '../services/objectiveCompensationEngine';
import { generateCalculatedSubstitutions } from '../services/mealSubstitutionEngine';
import { validateMealPlanConformity } from '../services/nutritionValidationEngine';
import { project30DayConsumption, MonthlyConsumptionItem } from '../services/consumptionProjectionEngine';
import { generateGrossShoppingList, GrossShoppingItem } from '../services/shoppingListEngine';
import { calculateCommercialPurchases } from '../services/commercialPurchaseEngine';
import { applyRegionalPriceSnapshot } from '../services/foodPriceEngine';
import { calculateFoodBudgetForecast, FoodBudgetForecastResult } from '../services/foodBudgetForecastEngine';
import { optimizeFoodBudget, BudgetOptimizationResult } from '../services/budgetOptimizationEngine';

// New Contextual Engines 19 to 22
import { evaluateMealContext } from '../services/mealContextEngine';
import { generateVarietyRotatedWeek } from '../services/varietyRotationEngine';
import { composeCustomUserMeal } from '../services/userMealComposerEngine';
import { buildReal30DayCalendar } from '../services/mealCalendarEngine';

import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Apple,
  AlertTriangle,
  ShieldCheck,
  Calendar as CalendarIcon,
  Utensils,
  RefreshCw,
  Wrench,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  DollarSign,
  Info
} from 'lucide-react';

interface NutritionalFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NutritionalFoodModal: React.FC<NutritionalFoodModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateData } = useSpaget();

  // 3 Central Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step3SubTab, setStep3SubTab] = useState<'calendar' | 'shopping' | 'budget'>('calendar');

  // Calendar Start Date Selection (Engine 22)
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDateIso, setStartDateIso] = useState<string>(todayIso);

  // Repetition Tolerance (Engine 20)
  const [repetitionTolerance, setRepetitionTolerance] = useState<UserRepetitionTolerance>('moderate_rotation');

  // Step 1: User Data
  const [selectedUf, setSelectedUf] = useState<string>('SP');
  const [selectedCity, setSelectedCity] = useState<string>('São Paulo');
  const [personData, setPersonData] = useState<UserBiometricData>({
    ageYears: 34,
    weightKg: 78,
    heightCm: 175,
    sex: 'male',
    activityLevel: 'light',
    numberOfDependents: 1,
    cityState: 'São Paulo / SP',
  });

  const [expectation, setExpectation] = useState<UserExpectation>({
    goalType: 'lose_weight',
    targetWeightKg: 72,
    targetTimeframeDays: 60,
  });

  // Step 2: Routine & Preferences
  const [routine, setRoutine] = useState<UserRoutine>({
    dailyMealsCount: 4,
    mealDefinitions: [
      { id: 'cafe', name: 'Café da Manhã', targetPercentage: 25, approximateTime: '07:30' },
      { id: 'almoco', name: 'Almoço', targetPercentage: 35, approximateTime: '12:30' },
      { id: 'lanche', name: 'Lanche da Tarde', targetPercentage: 15, approximateTime: '16:30' },
      { id: 'jantar', name: 'Jantar', targetPercentage: 25, approximateTime: '20:00' },
    ],
    weeklyVariation: {
      hasWorkVsHomeOffice: false,
      hasTrainingVsRestDays: true,
      trainingDaysCount: 4,
    },
    mealsOutPerWeek: [],
    cookingFrequency: 'batch_2_days',
    storageCapacity: 'fridge_freezer',
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredFoodIds: ['cf-prot-frango-peito', 'cf-grain-arroz-branco', 'cf-carb-aveia', 'cf-prot-ovos'],
    acceptedFoodIds: [],
    rejectedFoodIds: [],
  });

  const [restrictions, setRestrictions] = useState<UserRestrictions>({
    allergies: [],
    intolerances: [],
    excludedFoods: [],
  });

  // Plan Customization States
  const [activePlanSlots, setActivePlanSlots] = useState<PlannedMealSlot[]>([]);
  const [selectedFoodForSwap, setSelectedFoodForSwap] = useState<{
    mealId: string;
    food: ClinicalFoodItem;
    portionGrams: number;
  } | null>(null);

  // "Montar esta refeição" Modal State (Engine 21)
  const [composerModalMeal, setComposerModalMeal] = useState<FractionatedMealQuota | null>(null);
  const [composerSelectedFoodIds, setComposerSelectedFoodIds] = useState<string[]>([]);

  const [budgetOptimizerActive, setBudgetOptimizerActive] = useState(false);

  if (!isOpen) return null;

  // Engine Pipeline (1 to 22)
  const sufficiency = evaluateDataSufficiency(personData, expectation, routine, preferences, restrictions);
  const safetyEvaluation: SafetyEvaluation = evaluateNutritionSafety(personData, expectation, restrictions);
  const calculatedStrategy: NutritionalStrategy = calculateNutritionalStrategy(personData, expectation);

  const personalContext: PersonalNutritionContext = {
    personData,
    expectation,
    routine,
    preferences,
    restrictions,
    safetyEvaluation,
    calculatedStrategy,
  };

  const fractionatedQuotas: FractionatedMealQuota[] = fractionateMealsByRoutine(personalContext, routine);

  // Base plan generation
  const basePlanSlots = activePlanSlots.length > 0
    ? activePlanSlots
    : generatePersonalizedMealPlan(fractionatedQuotas);

  // Engine 20: Variety Rotation
  const varietyRotation = generateVarietyRotatedWeek(basePlanSlots, repetitionTolerance);

  // Engine 22: Real 30-Day Calendar Projection
  const realCalendar = buildReal30DayCalendar(startDateIso, basePlanSlots);

  const validationSummary = validateMealPlanConformity(personalContext, basePlanSlots);
  const householdCount = Math.max(1, 1 + personData.numberOfDependents);
  const monthlyConsumption: MonthlyConsumptionItem[] = project30DayConsumption(basePlanSlots, householdCount);
  const grossShoppingList: GrossShoppingItem[] = generateGrossShoppingList(monthlyConsumption);
  const commercialPurchases = calculateCommercialPurchases(grossShoppingList);
  const priceSnapshotApplied = applyRegionalPriceSnapshot(commercialPurchases, selectedCity);
  const budgetForecast: FoodBudgetForecastResult = calculateFoodBudgetForecast(priceSnapshotApplied);
  const budgetOptimization: BudgetOptimizationResult = optimizeFoodBudget(priceSnapshotApplied);

  const handleFinalizeAndSyncSpaget = () => {
    updateData((prev) => {
      const updatedFixed = prev.fixedExpenses.map((exp) => {
        if (exp.name.toLowerCase().includes('mercado') || exp.name.toLowerCase().includes('alimentaç')) {
          return { ...exp, amount: budgetForecast.breakdownByCategory.supermarket };
        }
        return exp;
      });

      const updatedVariable = prev.variableExpenses.map((exp) => {
        if (exp.name.toLowerCase().includes('feira') || exp.name.toLowerCase().includes('açougue')) {
          return { ...exp, amount: budgetForecast.breakdownByCategory.farmersMarket };
        }
        if (exp.name.toLowerCase().includes('padaria')) {
          return { ...exp, amount: budgetForecast.breakdownByCategory.bakery };
        }
        return exp;
      });

      return {
        ...prev,
        fixedExpenses: updatedFixed,
        variableExpenses: updatedVariable,
        updatedAt: new Date().toISOString(),
      };
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#FAF8F5] w-full max-w-5xl rounded-2xl border border-[#E1DBD2] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#22201D] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-md">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Previsor Inteligente de Alimentação (SPAGET 3.2)</h2>
              <p className="text-xs text-[#E1DBD2]/80">
                Plano Alimentar Pessoal, Calendário Real, Compras UMC e Impacto no Orçamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 3 Central Steps Navigation Bar */}
        <div className="bg-white border-b border-[#E1DBD2] px-5 py-3">
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
            <button
              onClick={() => setStep(1)}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                step === 1 ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52] hover:bg-[#E8E1D7]'
              }`}
            >
              PASSO 1: Você e o que quer atingir
            </button>
            <button
              onClick={() => setStep(2)}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                step === 2 ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52] hover:bg-[#E8E1D7]'
              }`}
            >
              PASSO 2: Sua alimentação na prática
            </button>
            <button
              onClick={() => setStep(3)}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                step === 3 ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52] hover:bg-[#E8E1D7]'
              }`}
            >
              PASSO 3: Seu plano (Calendário + Compras + Orçamento)
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================================= */}
          {/* PASSO 1: VOCÊ E O QUE QUER ATINGIR                                        */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Entendimento Simples da Sua Meta:</strong> Você informa quem você é e onde quer chegar. Nós calculamos o ritmo saudável, o prazo ideal e a estratégia para a sua casa!
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#E1DBD2]">
                <div>
                  <label className="text-xs font-extrabold text-[#22201D] block mb-1">Estado (UF)</label>
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

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-[#22201D] block mb-1">Cidade para Cotação Real</label>
                  <input
                    type="text"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#22201D] block mb-1">Peso Atual (kg)</label>
                  <input
                    type="number"
                    value={personData.weightKg}
                    onChange={(e) => setPersonData({ ...personData, weightKg: Math.max(30, Number(e.target.value) || 70) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#22201D] block mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={personData.heightCm}
                    onChange={(e) => setPersonData({ ...personData, heightCm: Math.max(100, Number(e.target.value) || 170) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#22201D] block mb-1">Idade (anos)</label>
                  <input
                    type="number"
                    value={personData.ageYears}
                    onChange={(e) => setPersonData({ ...personData, ageYears: Math.max(10, Number(e.target.value) || 30) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E1DBD2] font-bold text-sm"
                  />
                </div>
              </div>

              {/* Strategy Card */}
              <div className="bg-[#22201D] text-white p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs text-brand font-bold uppercase tracking-wider">Estratégia Calculada pelo SPAGET</span>
                    <h3 className="font-extrabold text-lg text-white">{calculatedStrategy.strategyName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#E1DBD2]">Referência: {calculatedStrategy.bodyReferenceMethod}</span>
                  </div>
                </div>

                <div className="text-xs text-[#E1DBD2] leading-relaxed">
                  Calculamos a estrutura ideal para seu metabolismo sem que você precise fazer contas.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-brand text-white font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-brand/90 cursor-pointer shadow-md"
                >
                  <span>Avançar para Sua Alimentação na Prática</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 2: SUA ALIMENTAÇÃO NA PRÁTICA                                       */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Repetition Tolerance Question (Engine 20) */}
              <div className="bg-white p-4 rounded-xl border border-[#E1DBD2] space-y-3">
                <label className="text-xs font-extrabold text-[#22201D] block">
                  Como você prefere lidar com repetições de refeições durante a semana?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRepetitionTolerance('high_repetition')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      repetitionTolerance === 'high_repetition'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-[#E1DBD2] bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-[#22201D]">⚡ Posso repetir bastante</div>
                    <div className="text-[11px] text-[#605A52] mt-1">Foco em máxima praticidade e menor custo de compra.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepetitionTolerance('moderate_rotation')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      repetitionTolerance === 'moderate_rotation'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-[#E1DBD2] bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-[#22201D]">⚖️ Prefiro variar a cada 2 ou 3 dias</div>
                    <div className="text-[11px] text-[#605A52] mt-1">Equilíbrio perfeito entre variedade e economia.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepetitionTolerance('high_variety')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      repetitionTolerance === 'high_variety'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-[#E1DBD2] bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-[#22201D]">🎨 Quero refeições diferentes na semana</div>
                    <div className="text-[11px] text-[#605A52] mt-1">Máxima variação nos pratos e frutas a cada dia.</div>
                  </button>
                </div>
              </div>

              {/* Start Date Selector (Engine 22) */}
              <div className="bg-white p-4 rounded-xl border border-[#E1DBD2] space-y-3">
                <label className="text-xs font-extrabold text-[#22201D] block flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-brand" />
                  <span>Quando você quer começar este plano?</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={startDateIso}
                    onChange={(e) => setStartDateIso(e.target.value)}
                    className="px-3 py-2 border border-[#E1DBD2] rounded-xl font-bold text-xs bg-white"
                  />
                  <span className="text-xs text-[#605A52]">
                    O SPAGET montará o calendário dos próximos 30 dias reais a partir desta data.
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-[#E8E1D7] text-[#22201D] font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-[#DDD5C8] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-brand text-white font-extrabold text-xs rounded-xl flex items-center gap-2 hover:bg-brand/90 cursor-pointer shadow-md"
                >
                  <span>Gerar Meu Calendário & Compras</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 3: SEU PLANO (CALENDÁRIO REAL + COMPRAS 30D + ORÇAMENTO)            */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Navigation Sub-Tabs */}
              <div className="bg-white p-2 rounded-xl border border-[#E1DBD2] flex justify-center gap-2">
                <button
                  onClick={() => setStep3SubTab('calendar')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    step3SubTab === 'calendar' ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52]'
                  }`}
                >
                  📅 Seu Plano em Calendário Real (30 Dias)
                </button>
                <button
                  onClick={() => setStep3SubTab('shopping')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    step3SubTab === 'shopping' ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52]'
                  }`}
                >
                  🛒 Suas Compras de 30 Dias (UMC)
                </button>
                <button
                  onClick={() => setStep3SubTab('budget')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    step3SubTab === 'budget' ? 'bg-brand text-white shadow-sm' : 'bg-[#F2ECE4] text-[#605A52]'
                  }`}
                >
                  💰 Impacto no Orçamento SPAGET
                </button>
              </div>

              {/* Sub-Tab 1: Real Calendar Display */}
              {step3SubTab === 'calendar' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <strong>Plano 100% alinhado à sua meta:</strong> Calendário real de {realCalendar.startDateIso} até {realCalendar.endDateIso}.
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                    {realCalendar.dailyCalendar.slice(0, 7).map((day) => (
                      <div key={day.dateIso} className="bg-white p-4 rounded-xl border border-[#E1DBD2] space-y-3">
                        <div className="font-black text-sm text-brand border-b border-[#E1DBD2] pb-2 flex items-center justify-between">
                          <span>📅 {day.formattedDate}</span>
                          <span className="text-xs text-[#605A52] font-normal">Dia {day.dayNumber} de 30</span>
                        </div>

                        <div className="space-y-3">
                          {day.meals.map((meal) => {
                            const quota = fractionatedQuotas.find((q) => q.mealId === meal.mealId) || fractionatedQuotas[0];
                            return (
                              <div key={meal.mealId} className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E1DBD2] space-y-2 text-xs">
                                <div className="flex items-center justify-between border-b border-[#E1DBD2]/60 pb-1.5">
                                  <span className="font-extrabold text-[#22201D]">{meal.mealName}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setComposerModalMeal(quota);
                                        setComposerSelectedFoodIds([]);
                                      }}
                                      className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[10px] rounded-lg hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Wrench className="w-3 h-3" />
                                      <span>Montar esta refeição</span>
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-extrabold text-emerald-800 text-[11px] mb-1">
                                    🌟 Sugestão Principal:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {meal.mainSuggestion.items.map((item, idx) => (
                                      <span key={idx} className="bg-white px-2 py-1 rounded border border-[#E1DBD2] font-bold">
                                        {item.foodName}: {item.portionGrams}g
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Purchases UMC */}
              {step3SubTab === 'shopping' && (
                <div className="bg-white p-4 rounded-xl border border-[#E1DBD2] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E1DBD2] text-[#605A52] font-bold bg-[#FAF8F5]">
                        <th className="p-2">Item</th>
                        <th className="p-2">Bruto Necessário</th>
                        <th className="p-2">Embalagens no Caixa</th>
                        <th className="p-2 text-right">Custo Desembolso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1DBD2]">
                      {priceSnapshotApplied.map((item) => (
                        <tr key={item.foodId} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-[#22201D]">{item.foodName}</td>
                          <td className="p-2 text-[#22201D]">{item.grossRawRequiredKg} kg brutos</td>
                          <td className="p-2 font-extrabold text-emerald-800">
                            {item.unitsToPurchase}x {item.umcUnitName}
                          </td>
                          <td className="p-2 text-right font-extrabold text-[#22201D]">
                            R$ {item.totalOutofPocketCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 3: Budget Forecast */}
              {step3SubTab === 'budget' && (
                <div className="bg-brand text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Desembolso Alimentar Previsto (30 Dias)</span>
                      <h3 className="font-extrabold text-2xl text-white">R$ {budgetForecast.expectedSpend}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/10 p-2 rounded-lg">Mercado: R$ {budgetForecast.breakdownByCategory.supermarket}</div>
                    <div className="bg-white/10 p-2 rounded-lg">Feira: R$ {budgetForecast.breakdownByCategory.farmersMarket}</div>
                    <div className="bg-white/10 p-2 rounded-lg">Padaria: R$ {budgetForecast.breakdownByCategory.bakery}</div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-[#E8E1D7] text-[#22201D] font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-[#DDD5C8] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  onClick={handleFinalizeAndSyncSpaget}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir e Atualizar Orçamento SPAGET</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* "Montar esta refeição" Modal Popup (Engine 21) */}
      {composerModalMeal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 border border-[#E1DBD2] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DBD2] pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#22201D]">
                  🛠️ Montar {composerModalMeal.mealName} do Meu Jeito
                </h3>
                <p className="text-[11px] text-[#605A52]">
                  Escolha os alimentos. O SPAGET calculará as gramaturas exatas para você!
                </p>
              </div>
              <button onClick={() => setComposerModalMeal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {CLINICAL_FOOD_CATALOG.map((food) => {
                const isSelected = composerSelectedFoodIds.includes(food.id);
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setComposerSelectedFoodIds(composerSelectedFoodIds.filter((id) => id !== food.id));
                      } else {
                        setComposerSelectedFoodIds([...composerSelectedFoodIds, food.id]);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected ? 'border-brand bg-brand/10 font-bold' : 'border-[#E1DBD2] bg-white'
                    }`}
                  >
                    <span>{food.name}</span>
                    <span className="text-[10px] text-[#605A52]">{food.category}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E1DBD2]">
              <button
                type="button"
                onClick={() => setComposerModalMeal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedFoods = CLINICAL_FOOD_CATALOG.filter((f) => composerSelectedFoodIds.includes(f.id));
                  const customResult = composeCustomUserMeal(personalContext, composerModalMeal, selectedFoods);
                  
                  // Update active plan slots preserving user choice
                  const updatedSlots = basePlanSlots.map((slot) => {
                    if (slot.mealId === composerModalMeal.mealId) {
                      return {
                        ...slot,
                        selectedFoods: customResult.userSelectedFoodsWithPortions.map((p) => ({
                          food: p.food,
                          portionReadyGrams: p.portionGrams,
                          daysPerWeek: 7,
                        })),
                      };
                    }
                    return slot;
                  });
                  setActivePlanSlots(updatedSlots);
                  setComposerModalMeal(null);
                }}
                disabled={composerSelectedFoodIds.length === 0}
                className="px-5 py-2 bg-brand text-white font-extrabold text-xs rounded-xl hover:bg-brand/90 disabled:opacity-50 cursor-pointer"
              >
                Salvar Minha Escolha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
