import React, { useState } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { ActionStep } from '../types';
import { Plus, Trash, Check, ArrowRight, ShieldCheck, HelpCircle, Cpu } from 'lucide-react';

export const PlanoStage: React.FC = () => {
  const { data, updateData } = useSpaget();
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);

  const selectedSkills = data.skills.filter((s) => s.selecionada);

  const generateActionsWithAI = async () => {
    if (!data.selectedRevenueSourceId) return;
    const activeSkill = selectedSkills.find(s => s.id === data.selectedRevenueSourceId);
    if (!activeSkill) return;

    setIsGeneratingActions(true);
    try {
      const response = await fetch('/api/gemini/generate-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: activeSkill })
      });
      if (!response.ok) throw new Error('Erro ao gerar ações.');
      const actions: Array<{ descricao: string; prazoEstimado: number }> = await response.json();
      
      const newActions: ActionStep[] = actions.map((act, index) => ({
        id: `action-${Date.now()}-${index}`,
        descricao: act.descricao,
        prazoEstimado: act.prazoEstimado
      }));

      updateData(prev => ({
        ...prev,
        actions: newActions
      }));
    } catch (err) {
      console.error(err);
      alert('Desculpe, ocorreu um erro ao gerar o plano de ações com a Inteligência Artificial.');
    } finally {
      setIsGeneratingActions(false);
    }
  };

  // Selected source from Stage 2
  const activeSource = selectedSkills.find((s) => s.id === data.selectedRevenueSourceId);

  // Math summaries for Stage 4 (9 Categorias)
  let totalExpenses = 0;
  if (data.categorizedExpenses) {
    Object.values(data.categorizedExpenses).forEach((itemsList) => {
      if (Array.isArray(itemsList)) {
        itemsList.forEach((item) => {
          if (item.temDespesa) {
            totalExpenses += Number(item.valorDeclarado) || 0;
          }
        });
      }
    });
  }
  const buracoOriginal = totalExpenses - (Number(data.currentRevenue) || 0);
  const totalDebts = (data.debts || []).reduce((sum, d) => sum + (Number(d.valor) || 0), 0);

  const plannedBaseRevenue = Number(data.plannedRevenue['base'] ?? data.currentRevenue) || 0;
  const plannedExtraRevenue = selectedSkills.reduce(
    (sum, s) => sum + (Number(data.plannedRevenue[s.id] ?? s.quantoPoderiaGerar) || 0),
    0
  );
  const totalPlannedRevenue = plannedBaseRevenue + plannedExtraRevenue;

  const totalPlannedExpenses = data.fixedExpenses.reduce(
    (sum, e) => sum + (Number(data.plannedExpenses[e.id] ?? e.valor) || 0),
    0
  ) + data.variableExpenses.reduce(
    (sum, e) => sum + (Number(data.plannedExpenses[e.id] ?? e.valor) || 0),
    0
  );

  const priorityPayment = Number(data.priorityDebtPayment) || 0;
  const otherPayments = Object.values(data.otherDebtsPayments).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  const totalDebtPayments = priorityPayment + otherPayments;

  const resultadoFinal = totalPlannedRevenue - totalPlannedExpenses - totalDebtPayments;

  // Add Action Step
  const addAction = () => {
    const newAction: ActionStep = {
      id: `action-${Date.now()}`,
      descricao: '',
      prazoEstimado: 0,
    };
    updateData((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  const removeAction = (id: string) => {
    updateData((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }));
  };

  const updateAction = (id: string, fields: Partial<ActionStep>) => {
    updateData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => (a.id === id ? { ...a, ...fields } : a)),
    }));
  };

  const updateDebtStartDate = (id: string, dateStr: string) => {
    updateData((prev) => ({
      ...prev,
      debtStartDates: {
        ...prev.debtStartDates,
        [id]: dateStr,
      },
    }));
  };

  // Close Stage 4 -> Final Concluded screen!
  const handleCloseStage = () => {
    if (!data.stage4Confirmed) return;
    updateData((prev) => {
      const completed = prev.completedStages.includes('plano')
        ? prev.completedStages
        : [...prev.completedStages, 'plano'];
      return {
        ...prev,
        completedStages: completed,
        currentStage: 'concluido',
      };
    });
  };

  const ResultadoDominante: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
    // Stage 4 Dominant Outcome = Next concrete action (or action step #1)
    const nextActionText = data.actions[0]?.descricao || 'Definir primeira ação';
    const safetyPeriod = data.actions[0]?.prazoEstimado 
      ? Math.round(data.actions[0].prazoEstimado * (data.safetyMarginFactor || 1.5)) 
      : 0;

    return (
      <div className={`bg-[#FAF7F1] border-2 border-[#E1DBD2] p-6 rounded-xl relative overflow-hidden ${isMobile ? 'block lg:hidden mb-6' : 'hidden lg:block'}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#5C5852] mb-1">Próxima Ação Concreta</p>
        
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#FAF7F1] border border-brand text-brand">
            <ShieldCheck className="w-4 h-4" /> COMPROMISSO DE INÍCIO
          </span>
          <div className="text-2xl font-black text-[#22201D] leading-tight">
            {nextActionText}
          </div>
          {safetyPeriod > 0 && (
            <p className="text-xs text-[#5C5852]">
              Prazo real estimado: <strong className="text-brand">{safetyPeriod} dias</strong> (com margem de segurança de {(data.safetyMarginFactor || 1.5)}x inclusa).
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E1DBD2] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#5C5852]">Primeira Fonte de Renda:</span>
            <span className="font-semibold text-[#22201D] truncate max-w-[180px]">{activeSource?.habilidade || 'Nenhuma selecionada'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C5852]">Início Planejado Dívidas:</span>
            <span className="font-semibold text-[#22201D]">
              {Object.keys(data.debtStartDates).length > 0 ? 'Datas planejadas' : 'Sem dívidas a pagar'}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-[#5C5852] mt-4 italic text-center">
          Alterações recalculam o restante.
        </p>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. Mobile summary stacks first */}
      <ResultadoDominante isMobile={true} />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (60%): Inputs, Lists, and Form controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          
          {/* Header/Instructions */}
          <div>
            <h1 className="text-2xl font-extrabold text-[#22201D] tracking-tight">
              4. Colocar o plano em prática
            </h1>
            <p className="text-sm text-[#5C5852] mt-1 leading-relaxed">
              Organize as decisões tomadas em ações pequenas. Esta etapa serve para fechar prazos e definir o primeiro passo.
            </p>
          </div>

          {/* SECTION A: SELEÇÃO DA PRIMEIRA FONTE DE RECEITA */}
          <div className="bg-white shadow-sm border-l-4 border-l-[#C8442F] p-5 rounded-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#22201D]">
                Qual fonte de renda começa primeiro?
              </h3>
              <p className="text-xs text-[#5C5852] mt-0.5">
                Escolha uma das habilidades que selecionou na Etapa 2 para focar e tirar do papel primeiro.
              </p>
            </div>

            {selectedSkills.length === 0 ? (
              <p className="text-xs text-[#5C5852] italic p-3 text-center border border-dashed border-[#E1DBD2] rounded-lg">
                Você não selecionou habilidades para testar na Etapa 2. Por favor, volte e escolha pelo menos uma.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedSkills.map((skill) => {
                  const active = data.selectedRevenueSourceId === skill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => updateData((prev) => ({ ...prev, selectedRevenueSourceId: skill.id }))}
                      className={`p-3 text-left border rounded-lg transition-colors focus-ring cursor-pointer select-none ${
                        active
                          ? 'border-[#C8442F] bg-[#F8E3DE]/25'
                          : 'border-[#E1DBD2] hover:border-[#C8442F]/50 bg-[#FAF7F1]'
                      }`}
                    >
                      <p className="text-xs font-bold text-[#22201D] truncate">{skill.habilidade}</p>
                      <p className="text-[10px] text-[#5C5852] mt-0.5">Gerará aprox. R$ {skill.quantoPoderiaGerar.toLocaleString('pt-BR')}/mês</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Breaking into small action steps */}
            {data.selectedRevenueSourceId && (
              <div className="pt-4 border-t border-[#E1DBD2] space-y-3">
                {/* Safety Margin Selector Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F1]/50 p-4 rounded-lg border border-[#E1DBD2] border-l-4 border-l-[#C8442F] mb-4">
                  <div>
                    <span className="text-xs font-bold text-[#22201D] block">Fator de Margem de Segurança</span>
                    <span className="text-[10px] text-[#5C5852]">Multiplica o prazo original para absorver imprevistos e desatenção</span>
                  </div>
                  <div className="flex rounded-md border border-[#E1DBD2] overflow-hidden bg-white shrink-0">
                    {[1.2, 1.5, 2.0].map((factor) => {
                      const active = (data.safetyMarginFactor || 1.5) === factor;
                      const label = factor === 1.2 ? '1.2x Otimista' : factor === 1.5 ? '1.5x Seguro' : '2.0x Conservador';
                      return (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => updateData((prev) => ({ ...prev, safetyMarginFactor: factor }))}
                          className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#C8442F] text-white'
                              : 'text-[#22201D] hover:bg-gray-100 bg-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#22201D] uppercase">Ações para tirar a fonte do papel</span>
                  <div className="flex gap-2">
                    {data.selectedRevenueSourceId && (
                      <button
                        type="button"
                        onClick={generateActionsWithAI}
                        disabled={isGeneratingActions}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border focus-ring transition-all cursor-pointer ${
                          isGeneratingActions
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-[#E6F0E6] border-[#4F7655]/30 text-[#4F7655] hover:bg-[#d0ebd0]'
                        }`}
                      >
                        <Cpu className={`w-3.5 h-3.5 ${isGeneratingActions ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingActions ? 'Gerando...' : 'Planejar com IA'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addAction}
                      className="inline-flex items-center gap-1 bg-[#FAF7F1] text-[#C8442F] hover:bg-[#F8E3DE] text-xs font-bold px-2.5 py-1 rounded border border-[#C8442F] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar ação
                    </button>
                  </div>
                </div>

                {data.actions.length === 0 ? (
                  <p className="text-xs text-[#5C5852] italic p-3 text-center border border-dashed border-[#E1DBD2] rounded-lg">
                    Nenhuma ação adicionada ainda. Adicione as micro-tarefas necessárias para começar.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.actions.map((action, idx) => {
                      const safetyPeriod = action.prazoEstimado ? Math.round(action.prazoEstimado * (data.safetyMarginFactor || 1.5)) : 0;
                      return (
                        <div key={action.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-[#E1DBD2] rounded-lg bg-[#FAF7F1]">
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-[#5C5852] uppercase mb-0.5">Ação #{idx + 1}</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Mandar mensagem no Whatsapp para 5 clientes..."
                              value={action.descricao}
                              onChange={(e) => updateAction(action.id, { descricao: e.target.value })}
                              className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2 py-1 text-xs focus-ring text-[#22201D] font-medium"
                            />
                          </div>

                          <div className="w-full sm:w-28">
                            <label className="block text-[9px] font-bold text-[#5C5852] uppercase mb-0.5">Prazo (Dias)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={action.prazoEstimado || ''}
                              onChange={(e) => updateAction(action.id, { prazoEstimado: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2 py-1 text-xs focus-ring text-[#22201D]"
                            />
                          </div>

                          <div className="w-full sm:w-36 text-center sm:text-right bg-[#E6F0E6] text-[#4F7655] font-bold text-[10px] px-2.5 py-1.5 rounded self-end sm:self-auto border border-[#4F7655]/10">
                            Prazo seguro: {safetyPeriod} dias
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAction(action.id)}
                            className="p-1 text-[#B72E2A] hover:bg-[#F8E3DE] rounded focus-ring self-end sm:self-auto"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION B: QUANDO COMEÇO A PAGAR AS DÍVIDAS */}
          {data.debts.length > 0 && (
            <div className="bg-white shadow-sm border-l-4 border-l-[#C8442F] p-5 rounded-lg space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#22201D]">
                  Datas de Início dos Pagamentos
                </h3>
                <p className="text-xs text-[#5C5852] mt-0.5">
                  Insira o compromisso de data para início de cada pagamento planejado.
                </p>
              </div>

              <div className="space-y-2">
                {/* Priority debt payment */}
                {data.priorityDebtId && (
                  (() => {
                    const priorityDebt = data.debts.find((d) => d.id === data.priorityDebtId);
                    if (!priorityDebt) return null;
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#F8E3DE]/10 border border-[#C8442F]/20 rounded-lg">
                        <div>
                          <span className="text-xs font-bold text-brand">{priorityDebt.credor} (Prioritária)</span>
                          <p className="text-[10px] text-[#5C5852]">Mensal planejado: R$ {priorityPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="relative w-full sm:w-44">
                          <input
                            type="date"
                            required
                            value={data.debtStartDates[priorityDebt.id] || ''}
                            onChange={(e) => updateDebtStartDate(priorityDebt.id, e.target.value)}
                            className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2.5 py-1.5 text-xs focus-ring text-[#22201D]"
                          />
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Other debts payments */}
                {data.debts.map((debt) => {
                  if (debt.id === data.priorityDebtId) return null;
                  const payment = Number(data.otherDebtsPayments[debt.id]) || 0;
                  return (
                    <div key={debt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-[#E1DBD2] bg-[#FAF7F1] rounded-lg">
                      <div>
                        <span className="text-xs font-bold text-[#22201D]">{debt.credor}</span>
                        <p className="text-[10px] text-[#5C5852]">Mensal planejado: R$ {payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="relative w-full sm:w-44">
                        <input
                          type="date"
                          required
                          value={data.debtStartDates[debt.id] || ''}
                          onChange={(e) => updateDebtStartDate(debt.id, e.target.value)}
                          className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2.5 py-1.5 text-xs focus-ring text-[#22201D]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION C: SEMENTE DO PRÓXIMO CICLO */}
          <div className="bg-white shadow-sm border-l-4 border-l-[#C8442F] p-5 rounded-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#22201D]">
                Próximos passos gerais do ciclo
              </h3>
              <p className="text-xs text-[#5C5852] mt-0.5">
                Depois de concluir este desafio de 21 dias do SPAGET, qual o maior ponto pendente que precisará de resolução?
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Ex: Renegociar taxa de juros do cartão de crédito, criar uma reserva de emergência física..."
                value={data.whatToResolveNext}
                onChange={(e) => updateData((prev) => ({ ...prev, whatToResolveNext: e.target.value }))}
                className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded-lg py-2.5 px-3.5 text-xs focus-ring text-[#22201D] font-medium"
              />
            </div>
          </div>

          {/* SECTION D: SUMMARY (4 BLOCKS) & CONFIRMATION */}
          <div className="bg-white shadow-sm border-l-4 border-l-[#4F7655] p-5 rounded-lg space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#22201D]">
                Resumo dos 4 Blocos de Ação
              </h3>
              <p className="text-xs text-[#5C5852] mt-0.5">
                Revise a estrutura de decisão final do seu planejamento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Block 1: Situação */}
              <div className="p-3.5 border border-[#E1DBD2] rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-[#5C5852] uppercase">1. Situação Identificada</span>
                <p className="text-xs font-extrabold text-[#22201D]">
                  {buracoOriginal > 0 
                    ? `Déficit mensal de R$ ${buracoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : `Superávit mensal de R$ ${Math.abs(buracoOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
                <p className="text-[10px] text-[#5C5852] leading-tight">Total de despesas do diagnóstico: R$ {totalExpenses.toLocaleString('pt-BR')}</p>
              </div>

              {/* Block 2: Receita */}
              <div className="p-3.5 border border-[#E1DBD2] rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-[#5C5852] uppercase">2. Renda Planejada Extra</span>
                <p className="text-xs font-extrabold text-brand">
                  + R$ {totalPlannedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                </p>
                <p className="text-[10px] text-[#5C5852] leading-tight">Foco inicial na habilidade: "{activeSource?.habilidade || 'Nenhuma selecionada'}"</p>
              </div>

              {/* Block 3: Orçamento */}
              <div className="p-3.5 border border-[#E1DBD2] rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-[#5C5852] uppercase">3. Orçamento Final Planejado</span>
                <p className="text-xs font-extrabold text-[#4F7655]">
                  Sobra: R$ {resultadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                </p>
                <p className="text-[10px] text-[#5C5852] leading-tight">Pagamentos planejados de dívidas: R$ {totalDebtPayments.toLocaleString('pt-BR')}</p>
              </div>

              {/* Block 4: Primeira Ação */}
              <div className="p-3.5 border border-[#E1DBD2] rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-[#5C5852] uppercase">4. Primeira Ação Prática</span>
                <p className="text-xs font-extrabold text-[#22201D] truncate">
                  "{data.actions[0]?.descricao || 'Nenhuma ação listada'}"
                </p>
                <p className="text-[10px] text-[#5C5852] leading-tight">
                  Prazo com margem de segurança: {data.actions[0]?.prazoEstimado ? Math.round(data.actions[0].prazoEstimado * (data.safetyMarginFactor || 1.5)) : 0} dias
                </p>
              </div>

            </div>

            {/* Close/Confirm checkpoint */}
            <div className="pt-4 border-t border-[#E1DBD2] space-y-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.stage4Confirmed}
                  onChange={(e) => updateData((prev) => ({ ...prev, stage4Confirmed: e.target.checked }))}
                  className="w-4 h-4 text-brand bg-[#FAF7F1] border-[#E1DBD2] rounded focus:ring-brand mt-0.5 accent-[#C8442F]"
                />
                <span className="text-xs text-[#22201D] font-semibold leading-relaxed">
                  Os quatro blocos acima fazem sentido juntos e representam o meu plano de ação definitivo para os próximos 21 dias.
                </span>
              </label>

              <div>
                <button
                  type="button"
                  disabled={!data.stage4Confirmed}
                  onClick={handleCloseStage}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-lg focus-ring transition-colors select-none ${
                    data.stage4Confirmed
                      ? 'bg-[#C8442F] hover:bg-[#9F3022] text-[#FAF7F1]'
                      : 'bg-[#FAF7F1] border border-[#E1DBD2] text-[#5C5852] cursor-not-allowed'
                  }`}
                >
                  <span>Concluir meu SPAGET</span>
                  <Check className="w-4 h-4" />
                </button>
                {!data.stage4Confirmed && (
                  <p className="text-[10px] text-[#B72E2A] mt-1.5 font-medium">
                    Marque o checkbox de compromisso final acima para poder concluir o SPAGET.
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (40%): Sticky summary (Desktop only) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          <ResultadoDominante />
        </div>

      </div>

    </div>
  );
};
