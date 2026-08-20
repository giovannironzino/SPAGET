import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Sliders,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Layers,
  Heart,
  Bot,
  HelpCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Save,
  BarChart3,
  BookOpen,
  MapPin,
  Flame,
  PieChart,
  Settings2,
  RotateCcw,
  Tag,
  Briefcase,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Info,
  Repeat,
  PartyPopper,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  systemConfig,
  ManagementSystemData,
  SystemCalibrationRules,
  SystemPromptSettings,
  SidehustleTemplate,
  EducationalArticle,
  DynamicRecipeArchetype,
  NovaClassification
} from '../services/systemConfigService';
import { generateCalculatedSubstitutions } from '../services/mealSubstitutionEngine';
import type { ClinicalFoodItem } from '../services/clinicalNutritionEngine';
import type { CategoryKey, CategorizedExpenseItem } from '../types';
import type { FoodFunctionalRole } from '../types/foodRoles';

interface ManagementCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagementCenterModal: React.FC<ManagementCenterModalProps> = ({ isOpen, onClose }) => {
  const [activeModule, setActiveModule] = useState<
    'dashboard' | 'foods' | 'archetypes' | 'categories' | 'alerts' | 'profiles' | 'ai_sidehustles' | 'education'
  >('dashboard');

  // Sub-aba do Módulo 2 (Consultoria de Alimentação & Guia MS)
  const [activeArchetypeSubTab, setActiveArchetypeSubTab] = useState<
    'arquetipos' | 'substituicoes' | 'cenarios' | 'batch' | 'domingo'
  >('arquetipos');

  const [configData, setConfigData] = useState<ManagementSystemData>(systemConfig.getData());

  // Search and filters for Foods
  const [foodSearch, setFoodSearch] = useState('');
  const [foodNovaFilter, setFoodNovaFilter] = useState<string>('all');

  // Food Form State
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<ClinicalFoodItem | null>(null);
  const [foodForm, setFoodForm] = useState<{
    id: string;
    name: string;
    category: 'protein' | 'grains' | 'carbs' | 'produce' | 'pantry';
    defaultLocation: 'supermarket' | 'farmersMarket' | 'bakery';
    novaGroup: NovaClassification;
    kcalPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatsPer100g: number;
    fiberPer100g: number;
    fc: number;
    fcr: number;
    umcUnitName: string;
    umcSizeKg: number;
    pricePerUmc: number;
  }>({
    id: '',
    name: '',
    category: 'protein',
    defaultLocation: 'supermarket',
    novaGroup: 'in_natura',
    kcalPer100g: 150,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatsPer100g: 5,
    fiberPer100g: 0,
    fc: 1.0,
    fcr: 1.0,
    umcUnitName: 'Pacote 1kg',
    umcSizeKg: 1.0,
    pricePerUmc: 15.0,
  });

  // Archetype Form State
  const [isArchetypeFormOpen, setIsArchetypeFormOpen] = useState(false);
  const [archetypeForm, setArchetypeForm] = useState<DynamicRecipeArchetype>({
    id: '',
    name: '',
    description: '',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3',
    slots: [
      { slotId: 's1', slotName: 'Grão Base (Energia)', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 140 },
      { slotId: 's2', slotName: 'Leguminosa (Fibras)', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 90 },
      { slotId: 's3', slotName: 'Proteína Principal', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's4', slotName: 'Hortaliça Cozida', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
    ],
    observedExamples: ['Arroz', 'Feijão', 'Frango', 'Abóbora'],
    batchCookingEligible: true,
    prepTimeMinutes: 20,
    recommendedOccasion: 'weekday_routine',
  });

  // Selected Food for Dynamic Substitution Inspector
  const [selectedSubFoodId, setSelectedSubFoodId] = useState<string>('');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = systemConfig.subscribe((updated) => {
      setConfigData({ ...updated });
    });
    return unsubscribe;
  }, []);

  // Alimento ativo para a inspeção de substituições dinâmicas
  const activeSubTargetFood = useMemo(() => {
    if (selectedSubFoodId) {
      const found = configData.foods.find((f) => f.id === selectedSubFoodId);
      if (found) return found;
    }
    // Default: first staple food (e.g. Arroz or Feijão or Ovos)
    return configData.foods.find((f) => f.name.toLowerCase().includes('feijão') || f.name.toLowerCase().includes('arroz')) || configData.foods[0];
  }, [configData.foods, selectedSubFoodId]);

  const dynamicSubstitutions = useMemo(() => {
    if (!activeSubTargetFood) return [];
    return generateCalculatedSubstitutions(activeSubTargetFood, 100, 'almoco');
  }, [activeSubTargetFood]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleResetFactory = () => {
    if (confirm('Deseja restaurar todas as configurações para o padrão oficial do Ministério da Saúde?')) {
      systemConfig.resetToFactoryDefaults();
      showNotification('Restaurado para os padrões oficiais do Ministério da Saúde!');
    }
  };

  const handleSaveFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name.trim()) return;

    const newFood: ClinicalFoodItem = {
      id: foodForm.id || `custom-${Date.now()}`,
      name: foodForm.name,
      category: foodForm.category,
      defaultLocation: foodForm.defaultLocation,
      novaGroup: foodForm.novaGroup,
      kcalPer100g: Number(foodForm.kcalPer100g),
      proteinPer100g: Number(foodForm.proteinPer100g),
      carbsPer100g: Number(foodForm.carbsPer100g),
      fatsPer100g: Number(foodForm.fatsPer100g),
      fiberPer100g: Number(foodForm.fiberPer100g),
      fc: Number(foodForm.fc),
      fcr: Number(foodForm.fcr),
      umcUnitName: foodForm.umcUnitName,
      umcSizeKg: Number(foodForm.umcSizeKg),
      pricePerUmc: Number(foodForm.pricePerUmc),
      householdMeasures: editingFood?.householdMeasures || [{ label: '1 porção média', grams: 100 }],
    };

    systemConfig.saveFood(newFood);
    setIsFoodFormOpen(false);
    setEditingFood(null);
    showNotification(`Alimento "${newFood.name}" salvo com sucesso!`);
  };

  const handleSaveArchetype = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archetypeForm.name.trim()) return;

    systemConfig.saveArchetype(archetypeForm);
    setIsArchetypeFormOpen(false);
    showNotification(`Arquétipo "${archetypeForm.name}" salvo!`);
  };

  interface NavModuleItem {
    id: 'dashboard' | 'foods' | 'archetypes' | 'categories' | 'alerts' | 'profiles' | 'ai_sidehustles' | 'education';
    label: string;
    icon: React.ElementType;
    count?: number;
    badge?: string;
  }

  const navModules: NavModuleItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: BarChart3, badge: 'Resumo' },
    { id: 'foods', label: '1. Alimentos & Classificação NOVA', icon: ShoppingBag, count: configData.foods.length },
    { id: 'archetypes', label: '2. Consultoria de Alimentação & Guia MS', icon: UtensilsCrossed, count: configData.recipeArchetypes.length },
    { id: 'categories', label: '3. Contas da Casa (9 Grupos)', icon: PieChart, count: configData.categoriesInfo.length },
    { id: 'alerts', label: '4. Alertas & Regras', icon: Sliders, badge: 'Gatilhos' },
    { id: 'profiles', label: '5. Perfis & Estilos', icon: Heart, count: Object.keys(configData.dietaryProfiles).length },
    { id: 'ai_sidehustles', label: '6. IA & Renda Extra', icon: Bot, count: configData.sidehustleTemplates.length },
    { id: 'education', label: '7. Metodologia & Textos', icon: BookOpen, count: configData.educationalArticles.length },
  ];

  return (
    <div className="fixed inset-0 bg-[#22201D]/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-[#FAF7F1] border border-[#E1DBD2] w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
        
        {/* TOPBAR PRINCIPAL */}
        <div className="bg-white border-b border-[#E1DBD2] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8E3DE] border border-[#C8442F]/30 flex items-center justify-center text-[#C8442F]">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#22201D] tracking-tight">
                  Central de Controle e Gestão SPAGET
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Guia Alimentar MS Conectado
                </span>
              </div>
              <p className="text-[11px] text-[#5C5852]">
                Gestão visual de alimentos, arquétipos culinários desacoplados do Ministério da Saúde, substituições dinâmicas e regras do sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFactory}
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              title="Restaurar padrões do Ministério da Saúde"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrões MS</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK FLOATING TOAST */}
        {feedbackMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* LAYOUT PRINCIPAL: SIDEBAR ESQUERDA + ÁREA DE CONTEÚDO */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR DE NAVEGAÇÃO DOS 8 MÓDULOS */}
          <div className="w-64 sm:w-72 bg-white border-r border-[#E1DBD2] flex flex-col justify-between overflow-y-auto p-3 space-y-1">
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Módulos de Configuração
              </div>

              {navModules.map((m) => {
                const Icon = m.icon;
                const isActive = activeModule === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#E6F0E6] text-[#4F7655] shadow-sm font-black'
                        : 'text-[#5C5852] hover:bg-[#FAF7F1] hover:text-[#22201D]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F7655]' : 'text-gray-400'}`} />
                      <span className="truncate">{m.label}</span>
                    </div>

                    {m.count !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-[#4F7655] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {m.count}
                      </span>
                    )}

                    {m.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-100 text-amber-800 border border-amber-200">
                        {m.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-[#FAF7F1] rounded-xl border border-[#E1DBD2]/60 text-[11px] text-[#5C5852] space-y-1">
              <div className="font-black text-[#22201D] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#4F7655]" />
                <span>Base Unificada</span>
              </div>
              <p className="text-[10px] text-gray-500">
                1.971 alimentos POF/IBGE com 9 grupos do Guia MS.
              </p>
            </div>
          </div>

          {/* ÁREA CENTRAL DE CONTEÚDO */}
          <div className="flex-1 bg-[#FAF7F1] overflow-y-auto p-4 sm:p-6 text-xs">

            {/* ================================================================= */}
            {/* MÓDULO 0: DASHBOARD GERAL */}
            {/* ================================================================= */}
            {activeModule === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E1DBD2] p-6 rounded-2xl shadow-sm space-y-2">
                  <h3 className="text-base font-black text-[#22201D]">
                    Painel Geral da Central de Gestão SPAGET
                  </h3>
                  <p className="text-xs text-[#5C5852] max-w-3xl">
                    Configure os alimentos, os 12 arquétipos desacoplados do Guia do Ministério da Saúde, as regras de calibração e substituições dinâmicas.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Alimentos IBGE/POF</span>
                    <div className="text-xl font-black text-[#22201D]">{configData.foods.length}</div>
                    <span className="text-[10px] text-emerald-700 font-bold">9 Grupos Guia MS</span>
                  </div>

                  <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Arquétipos Guia MS</span>
                    <div className="text-xl font-black text-[#4F7655]">{configData.recipeArchetypes.length}</div>
                    <span className="text-[10px] text-gray-500">12 Padrões Desacoplados</span>
                  </div>

                  <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Categorias Contas</span>
                    <div className="text-xl font-black text-[#22201D]">{configData.categoriesInfo.length}</div>
                    <span className="text-[10px] text-blue-700 font-bold">9 Grupos Oficiais</span>
                  </div>

                  <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Perfis Dietéticos</span>
                    <div className="text-xl font-black text-[#C8442F]">{Object.keys(configData.dietaryProfiles).length}</div>
                    <span className="text-[10px] text-gray-500">Vegetariano, Vegano, etc.</span>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 1: ALIMENTOS & CLASSIFICAÇÃO NOVA */}
            {/* ================================================================= */}
            {activeModule === 'foods' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nome do alimento..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E1DBD2] rounded-lg bg-[#FAF7F1]/30 font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={foodNovaFilter}
                      onChange={(e) => setFoodNovaFilter(e.target.value)}
                      className="px-2.5 py-1.5 border border-[#E1DBD2] rounded-lg bg-white font-bold text-xs"
                    >
                      <option value="all">Todas Classificações NOVA</option>
                      <option value="in_natura">🟢 In Natura / Minimamente</option>
                      <option value="culinary_ingredient">🟡 Ingrediente Culinário</option>
                      <option value="processed">🟠 Processado</option>
                      <option value="ultraprocessed">🔴 Ultraprocessado</option>
                    </select>

                    <button
                      onClick={() => {
                        setEditingFood(null);
                        setFoodForm({
                          id: '',
                          name: '',
                          category: 'protein',
                          defaultLocation: 'supermarket',
                          novaGroup: 'in_natura',
                          kcalPer100g: 150,
                          proteinPer100g: 20,
                          carbsPer100g: 0,
                          fatsPer100g: 5,
                          fiberPer100g: 0,
                          fc: 1.0,
                          fcr: 1.0,
                          umcUnitName: 'Pacote 1kg',
                          umcSizeKg: 1.0,
                          pricePerUmc: 15.0,
                        });
                        setIsFoodFormOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-lg font-bold shadow cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Alimento</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E1DBD2] rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F1] border-b border-[#E1DBD2] text-gray-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Alimento</th>
                        <th className="py-2.5 px-3">Classificação NOVA</th>
                        <th className="py-2.5 px-3">Grupo do Guia MS</th>
                        <th className="py-2.5 px-3">Preço UMC</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {configData.foods
                        .filter((f) => {
                          const matchSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase());
                          const matchNova = foodNovaFilter === 'all' || f.novaGroup === foodNovaFilter;
                          return matchSearch && matchNova;
                        })
                        .slice(0, 50)
                        .map((food) => (
                          <tr key={food.id} className="hover:bg-amber-50/40">
                            <td className="py-2.5 px-3 font-bold">{food.name}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-800 border-emerald-200">
                                {food.novaGroup === 'in_natura' ? '🟢 In Natura' : food.novaGroup === 'culinary_ingredient' ? '🟡 Ingrediente' : food.novaGroup === 'processed' ? '🟠 Processado' : '🔴 Ultraprocessado'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-gray-700">
                              {food.guideGroup || 'cereais'}
                            </td>
                            <td className="py-2.5 px-3 font-black text-[#4F7655]">R$ {food.pricePerUmc.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Remover ${food.name}?`)) systemConfig.deleteFood(food.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 2: CONSULTORIA DE ALIMENTAÇÃO BRASILEIRA & GUIA MS */}
            {/* ================================================================= */}
            {activeModule === 'archetypes' && (
              <div className="space-y-5">
                {/* SUB-NAV ORGANIZADA DO MÓDULO 2 */}
                <div className="bg-white border border-[#E1DBD2] p-2 rounded-xl shadow-sm flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'arquetipos', label: `1. 🍲 12 Arquétipos Culinários (${configData.recipeArchetypes.length})` },
                    { id: 'substituicoes', label: '2. 🔄 Substituições Dinâmicas (Engine Viva)' },
                    { id: 'cenarios', label: '3. 🛒 3 Cenários de Compra' },
                    { id: 'batch', label: '4. 🍱 Protocolos de Batch Cooking' },
                    { id: 'domingo', label: '5. 🎉 Almoço de Domingo & Eventos' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveArchetypeSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeArchetypeSubTab === sub.id
                          ? 'bg-[#4F7655] text-white shadow-sm font-black'
                          : 'text-[#5C5852] hover:bg-gray-100 hover:text-[#22201D]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* SUB-ABA 1: ARQUÉTIPOS CULINÁRIOS DESACOPLADOS */}
                {activeArchetypeSubTab === 'arquetipos' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-[#22201D]">
                          12 Padrões Clássicos de Refeições Brasileiras (Guia MS) - 100% Desacoplados
                        </h4>
                        <p className="text-xs text-[#5C5852]">
                          Slots definidos exclusivamente por <strong>papéis funcionais</strong> (Grão, Leguminosa, Proteína, Raiz, Hortaliça). Zero nomes de alimentos fixados no código!
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setArchetypeForm({
                            id: `arch-${Date.now()}`,
                            name: '',
                            description: '',
                            guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3',
                            slots: [
                              { slotId: 's1', slotName: 'Grão Base (Energia)', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 140 },
                              { slotId: 's2', slotName: 'Leguminosa (Fibras)', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 90 },
                              { slotId: 's3', slotName: 'Proteína Principal', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 120 },
                              { slotId: 's4', slotName: 'Hortaliça Cozida', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
                            ],
                            observedExamples: ['Arroz', 'Feijão', 'Frango', 'Abóbora'],
                            batchCookingEligible: true,
                            prepTimeMinutes: 20,
                            recommendedOccasion: 'weekday_routine',
                          });
                          setIsArchetypeFormOpen(true);
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Arquétipo</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {configData.recipeArchetypes.map((arch) => (
                        <div key={arch.id} className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-black text-[#22201D]">{arch.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full">
                                {arch.prepTimeMinutes} min
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5C5852]">{arch.description}</p>
                          </div>

                          {/* SLOTS GENÉRICOS */}
                          <div className="space-y-1.5 pt-2 border-t">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Papéis Funcionais dos Slots:</span>
                            <div className="flex flex-wrap gap-1">
                              {arch.slots.map((s, idx) => (
                                <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded">
                                  {s.slotName} ({s.role || s.categoryTag} - {s.defaultGramsTarget}g)
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* EXEMPLOS ILUSTRATIVOS */}
                          {arch.observedExamples && arch.observedExamples.length > 0 && (
                            <div className="text-[10px] text-gray-500 italic bg-[#FAF7F1] p-2 rounded-lg border border-[#E1DBD2]/60">
                              💡 <strong>Exemplos no prato:</strong> {arch.observedExamples.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-ABA 2: SUBSTITUIÇÕES DINÂMICAS VIA ENGINE REAL */}
                {activeArchetypeSubTab === 'substituicoes' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-[#4F7655]" />
                        <h4 className="text-sm font-black text-[#22201D]">
                          Motor de Substituições Dinâmicas (mealSubstitutionEngine.ts)
                        </h4>
                      </div>
                      <p className="text-xs text-[#5C5852]">
                        As alternativas abaixo são calculadas <strong>em tempo real</strong> com base no catálogo de 1.971 alimentos do IBGE, comparando densidade calórica, peso em gramas e variação de custo mensal.
                      </p>

                      {/* SELETOR DE ALIMENTO TESTADO */}
                      <div className="flex items-center gap-2 pt-2">
                        <span className="font-bold text-xs">Selecione um Alimento Alvo:</span>
                        <select
                          value={activeSubTargetFood?.id}
                          onChange={(e) => setSelectedSubFoodId(e.target.value)}
                          className="px-3 py-1.5 border border-[#E1DBD2] rounded-lg font-bold bg-[#FAF7F1] text-[#22201D] text-xs"
                        >
                          {configData.foods.slice(0, 40).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.category})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* LISTAGEM DE ALTERNATIVAS CALCULADAS */}
                    <div className="bg-white border border-[#E1DBD2] rounded-2xl p-5 shadow-sm space-y-3">
                      <h5 className="font-black text-xs text-[#22201D] border-b pb-2 flex items-center justify-between">
                        <span>Substitutos Calculados para 100g de {activeSubTargetFood?.name}:</span>
                        <span className="text-[10px] text-gray-500 font-bold">Base: {activeSubTargetFood?.kcalPer100g} kcal/100g</span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dynamicSubstitutions.map((sub, idx) => (
                          <div key={idx} className="p-3 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-1.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-[#22201D]">{sub.food.name}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-white border rounded">
                                  {sub.equivalentPortionReadyGrams}g no prato
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5C5852] mt-1">{sub.explanation}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[10px]">
                              <span className="text-gray-500">{sub.food.novaGroup === 'in_natura' ? '🟢 In Natura' : '🟡 Ingrediente'}</span>
                              <span className={`font-black flex items-center gap-1 ${sub.costDifferenceMonthly < 0 ? 'text-emerald-700' : sub.costDifferenceMonthly > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                                {sub.costDifferenceMonthly < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {sub.costDifferenceMonthly < 0 ? `Economiza R$ ${Math.abs(sub.costDifferenceMonthly).toFixed(2)}/mês` : sub.costDifferenceMonthly > 0 ? `+ R$ ${sub.costDifferenceMonthly.toFixed(2)}/mês` : 'Mesmo custo'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-ABA 3: 3 CENÁRIOS DE COMPRA */}
                {activeArchetypeSubTab === 'cenarios' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm">
                      <h4 className="text-sm font-black text-[#22201D]">
                        Calibração de Custos dos 3 Cenários de Compra
                      </h4>
                      <p className="text-xs text-[#5C5852]">
                        Ajuste o valor base mensal por pessoa de cada padrão de compra para a realidade econômica da região.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl space-y-3">
                        <div className="font-black text-xs text-[#22201D]">1. Pé no Chão (Feira Livre)</div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block">Custo Base por Pessoa (R$/mês):</label>
                          <input
                            type="number"
                            value={configData.shoppingScenarioConfig.peNoChaoBase}
                            onChange={(e) => systemConfig.updateShoppingScenarioConfig({ peNoChaoBase: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border rounded-lg font-black text-[#4F7655]"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl space-y-3">
                        <div className="font-black text-xs text-[#22201D]">2. Equilibrado (Padrão)</div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block">Custo Base por Pessoa (R$/mês):</label>
                          <input
                            type="number"
                            value={configData.shoppingScenarioConfig.equilibradoBase}
                            onChange={(e) => systemConfig.updateShoppingScenarioConfig({ equilibradoBase: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border rounded-lg font-black text-[#4F7655]"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl space-y-3">
                        <div className="font-black text-xs text-[#22201D]">3. Prático & Nobre</div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block">Custo Base por Pessoa (R$/mês):</label>
                          <input
                            type="number"
                            value={configData.shoppingScenarioConfig.praticoBase}
                            onChange={(e) => systemConfig.updateShoppingScenarioConfig({ praticoBase: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border rounded-lg font-black text-[#4F7655]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-ABA 4: PROTOCOLOS DE BATCH COOKING */}
                {activeArchetypeSubTab === 'batch' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm">
                      <h4 className="text-sm font-black text-[#22201D]">
                        Protocolos Oficiais de Batch Cooking (Cozinha em 1h30 no Domingo)
                      </h4>
                      <p className="text-xs text-[#5C5852]">
                        Diretrizes do Capítulo 5 do Guia Alimentar para preparo em lote e eliminação de gases/fitatos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {configData.batchCookingProtocols.map((step) => (
                        <div key={step.stepNumber} className="bg-white border border-[#E1DBD2] p-4 rounded-xl space-y-2">
                          <div className="font-black text-xs text-[#22201D]">{step.stepNumber}. {step.title}</div>
                          <p className="text-[11px] text-[#5C5852]">{step.description}</p>
                          <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded">
                            {step.badge}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-ABA 5: ALMOÇO DE DOMINGO & EVENTOS */}
                {activeArchetypeSubTab === 'domingo' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm">
                      <h4 className="text-sm font-black text-[#22201D]">
                        Regras de Compensação Fisiológica do Almoço de Domingo & Pizza de Sexta
                      </h4>
                      <p className="text-xs text-[#5C5852]">
                        Ajuste os parâmetros fisiológicos para equilibrar refeições sociais da família sem culpa.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl space-y-2">
                        <label className="font-bold text-xs text-[#22201D] block">Hidratação Extra Recomendada (ml/dia):</label>
                        <input
                          type="number"
                          value={configData.sundayCompensationConfig.extraWaterMl}
                          onChange={(e) => systemConfig.updateSundayCompensationConfig({ extraWaterMl: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg font-bold text-blue-700"
                        />
                        <span className="text-[10px] text-gray-500">Ajuda a eliminar o sódio retido do fim de semana.</span>
                      </div>

                      <div className="p-4 bg-white border border-[#E1DBD2] rounded-xl space-y-2">
                        <label className="font-bold text-xs text-[#22201D] block">Redução Suave nos Lanches da Semana (kcal/dia):</label>
                        <input
                          type="number"
                          value={configData.sundayCompensationConfig.snackCalorieCutKcal}
                          onChange={(e) => systemConfig.updateSundayCompensationConfig({ snackCalorieCutKcal: Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg font-bold text-[#C8442F]"
                        />
                        <span className="text-[10px] text-gray-500">Distribuição imperceptível para manter a meta calórica.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 3: CONTAS DA CASA & 9 CATEGORIAS */}
            {/* ================================================================= */}
            {activeModule === 'categories' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-black text-[#22201D] mb-1">
                    Estrutura das 9 Categorias Orçamentárias
                  </h3>
                  <p className="text-xs text-[#5C5852]">
                    Ajuste as recomendações de porcentagem da renda para orientar o diagnóstico da família.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configData.categoriesInfo.map((cat) => (
                    <div key={cat.key} className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#22201D]">{cat.titulo}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                            {cat.sugestaoReferencia}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C5852]">{cat.subtitulo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 4: ALERTAS & REGRAS DE CALIBRAÇÃO */}
            {/* ================================================================= */}
            {activeModule === 'alerts' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-black text-[#22201D] mb-1">
                    Regras de Calibração & Gatilhos do Diagnóstico
                  </h3>
                  <p className="text-xs text-[#5C5852]">
                    Parâmetros para detecção de anomalias orçamentárias.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-2">
                    <label className="font-bold text-xs text-[#22201D] block">Piso de Subnotificação de Alimentação (R$):</label>
                    <input
                      type="number"
                      value={configData.calibrationRules.foodUnderestimationFloor}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfigData({
                          ...configData,
                          calibrationRules: { ...configData.calibrationRules, foodUnderestimationFloor: val }
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-[#E1DBD2] rounded-lg font-bold"
                    />
                  </div>

                  <div className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-2">
                    <label className="font-bold text-xs text-[#22201D] block">Teto Máximo de Delivery (% da renda):</label>
                    <input
                      type="number"
                      value={configData.calibrationRules.deliveryMaxPercentageOfIncome}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfigData({
                          ...configData,
                          calibrationRules: { ...configData.calibrationRules, deliveryMaxPercentageOfIncome: val }
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-[#E1DBD2] rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 5: PERFIS DIETÉTICOS */}
            {/* ================================================================= */}
            {activeModule === 'profiles' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-black text-[#22201D] mb-1">
                    Perfis Dietéticos Canônicos
                  </h3>
                  <p className="text-xs text-[#5C5852]">
                    Definições de exclusões e premissas alimentares cadastradas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(configData.dietaryProfiles).map(([key, prof]) => (
                    <div key={key} className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-2">
                      <div className="font-black text-xs text-[#22201D]">{prof.label}</div>
                      <p className="text-[11px] text-[#5C5852]">{prof.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 6: IA & RENDA EXTRA */}
            {/* ================================================================= */}
            {activeModule === 'ai_sidehustles' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-black text-[#22201D] mb-1">
                    Catálogo de Estratégias de Renda Extra
                  </h3>
                  <p className="text-xs text-[#5C5852]">
                    Opções de geração de renda rápida sugeridas no plano de choque.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configData.sidehustleTemplates.map((sh) => (
                    <div key={sh.id} className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-2">
                      <div className="font-black text-xs text-[#22201D]">{sh.habilidade}</div>
                      <p className="text-[11px] text-[#5C5852]">{sh.comoGeraRenda}</p>
                      <div className="text-[10px] font-bold text-[#4F7655]">
                        Preço sugerido: {sh.quantoCobrar} | Potencial: R$ {sh.quantoPoderiaGerar}/mês
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* MÓDULO 7: METODOLOGIA & TEXTOS EDUCATIVOS */}
            {/* ================================================================= */}
            {activeModule === 'education' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E1DBD2] p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-black text-[#22201D] mb-1">
                    Acervo de Metodologia & Textos Oficiais
                  </h3>
                  <p className="text-xs text-[#5C5852]">
                    Orientações do Guia do Ministério da Saúde e educação financeira.
                  </p>
                </div>

                <div className="space-y-3">
                  {configData.educationalArticles.map((art) => (
                    <div key={art.id} className="bg-white border border-[#E1DBD2] p-4 rounded-xl shadow-sm space-y-2">
                      <h4 className="font-black text-xs text-[#22201D]">{art.title}</h4>
                      <p className="text-[11px] text-[#5C5852]">{art.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ================================================================= */}
        {/* MODAL FORMULÁRIO DE ARQUÉTIPO CULINÁRIO */}
        {/* ================================================================= */}
        {isArchetypeFormOpen && (
          <div className="fixed inset-0 bg-[#22201D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-[#E1DBD2] max-w-lg w-full rounded-2xl shadow-2xl p-6 relative text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-[#22201D] flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-[#C8442F]" />
                  <span>Cadastrar Arquétipo Culinário Desacoplado</span>
                </h3>
                <button onClick={() => setIsArchetypeFormOpen(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveArchetype} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Nome do Padrão Culinário:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 13. Cuscuz Nordestino com Proteína & Queijo..."
                    value={archetypeForm.name}
                    onChange={(e) => setArchetypeForm({ ...archetypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-xl font-bold bg-[#FAF7F1]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Descrição Gastronômica:</label>
                  <textarea
                    rows={2}
                    placeholder="Explicação da tradição cultural e sinergia de nutrientes..."
                    value={archetypeForm.description}
                    onChange={(e) => setArchetypeForm({ ...archetypeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Exemplos Ilustrativos (separados por vírgula):</label>
                  <input
                    type="text"
                    placeholder="Ex: Cuscuz de milho, Ovos caipiras, Queijo coalho"
                    value={archetypeForm.observedExamples?.join(', ') || ''}
                    onChange={(e) => setArchetypeForm({ ...archetypeForm, observedExamples: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-xl bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsArchetypeFormOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    Salvar Arquétipo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
