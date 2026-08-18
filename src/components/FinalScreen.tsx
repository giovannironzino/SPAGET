import React, { useState, useEffect } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { Download, RefreshCcw, Sparkles, AlertCircle, ArrowUpRight, TrendingUp, Cpu } from 'lucide-react';

export const FinalScreen: React.FC = () => {
  const { data, exportBackup, resetData } = useSpaget();
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  useEffect(() => {
    const fetchNarrative = async () => {
      setIsLoadingNarrative(true);
      try {
        const response = await fetch('/api/gemini/generate-narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.narrative) {
            setNarrative(res.narrative);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar narrativa:', err);
      } finally {
        setIsLoadingNarrative(false);
      }
    };
    fetchNarrative();
  }, [data]);

  // Math summaries for Final Compare (9 Categorias)
  let totalExpenses = 0;
  let totalPlannedExpenses = 0;
  if (data.categorizedExpenses) {
    Object.values(data.categorizedExpenses).forEach((itemsList) => {
      if (Array.isArray(itemsList)) {
        itemsList.forEach((item) => {
          if (item.temDespesa) {
            const originalVal = Number(item.valorDeclarado) || 0;
            totalExpenses += originalVal;
            totalPlannedExpenses += Number(data.plannedExpenses[item.id] ?? originalVal) || 0;
          }
        });
      }
    });
  }

  const totalDebts = (data.debts || []).reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
  const buracoOriginal = totalExpenses - (Number(data.currentRevenue) || 0);

  const selectedSkills = data.skills.filter((s) => s.selecionada);
  const plannedBaseRevenue = Number(data.plannedRevenue['base'] ?? data.currentRevenue) || 0;
  const plannedExtraRevenue = selectedSkills.reduce(
    (sum, s) => sum + (Number(data.plannedRevenue[s.id] ?? s.quantoPoderiaGerar) || 0),
    0
  );
  const totalPlannedRevenue = plannedBaseRevenue + plannedExtraRevenue;

  const priorityPayment = Number(data.priorityDebtPayment) || 0;
  const otherPayments = Object.values(data.otherDebtsPayments).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  const totalDebtPayments = priorityPayment + otherPayments;

  const resultadoFinal = totalPlannedRevenue - totalPlannedExpenses - totalDebtPayments;

  const firstAction = data.actions[0]?.descricao || 'Tirar nova renda do papel';
  const firstActionDays = data.actions[0]?.prazoEstimado 
    ? Math.round(data.actions[0].prazoEstimado * (data.safetyMarginFactor || 1.5)) 
    : 0;

  const exportCalendar = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SPAGET//Planejamento de 21 Dias//BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const formatDateToICS = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    };

    let currentDayOffset = 0;
    const baseStartDate = data.challengeStartDate ? new Date(data.challengeStartDate) : new Date();

    data.actions.forEach((action, idx) => {
      const safetyPeriod = action.prazoEstimado ? Math.round(action.prazoEstimado * (data.safetyMarginFactor || 1.5)) : 1;
      
      const eventStartDate = new Date(baseStartDate);
      eventStartDate.setDate(eventStartDate.getDate() + currentDayOffset);
      
      const eventEndDate = new Date(eventStartDate);
      eventEndDate.setDate(eventEndDate.getDate() + safetyPeriod);

      const startStr = formatDateToICS(eventStartDate);
      const endStr = formatDateToICS(eventEndDate);
      const stampStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:action-${action.id}@spaget`);
      icsContent.push(`DTSTAMP:${stampStr}`);
      icsContent.push(`DTSTART;VALUE=DATE:${startStr}`);
      icsContent.push(`DTEND;VALUE=DATE:${endStr}`);
      icsContent.push(`SUMMARY:Ação SPAGET #${idx + 1}: ${action.descricao.slice(0, 50)}`);
      icsContent.push(`DESCRIPTION:Tarefa do plano de ação SPAGET: ${action.descricao}. Prazo seguro de ${safetyPeriod} dias.`);
      icsContent.push('END:VEVENT');

      currentDayOffset += safetyPeriod;
    });

    Object.entries(data.debtStartDates).forEach(([debtId, dateStr]) => {
      if (!dateStr) return;
      const debt = data.debts.find(d => d.id === debtId);
      if (!debt) return;

      const debtDate = new Date(dateStr as string);
      const startStr = formatDateToICS(debtDate);
      
      const endDate = new Date(debtDate);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = formatDateToICS(endDate);

      const stampStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const paymentAmount = debtId === data.priorityDebtId 
        ? data.priorityDebtPayment 
        : (data.otherDebtsPayments[debtId] || 0);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:debt-payment-${debtId}@spaget`);
      icsContent.push(`DTSTAMP:${stampStr}`);
      icsContent.push(`DTSTART;VALUE=DATE:${startStr}`);
      icsContent.push(`DTEND;VALUE=DATE:${endStr}`);
      icsContent.push(`SUMMARY:Vencimento Dívida: ${debt.credor}`);
      icsContent.push(`DESCRIPTION:Pagamento planejado de R$ ${paymentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o credor ${debt.credor}.`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `spaget-calendario-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportMarkdownPlan = () => {
    const activeSource = selectedSkills.find((s) => s.id === data.selectedRevenueSourceId);

    const md = [
      `# 📋 PLANO DE AÇÃO SPAGET - 21 DIAS`,
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
      `Período do Ciclo: ${data.challengeStartDate} a ${data.challengeEndDate}`,
      ``,
      `## 1. DIAGNÓSTICO FINANCEIRO INICIAL`,
      `- **Déficit Mensal Encontrado:** R$ ${buracoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      `- **Dívida Total Identificada:** R$ ${totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `- **Despesas Mensais Iniciais:** R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      `## 2. PLANO DE RECEITA ALVO (RENDA EXTRA)`,
      `- **Foco Principal de Renda:** ${activeSource ? activeSource.habilidade : 'Não selecionado'}`,
      `- **Estimativa de Renda Alvo Mensal Total:** R$ ${totalPlannedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      `- **Meta de Renda Extra:** R$ ${plannedExtraRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      ``,
      `## 3. ORÇAMENTO DE DESPESAS & AMORTIZAÇÃO DE DÍVIDAS`,
      `- **Novo Teto de Gastos Planejado:** R$ ${totalPlannedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      `- **Sobra Mensal Planejada (Sobra):** R$ ${resultadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
      `- **Pagamento Total de Dívidas Mensal:** R$ ${totalDebtPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
    ];

    if (data.debts.length > 0) {
      md.push(``);
      md.push(`### 💸 Cronograma de Pagamento de Dívidas`);
      data.debts.forEach((debt) => {
        const isPriority = debt.id === data.priorityDebtId;
        const payment = isPriority ? data.priorityDebtPayment : (data.otherDebtsPayments[debt.id] || 0);
        const startDate = data.debtStartDates[debt.id] || 'Não informada';
        const payoffMonths = payment > 0 ? Math.ceil(debt.valor / payment) : 'N/A';
        md.push(`- **${debt.credor}** (Dívida de R$ ${debt.valor.toLocaleString('pt-BR')})`);
        md.push(`  - Pagamento planejado: R$ ${payment.toLocaleString('pt-BR')}/mês`);
        md.push(`  - Início do pagamento: ${startDate}`);
        md.push(`  - Quitação estimada: em aprox. ${payoffMonths} meses`);
      });
    }

    if (data.actions.length > 0) {
      md.push(``);
      md.push(`## 🎯 MICRO-AÇÕES TÁTICAS SEQUENCIAIS`);
      md.push(`*Fator de Margem de Segurança aplicado: ${data.safetyMarginFactor || 1.5}x*`);
      md.push(``);
      data.actions.forEach((action, idx) => {
        const safetyPeriod = action.prazoEstimado ? Math.round(action.prazoEstimado * (data.safetyMarginFactor || 1.5)) : 0;
        md.push(`${idx + 1}. **${action.descricao}**`);
        md.push(`   - Prazo Estimado: ${action.prazoEstimado} dias (Prazo de segurança: **${safetyPeriod} dias**)`);
      });
    }

    if (data.whatToResolveNext.trim()) {
      md.push(``);
      md.push(`## 🌱 SEMENTE DO PRÓXIMO CICLO`);
      md.push(`- *Após este ciclo de 21 dias, meu foco futuro será:* "${data.whatToResolveNext}"`);
    }

    const blob = new Blob([md.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `spaget-plano-de-acao-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#FAF7F1] border-2 border-[#E1DBD2] rounded-2xl p-6 sm:p-10 space-y-10 text-center relative overflow-hidden">
        
        {/* Confirmed Indicator */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F0E6] text-[#4F7655]">
          <Sparkles className="h-8 w-8" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-[#22201D] tracking-tight">
            SPAGET Concluído!
          </h1>
          <p className="text-sm sm:text-base text-[#5C5852] max-w-lg mx-auto leading-relaxed">
            Seu diagnóstico foi traçado e seu plano de ação para os próximos 21 dias está estruturado. O foco agora é execução.
          </p>
        </div>

        {/* Narrative Box */}
        {(isLoadingNarrative || narrative) && (
          <div className="max-w-2xl mx-auto p-5 border border-[#E1DBD2] bg-[#FAF7F1]/30 rounded-xl text-left space-y-2 animate-fade-in relative">
            <span className="absolute top-2.5 right-3.5 flex items-center gap-1 text-[9px] font-bold text-[#5C5852] uppercase tracking-wider">
              <Cpu className="w-3 h-3 text-[#C8442F]" /> Síntese Realista do Plano
            </span>
            {isLoadingNarrative ? (
              <div className="space-y-2 py-1">
                <div className="h-3.5 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-3.5 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-3.5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-[#22201D] leading-relaxed italic font-serif">
                "{narrative}"
              </p>
            )}
          </div>
        )}

        {/* Compare: "No começo" vs "Agora" */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
          
          {/* No começo block */}
          <div className="bg-[#F8E3DE]/30 border border-[#E1DBD2] p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-[#C8442F] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E1DBD2] pb-2">
              <AlertCircle className="w-4 h-4" /> No começo do desafio
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-[#5C5852] font-bold uppercase">Buraco Mensal</p>
                <p className="text-lg font-black text-[#B72E2A] tabular-nums">
                  {buracoOriginal > 0 
                    ? `R$ ${buracoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês`
                    : 'R$ 0,00 (Sem déficit)'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-[#5C5852] font-bold uppercase">Dívida Total</p>
                  <p className="text-sm font-bold text-[#22201D] tabular-nums">R$ {totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#5C5852] font-bold uppercase">Receita Atual</p>
                  <p className="text-sm font-bold text-[#22201D] tabular-nums">R$ {(data.currentRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agora block */}
          <div className="bg-[#E6F0E6]/30 border border-[#4F7655]/20 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-[#4F7655] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#4F7655]/10 pb-2">
              <TrendingUp className="w-4 h-4" /> Agora (Plano de 21 Dias)
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-[#5C5852] font-bold uppercase">Orçamento Planejado (Sobra)</p>
                <p className="text-lg font-black text-[#4F7655] tabular-nums">
                  R$ {resultadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-[#5C5852] font-bold uppercase">Renda Alvo Mensal</p>
                  <p className="text-sm font-bold text-[#22201D] tabular-nums">R$ {totalPlannedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#5C5852] font-bold uppercase">Primeira Ação</p>
                  <p className="text-xs font-bold text-brand truncate" title={firstAction}>"{firstAction}"</p>
                  {firstActionDays > 0 && <p className="text-[9px] text-[#5C5852]">Prazo: {firstActionDays} dias</p>}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-6">
          <button
            onClick={exportBackup}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-[#FAF7F1] hover:bg-[#F8E3DE]/30 text-[#22201D] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#E1DBD2] focus-ring transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#5C5852]" />
            <span>Dados (Backup JSON)</span>
          </button>

          <button
            onClick={exportCalendar}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-[#E6F0E6] hover:bg-[#d0ebd0] text-[#4F7655] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#4F7655]/20 focus-ring transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sincronizar Calendário (.ics)</span>
          </button>

          <button
            onClick={exportMarkdownPlan}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-[#C8442F] hover:bg-[#a63421] text-white text-xs font-bold px-5 py-2.5 rounded-lg focus-ring transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowUpRight className="w-3.5 h-3.5 animate-bounce" />
            <span>Imprimir Plano (.md)</span>
          </button>
        </div>

        {/* Semente do proximo ciclo footer note */}
        {data.whatToResolveNext.trim() && (
          <div className="bg-[#FAF7F1] border border-[#E1DBD2] p-4 rounded-xl text-left max-w-xl mx-auto">
            <span className="text-[10px] font-bold text-[#5C5852] uppercase block mb-1">Semente para o próximo ciclo SPAGET</span>
            <p className="text-xs text-[#22201D] italic font-medium leading-relaxed">
              "{data.whatToResolveNext}"
            </p>
          </div>
        )}

        {/* Start over / Reset option */}
        <div className="pt-8 border-t border-[#E1DBD2] flex justify-center">
          <button
            type="button"
            onClick={() => setShowResetOptions(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[#5C5852] hover:text-[#B72E2A] underline underline-offset-2 focus-ring font-semibold cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Iniciar Novo Ciclo SPAGET</span>
          </button>
        </div>

      </div>

      {showResetOptions && (
        <div className="fixed inset-0 bg-[#22201D]/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#E1DBD2] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in text-left">
            <h3 className="text-sm font-bold text-[#22201D] uppercase tracking-wider border-b border-[#E1DBD2] pb-2">
              Iniciar Novo Ciclo SPAGET
            </h3>
            <p className="text-xs text-[#5C5852] leading-relaxed">
              Você concluiu seu ciclo com sucesso! Como deseja preparar seu próximo ciclo de 21 dias?
            </p>
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetData(true); // smart clone!
                  setShowResetOptions(false);
                }}
                className="w-full text-left p-3.5 rounded-lg border border-[#E1DBD2] hover:border-[#4F7655]/60 hover:bg-[#E6F0E6]/10 transition-all flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-[#4F7655] uppercase">🌱 Clonagem Inteligente (Recomendado)</span>
                <span className="text-[10px] text-[#5C5852]">Preserva seu diagnóstico de dívidas, despesas fixas e habilidades. Limpa apenas os planos de ação e tetos variáveis para economizar seu tempo de setup.</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetData(false); // full clean
                  setShowResetOptions(false);
                }}
                className="w-full text-left p-3.5 rounded-lg border border-[#E1DBD2] hover:border-[#B72E2A]/60 hover:bg-[#F8E3DE]/10 transition-all flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-[#B72E2A] uppercase">🧹 Apagar Tudo</span>
                <span className="text-[10px] text-[#5C5852]">Remove absolutamente todos os registros, preferências e histórico, reiniciando o sistema totalmente limpo.</span>
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowResetOptions(false)}
                className="text-xs text-[#5C5852] hover:text-[#22201D] font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
