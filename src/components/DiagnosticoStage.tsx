import React, { useState } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { CategoryKey, CategorizedExpenseItem, Debt } from '../types';
import { CATEGORIES_INFO } from '../data/defaultCategories';
import { analyzeCalibration, CalibrationAlert } from '../services/calibrationEngine';
import { NutritionalFoodModal } from './NutritionalFoodModal';
import { 
  Home, 
  ShoppingBag, 
  Car, 
  HeartPulse, 
  Tv, 
  GraduationCap, 
  Smile, 
  Dog, 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Calculator,
  Bot,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Apple
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  ShoppingBag,
  Car,
  HeartPulse,
  Tv,
  GraduationCap,
  Smile,
  Dog,
  CreditCard
};

export const DiagnosticoStage: React.FC = () => {
  const { data, updateData, moveToStage } = useSpaget();
  const [activeCategoryKey, setActiveCategoryKey] = useState<CategoryKey>('moradia');
  const [showMathExplainer, setShowMathExplainer] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [addingCustomForCategory, setAddingCustomForCategory] = useState<CategoryKey | null>(null);
  const [consultingItem, setConsultingItem] = useState<CategorizedExpenseItem | null>(null);
  const [isNutritionalModalOpen, setIsNutritionalModalOpen] = useState(false);

  const handleExportNutritionalBreakdown = (breakdown: { mercado: number; feira: number; padaria: number }) => {
    updateData((prev) => {
      const currentFoodList = prev.categorizedExpenses['alimentacao'] || [];
      const updatedFoodList = currentFoodList.map((item) => {
        if (item.id === 'alim-mercado') {
          return { ...item, temDespesa: true, valorDeclarado: breakdown.mercado };
        }
        if (item.id === 'alim-feira') {
          return { ...item, temDespesa: true, valorDeclarado: breakdown.feira };
        }
        if (item.id === 'alim-padaria') {
          return { ...item, temDespesa: true, valorDeclarado: breakdown.padaria };
        }
        return item;
      });

      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          alimentacao: updatedFoodList,
        },
      };
    });
  };

  // Run 100% Offline Calibration Engine (Zero API Cost)
  const calibrationAlerts = analyzeCalibration(data);
  const currentCategoryAlerts = calibrationAlerts.filter((a) => a.categoryKey === activeCategoryKey);

  // Math Calculations across all 9 categories
  const allCategories = data.categorizedExpenses || {};
  let totalActiveExpenses = 0;

  Object.values(allCategories).forEach((itemsList) => {
    if (Array.isArray(itemsList)) {
      itemsList.forEach((item) => {
        if (item.temDespesa) {
          totalActiveExpenses += Number(item.valorDeclarado) || 0;
        }
      });
    }
  });

  const currentRevenue = Number(data.currentRevenue) || 0;
  const buraco = totalActiveExpenses - currentRevenue;
  const isDeficit = buraco > 0;

  // Handlers for Items
  const toggleItemDespesa = (categoryKey: CategoryKey, itemId: string, temDespesa: boolean) => {
    updateData((prev) => {
      const currentList = prev.categorizedExpenses[categoryKey] || [];
      const updatedList = currentList.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            temDespesa,
          };
        }
        return item;
      });
      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          [categoryKey]: updatedList,
        },
      };
    });
  };

  const updateItemValue = (categoryKey: CategoryKey, itemId: string, valorDeclarado: number) => {
    updateData((prev) => {
      const currentList = prev.categorizedExpenses[categoryKey] || [];
      const updatedList = currentList.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            valorDeclarado: Math.max(0, valorDeclarado),
          };
        }
        return item;
      });
      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          [categoryKey]: updatedList,
        },
      };
    });
  };

  const handleAddCustomItem = (categoryKey: CategoryKey) => {
    if (!newCustomLabel.trim()) return;
    const newItem: CategorizedExpenseItem = {
      id: `custom-${Date.now()}`,
      categoriaKey: categoryKey,
      rotulo: newCustomLabel.trim(),
      temDespesa: true,
      valorDeclarado: 0,
      sugestaoMinima: 'Gasto personalizado',
      isCustom: true,
    };

    updateData((prev) => {
      const currentList = prev.categorizedExpenses[categoryKey] || [];
      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          [categoryKey]: [...currentList, newItem],
        },
      };
    });

    setNewCustomLabel('');
    setAddingCustomForCategory(null);
  };

  const removeItem = (categoryKey: CategoryKey, itemId: string) => {
    updateData((prev) => {
      const currentList = prev.categorizedExpenses[categoryKey] || [];
      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          [categoryKey]: currentList.filter((i) => i.id !== itemId),
        },
      };
    });
  };

  // Specific Debt Adders
  const addSpecificDebt = () => {
    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      credor: 'Novo Credor / Banco',
      valor: 0,
      tipo: 'banco',
    };
    updateData((prev) => ({
      ...prev,
      debts: [...(prev.debts || []), newDebt],
    }));
  };

  const removeSpecificDebt = (id: string) => {
    updateData((prev) => ({
      ...prev,
      debts: (prev.debts || []).filter((d) => d.id !== id),
    }));
  };

  const updateSpecificDebt = (id: string, fields: Partial<Debt>) => {
    updateData((prev) => ({
      ...prev,
      debts: (prev.debts || []).map((d) => (d.id === id ? { ...d, ...fields } : d)),
    }));
  };

  const handleConfirmStage1 = () => {
    updateData((prev) => ({
      ...prev,
      stage1Confirmed: true,
      currentStage: 'receita',
      completedStages: Array.from(new Set([...prev.completedStages, 'diagnostico'])),
    }));
    moveToStage('receita');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Privacy & Safe Storage Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F5F2EB] border border-[#E1DBD2] px-4 py-3 rounded-xl text-xs text-[#5C5852]">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sua privacidade está garantida: todos os dados são salvos com segurança no seu dispositivo (Custo de API: R$ 0,00).</span>
        </div>
        <button
          onClick={() => setShowMathExplainer(!showMathExplainer)}
          className="flex items-center gap-1.5 font-bold text-brand hover:underline cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Como essa conta é calculada?</span>
        </button>
      </div>

      {/* Math Explainer Card */}
      {showMathExplainer && (
        <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-3 animate-fade-in text-sm text-[#22201D]">
          <h4 className="font-extrabold text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand" />
            Entenda a Matemática Simples do Seu Diagnóstico
          </h4>
          <p className="text-[#5C5852] leading-relaxed">
            Nós somamos todos os itens em que você marcou <strong className="text-emerald-700">SIM</strong> e subtraímos da sua renda mensal total.
          </p>
          <div className="bg-[#FAF7F1] p-4 rounded-xl border border-[#E1DBD2] space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span>(+) Sua Renda Mensal Declarada:</span>
              <span className="font-bold text-emerald-700">R$ {currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Soma das Contas Ativas (SIM):</span>
              <span className="font-bold text-red-600">R$ {totalActiveExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-[#E1DBD2] pt-2 flex justify-between font-bold text-sm">
              <span>(=) {isDeficit ? 'O que falta no mês:' : 'O que sobra no mês:'}</span>
              <span className={isDeficit ? 'text-red-700' : 'text-emerald-700'}>
                R$ {Math.abs(buraco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Renda Input */}
        <div className="bg-white p-5 rounded-2xl border border-[#E1DBD2] shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#5C5852] block">
            1. Sua Renda Mensal Líquida
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5C5852]">R$</span>
            <input
              type="number"
              value={data.currentRevenue || ''}
              onChange={(e) => updateData((prev) => ({ ...prev, currentRevenue: Number(e.target.value) || 0 }))}
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E1DBD2] font-bold text-lg text-[#22201D] focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <p className="text-[11px] text-[#5C5852]">Salário, pro-labore, comissões ou média mensal.</p>
        </div>

        {/* Total Saídas */}
        <div className="bg-white p-5 rounded-2xl border border-[#E1DBD2] shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C5852] block">
            2. Total de Contas Ativas (SIM)
          </span>
          <div className="text-2xl font-extrabold text-[#22201D]">
            R$ {totalActiveExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#5C5852]">Soma de todas as contas marcadas com SIM.</p>
        </div>

        {/* Buraco ou Sobra */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${isDeficit ? 'bg-[#F8E3DE] border-[#F8E3DE]' : 'bg-[#E2F1E8] border-[#E2F1E8]'}`}>
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C5852] block">
            3. {isDeficit ? 'O Quanto Falta no Mês' : 'Sobra Mensal Estimada'}
          </span>
          <div className={`text-2xl font-extrabold ${isDeficit ? 'text-[#C8442F]' : 'text-emerald-800'}`}>
            R$ {Math.abs(buraco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#5C5852]">
            {isDeficit ? 'Este é o buraco que iremos cobrir com o plano SPAGET.' : 'Excelente! Você tem margem positiva para investir ou quitar dívidas.'}
          </p>
        </div>
      </div>

      {/* Main 9 Categories Diagnostic Section */}
      <div className="bg-white rounded-2xl border border-[#E1DBD2] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E1DBD2] space-y-1">
          <h2 className="text-xl font-extrabold text-[#22201D]">
            Diagnóstico das 9 Categorias Financeiras
          </h2>
          <p className="text-sm text-[#5C5852]">
            Marque <strong className="text-emerald-700">SIM</strong> apenas nos gastos que você tem atualmente. Se não tiver o gasto, deixe em <strong className="text-slate-500">NÃO</strong>.
          </p>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-[#E1DBD2] bg-[#FAF7F1] scrollbar-thin">
          {CATEGORIES_INFO.map((cat) => {
            const IconComp = ICON_MAP[cat.icone] || Home;
            const items = allCategories[cat.key] || [];
            const activeCount = items.filter((i) => i.temDespesa).length;
            const isSelected = activeCategoryKey === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategoryKey(cat.key)}
                className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand text-brand bg-white'
                    : 'border-transparent text-[#5C5852] hover:text-[#22201D] hover:bg-white/50'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{cat.titulo}</span>
                {activeCount > 0 && (
                  <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Content Area */}
        {(() => {
          const currentCatInfo = CATEGORIES_INFO.find((c) => c.key === activeCategoryKey) || CATEGORIES_INFO[0];
          const itemsList = allCategories[activeCategoryKey] || [];
          const IconComp = ICON_MAP[currentCatInfo.icone] || Home;

          return (
            <div className="p-6 space-y-6">
              {/* Real-time Calibration Alerts Banner (Offline, Zero API Cost) */}
              {currentCategoryAlerts.length > 0 && (
                <div className="space-y-2">
                  {currentCategoryAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                        alert.severity === 'warning'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-blue-50 border-blue-300 text-blue-900'
                      }`}
                    >
                      {alert.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="block font-bold">{alert.title}</strong>
                        <span>{alert.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Subheader */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E1DBD2]/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl text-brand">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#22201D]">{currentCatInfo.titulo}</h3>
                    <p className="text-xs text-[#5C5852]">{currentCatInfo.subtitulo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeCategoryKey === 'alimentacao' && (
                    <button
                      type="button"
                      onClick={() => setIsNutritionalModalOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Apple className="w-4 h-4 text-emerald-200" />
                      <span>Calculadora Nutricional & Compras</span>
                    </button>
                  )}
                  <div className="bg-[#FAF7F1] px-3.5 py-1.5 rounded-lg border border-[#E1DBD2] text-xs font-semibold text-[#5C5852]">
                    {currentCatInfo.sugestaoReferencia}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {itemsList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.temDespesa
                        ? 'bg-white border-emerald-300 shadow-sm'
                        : 'bg-[#FAF7F1]/60 border-[#E1DBD2]/70 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Label & Tip */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#22201D]">{item.rotulo}</span>
                          {item.isCustom && (
                            <button
                              onClick={() => removeItem(activeCategoryKey, item.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Remover gasto personalizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConsultingItem(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-light/60 hover:bg-brand-light text-brand text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            title="Consultar dicas do copiloto sobre este gasto específico"
                          >
                            <Bot className="w-3 h-3 text-brand" />
                            <span>Consultar IA</span>
                          </button>
                        </div>
                        {item.observacao && (
                          <p className="text-xs text-[#5C5852]">{item.observacao}</p>
                        )}
                        <div className="inline-block bg-[#FAF7F1] px-2 py-0.5 rounded text-[11px] font-medium text-[#5C5852] border border-[#E1DBD2]">
                          Sugestão mínima: <strong className="text-[#22201D]">{item.sugestaoMinima}</strong>
                        </div>
                      </div>

                      {/* Right: Toggle SIM/NÃO + Input */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Toggle buttons */}
                        <div className="flex bg-[#E1DBD2]/40 p-1 rounded-xl gap-1">
                          <button
                            type="button"
                            onClick={() => toggleItemDespesa(activeCategoryKey, item.id, true)}
                            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              item.temDespesa
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-[#5C5852] hover:text-[#22201D]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            SIM
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleItemDespesa(activeCategoryKey, item.id, false)}
                            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              !item.temDespesa
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-[#5C5852] hover:text-[#22201D]'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            NÃO
                          </button>
                        </div>

                        {/* Value Input (Only active if SIM) */}
                        {item.temDespesa && (
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C5852]">R$</span>
                            <input
                              type="number"
                              value={item.valorDeclarado || ''}
                              onChange={(e) => updateItemValue(activeCategoryKey, item.id, Number(e.target.value) || 0)}
                              placeholder="0,00"
                              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-emerald-400 font-bold text-sm text-[#22201D] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Item Adder */}
              {addingCustomForCategory === activeCategoryKey ? (
                <div className="p-4 bg-[#FAF7F1] rounded-xl border border-[#E1DBD2] flex items-center gap-3">
                  <input
                    type="text"
                    value={newCustomLabel}
                    onChange={(e) => setNewCustomLabel(e.target.value)}
                    placeholder="Digite o nome da conta personalizada..."
                    className="flex-1 px-3.5 py-2 rounded-lg border border-[#E1DBD2] text-sm text-[#22201D] focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <button
                    onClick={() => handleAddCustomItem(activeCategoryKey)}
                    className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-lg hover:bg-brand/90 cursor-pointer"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setAddingCustomForCategory(null)}
                    className="px-3 py-2 text-xs font-bold text-[#5C5852] hover:text-[#22201D] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCustomForCategory(activeCategoryKey)}
                  className="w-full py-3 border-2 border-dashed border-[#E1DBD2] rounded-xl text-xs font-bold text-[#5C5852] hover:border-brand hover:text-brand flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar outro gasto nesta categoria</span>
                </button>
              )}

              {/* Specific Debt Section inside Category 9 */}
              {activeCategoryKey === 'financeiro' && (
                <div className="pt-6 border-t border-[#E1DBD2] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#22201D]">
                        Dívidas em Atraso ou Negociadas (Detalhar Credores)
                      </h4>
                      <p className="text-xs text-[#5C5852]">
                        Cadastre seus cartões estourados, empréstimos ou pendências para organizar a quitação.
                      </p>
                    </div>
                    <button
                      onClick={addSpecificDebt}
                      className="px-3 py-1.5 bg-brand text-white font-bold text-xs rounded-lg flex items-center gap-1.5 hover:bg-brand/90 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Dívida
                    </button>
                  </div>

                  {(data.debts || []).length === 0 ? (
                    <div className="p-4 bg-[#FAF7F1] rounded-xl border border-[#E1DBD2] text-center text-xs text-[#5C5852]">
                      Nenhuma dívida específica cadastrada ainda. Clique no botão acima para adicionar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(data.debts || []).map((debt) => (
                        <div key={debt.id} className="p-3.5 bg-white rounded-xl border border-[#E1DBD2] flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            value={debt.credor}
                            onChange={(e) => updateSpecificDebt(debt.id, { credor: e.target.value })}
                            placeholder="Credor (ex: Cartão Nubank)"
                            className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-[#E1DBD2] text-xs font-bold"
                          />
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C5852]">R$</span>
                            <input
                              type="number"
                              value={debt.valor || ''}
                              onChange={(e) => updateSpecificDebt(debt.id, { valor: Number(e.target.value) || 0 })}
                              placeholder="Total devido"
                              className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-[#E1DBD2] text-xs font-bold"
                            />
                          </div>
                          <select
                            value={debt.tipo}
                            onChange={(e) => updateSpecificDebt(debt.id, { tipo: e.target.value as any })}
                            className="px-2.5 py-1.5 rounded-lg border border-[#E1DBD2] text-xs font-medium"
                          >
                            <option value="cartao">Cartão de Crédito</option>
                            <option value="banco">Banco / Empréstimo</option>
                            <option value="pessoal">Pessoa Física</option>
                            <option value="outro">Outro</option>
                          </select>
                          <button
                            onClick={() => removeSpecificDebt(debt.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* On-Demand AI Consult Modal */}
      {consultingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E1DBD2] shadow-xl max-w-lg w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#E1DBD2] pb-3">
              <div className="flex items-center gap-2 font-extrabold text-base text-[#22201D]">
                <Bot className="w-5 h-5 text-brand" />
                <span>Consultoria do Copiloto SPAGET</span>
              </div>
              <button
                onClick={() => setConsultingItem(null)}
                className="text-[#5C5852] hover:text-[#22201D] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#22201D]">
              <div className="bg-[#FAF7F1] p-3.5 rounded-xl border border-[#E1DBD2]">
                <strong className="block text-xs uppercase tracking-wider text-[#5C5852]">Item Selecionado:</strong>
                <span className="font-bold text-base">{consultingItem.rotulo}</span>
                <div className="text-xs text-[#5C5852] mt-1">
                  Valor Atual: <strong className="text-emerald-700">R$ {(consultingItem.valorDeclarado || 0).toFixed(2)}</strong> | Sugestão Mínima: <strong>{consultingItem.sugestaoMinima}</strong>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-[#5C5852]">
                <p>
                  💡 <strong>Como otimizar este item sem passar necessidade:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Se este item for essencial para o trabalho ou saúde, mantenha o valor atual.</li>
                  <li>Se for um gasto discricionário (lazer ou conveniência), defina uma meta de redução de 20% a 40% na Etapa 3 (Cenários).</li>
                  <li>Compare sempre o custo deste item em relação ao teto mensal total da sua renda declarada.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setConsultingItem(null)}
                className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand/90 cursor-pointer"
              >
                Entendi, voltar ao diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional & Grocery Calculator Modal */}
      <NutritionalFoodModal
        isOpen={isNutritionalModalOpen}
        onClose={() => setIsNutritionalModalOpen(false)}
        onExportToDiagnostico={handleExportNutritionalBreakdown}
      />

      {/* Confirmation & Next Stage Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-[#5C5852]">
          Conclua o diagnóstico das 9 categorias para destravar a <strong>Etapa 2: Renda Extra</strong>.
        </div>
        <button
          onClick={handleConfirmStage1}
          className="px-6 py-3.5 bg-brand text-white font-extrabold text-sm rounded-xl hover:bg-brand/90 flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Confirmar Diagnóstico e Ir para Etapa 2</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
