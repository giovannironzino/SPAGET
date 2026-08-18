import React, { useEffect, useState } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { CategorizedExpenseItem, CategoryKey } from '../types';
import { calculateScenarios, BudgetScenario } from '../services/calibrationEngine';
import { 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Award, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

export const OrcamentoStage: React.FC = () => {
  const { data, updateData, moveToStage } = useSpaget();
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<'minimo' | 'ideal' | 'livre'>('ideal');

  // Compute 03 Scenarios 100% Offline (Zero API Cost)
  const scenarios = calculateScenarios(data);

  // Selected skills from Stage 2
  const selectedSkills = data.skills.filter((s) => s.selecionada);

  // Collect all active items from 9 categories
  const activeCategorizedItems: CategorizedExpenseItem[] = [];
  if (data.categorizedExpenses) {
    Object.values(data.categorizedExpenses).forEach((itemsList) => {
      if (Array.isArray(itemsList)) {
        itemsList.forEach((item) => {
          if (item.temDespesa) {
            activeCategorizedItems.push(item);
          }
        });
      }
    });
  }

  // Initialize planned values if empty
  useEffect(() => {
    updateData((prev) => {
      let changed = false;
      const plannedExpenses = { ...prev.plannedExpenses };
      const plannedRevenue = { ...prev.plannedRevenue };

      activeCategorizedItems.forEach((item) => {
        if (plannedExpenses[item.id] === undefined) {
          plannedExpenses[item.id] = item.valorDeclarado;
          changed = true;
        }
      });

      if (plannedRevenue['base'] === undefined) {
        plannedRevenue['base'] = prev.currentRevenue;
        changed = true;
      }
      selectedSkills.forEach((s) => {
        if (plannedRevenue[s.id] === undefined) {
          plannedRevenue[s.id] = s.quantoPoderiaGerar;
          changed = true;
        }
      });

      if (changed) {
        return {
          ...prev,
          plannedExpenses,
          plannedRevenue,
        };
      }
      return prev;
    });
  }, [activeCategorizedItems.length, selectedSkills.length]);

  // Apply a Scenario to Planned Expenses (1-click preset)
  const applyScenarioPreset = (scenarioKey: 'minimo' | 'ideal' | 'livre') => {
    setSelectedScenarioKey(scenarioKey);
    const targetScenario = scenarios[scenarioKey];
    updateData((prev) => ({
      ...prev,
      plannedExpenses: {
        ...prev.plannedExpenses,
        ...targetScenario.plannedExpenses,
      },
    }));
  };

  // Math for Stage 3
  const plannedBaseRevenue = Number(data.plannedRevenue['base'] ?? data.currentRevenue) || 0;
  const plannedExtraRevenue = selectedSkills.reduce(
    (sum, s) => sum + (Number(data.plannedRevenue[s.id] ?? s.quantoPoderiaGerar) || 0),
    0
  );
  const totalPlannedRevenue = plannedBaseRevenue + plannedExtraRevenue;

  const totalPlannedExpenses = activeCategorizedItems.reduce(
    (sum, item) => sum + (Number(data.plannedExpenses[item.id] ?? item.valorDeclarado) || 0),
    0
  );

  // Debt Payments
  const priorityPayment = Number(data.priorityDebtPayment) || 0;
  const otherPayments = Object.values(data.otherDebtsPayments || {}).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  const totalDebtPayments = priorityPayment + otherPayments;

  const resultadoOrcamento = totalPlannedRevenue - totalPlannedExpenses - totalDebtPayments;
  const isNegative = resultadoOrcamento < 0;

  // Debt Strategy sorting (Snowball vs Avalanche)
  const debtStrategy = data.debtStrategy || 'snowball';

  const updatePlannedExpense = (id: string, value: number) => {
    updateData((prev) => ({
      ...prev,
      plannedExpenses: {
        ...prev.plannedExpenses,
        [id]: Math.max(0, value),
      },
    }));
  };

  const setDebtStrategy = (strategy: 'snowball' | 'avalanche') => {
    updateData((prev) => ({
      ...prev,
      debtStrategy: strategy,
    }));
  };

  const handleConfirmStage3 = () => {
    updateData((prev) => ({
      ...prev,
      stage3Confirmed: true,
      currentStage: 'plano',
      completedStages: Array.from(new Set([...prev.completedStages, 'orcamento'])),
    }));
    moveToStage('plano');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-[#E1DBD2] p-6 rounded-2xl shadow-sm space-y-2">
        <h2 className="text-xl font-extrabold text-[#22201D]">
          3. Fazer o Orçamento Fechar (03 Cenários Consultivos)
        </h2>
        <p className="text-sm text-[#5C5852]">
          O SPAGET calculou 3 cenários orçamentários para você. Selecione o cenário desejado e faça ajustes finos item a item.
        </p>
      </div>

      {/* 03 Budget Scenarios Panel (Zero API Cost) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand" />
          <h3 className="font-extrabold text-base text-[#22201D]">
            Painel Comparativo de 03 Cenários Orçamentários
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['minimo', 'ideal', 'livre'] as const).map((scKey) => {
            const sc = scenarios[scKey];
            const isSelected = selectedScenarioKey === scKey;

            return (
              <div
                key={sc.key}
                onClick={() => applyScenarioPreset(sc.key)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative ${
                  isSelected
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-[#FAF7F1] border-[#E1DBD2] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-light text-brand">
                    {sc.badge}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-emerald-600 font-bold" />}
                </div>

                <h4 className="font-extrabold text-sm text-[#22201D]">{sc.name}</h4>
                <p className="text-xs text-[#5C5852] min-h-[36px]">{sc.description}</p>

                <div className="border-t border-[#E1DBD2] pt-3 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span>Gastos Cenário:</span>
                    <span className="font-bold">R$ {sc.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-[#E1DBD2]/60">
                    <span>Sobra / Margem:</span>
                    <span className={sc.isDeficit ? 'text-red-600' : 'text-emerald-700'}>
                      R$ {sc.surplusOrDeficit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-[#E1DBD2] text-[#5C5852] hover:text-[#22201D]'
                  }`}
                >
                  {isSelected ? 'Cenário Selecionado ✓' : 'Aplicar Este Cenário'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Math Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E1DBD2] shadow-sm">
          <span className="text-xs font-bold text-[#5C5852] block">Renda Total Planejada</span>
          <span className="text-xl font-extrabold text-emerald-700">
            R$ {totalPlannedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1DBD2] shadow-sm">
          <span className="text-xs font-bold text-[#5C5852] block">Gastos Planejados</span>
          <span className="text-xl font-extrabold text-slate-800">
            R$ {totalPlannedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1DBD2] shadow-sm">
          <span className="text-xs font-bold text-[#5C5852] block">Pagamento de Dívidas</span>
          <span className="text-xl font-extrabold text-blue-700">
            R$ {totalDebtPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${isNegative ? 'bg-[#F8E3DE] border-[#F8E3DE]' : 'bg-[#E2F1E8] border-[#E2F1E8]'}`}>
          <span className="text-xs font-bold text-[#5C5852] block">
            {isNegative ? 'Falta para Fechar:' : 'Sobra de Margem:'}
          </span>
          <span className={`text-xl font-extrabold ${isNegative ? 'text-[#C8442F]' : 'text-emerald-800'}`}>
            R$ {Math.abs(resultadoOrcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Strategy Selector for Debt Payoff */}
      <div className="bg-white p-6 rounded-2xl border border-[#E1DBD2] shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-[#22201D] flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" />
            Escolha sua Estratégia de Quitação de Dívidas
          </h3>
          <p className="text-xs text-[#5C5852]">
            Estudos comprovam que a estratégia certa reduz a ansiedade e acelera a eliminação de débitos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strategy 1: Snowball */}
          <button
            type="button"
            onClick={() => setDebtStrategy('snowball')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              debtStrategy === 'snowball'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-[#FAF7F1] border-[#E1DBD2] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#22201D] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                Vitórias Rápidas (Recomendado)
              </span>
              {debtStrategy === 'snowball' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
            </div>
            <p className="text-xs text-[#5C5852] mt-1">
              Pagar as dívidas menores primeiro. Isso gera alívio imediato e dopamina para manter o plano firme nos 21 dias.
            </p>
          </button>

          {/* Strategy 2: Avalanche */}
          <button
            type="button"
            onClick={() => setDebtStrategy('avalanche')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              debtStrategy === 'avalanche'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-[#FAF7F1] border-[#E1DBD2] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#22201D] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Economia Máxima de Juros
              </span>
              {debtStrategy === 'avalanche' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
            </div>
            <p className="text-xs text-[#5C5852] mt-1">
              Pagar as maiores dívidas primeiro para economizar o máximo possível em taxas de juros no longo prazo.
            </p>
          </button>
        </div>
      </div>

      {/* Adjust Expenses across active 9 Category Items */}
      <div className="bg-white p-6 rounded-2xl border border-[#E1DBD2] shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-[#22201D]">
          Ajuste Fino por Item (Palavra Final do Usuário)
        </h3>
        <p className="text-xs text-[#5C5852]">
          Você tem a palavra final em cada conta. Altere o valor de qualquer item e veja o resultado do mês ser recalculado instantaneamente:
        </p>

        {activeCategorizedItems.length === 0 ? (
          <div className="p-4 bg-[#FAF7F1] rounded-xl text-center text-xs text-[#5C5852]">
            Nenhuma conta marcada com SIM no Diagnóstico.
          </div>
        ) : (
          <div className="space-y-3">
            {activeCategorizedItems.map((item) => {
              const valorOriginal = item.valorDeclarado;
              const valorPlanejado = Number(data.plannedExpenses[item.id] ?? valorOriginal) || 0;
              const economizado = Math.max(0, valorOriginal - valorPlanejado);

              return (
                <div key={item.id} className="p-3.5 bg-[#FAF7F1] rounded-xl border border-[#E1DBD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-[#22201D]">{item.rotulo}</span>
                    <div className="text-xs text-[#5C5852]">
                      Valor inicial digitado: R$ {valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {economizado > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Corte de R$ {economizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}

                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C5852]">R$</span>
                      <input
                        type="number"
                        value={valorPlanejado || ''}
                        onChange={(e) => updatePlannedExpense(item.id, Number(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[#E1DBD2] font-bold text-sm bg-white text-[#22201D]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Button */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirmStage3}
          className="px-6 py-3.5 bg-brand text-white font-extrabold text-sm rounded-xl hover:bg-brand/90 flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Confirmar Orçamento e Ver Plano de 21 Dias</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
