import React, { useState } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { Skill } from '../types';
import { Plus, Trash, AlertCircle, Check, ArrowRight, Lightbulb, Cpu } from 'lucide-react';

export const ReceitaStage: React.FC = () => {
  const { data, updateData } = useSpaget();
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<Array<{ habilidade: string; comoGeraRenda: string; quantoCobrar: string; quantoPoderiaGerar: number; comoConseguirClientes: string }> | null>(null);

  const generateSidehustlesWithAI = async () => {
    setIsGeneratingIdeas(true);
    try {
      const response = await fetch('/api/gemini/generate-sidehustles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: data.skills.map(s => s.habilidade),
          deficit: buraco
        })
      });
      if (!response.ok) throw new Error('Erro ao gerar sugestões');
      const list = await response.json();
      setSuggestedIdeas(list);
    } catch (err) {
      console.error(err);
      alert('Desculpe, ocorreu um erro ao se conectar ao gerador de ideias com Inteligência Artificial.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const acceptSuggestedIdea = (idea: { habilidade: string; comoGeraRenda: string; quantoCobrar: string; quantoPoderiaGerar: number; comoConseguirClientes: string }) => {
    const currentlySelected = data.skills.filter(s => s.selecionada).length;
    if (currentlySelected >= 3) {
      setWarningMessage('Você pode selecionar no máximo 3 habilidades para testar primeiro neste ciclo.');
      setSuggestedIdeas(null);
      return;
    }

    const newSkill: Skill = {
      id: `skill-ai-${Date.now()}`,
      habilidade: `${idea.habilidade} (${idea.quantoCobrar})`,
      jaRecebeu: false,
      quemPagaria: idea.comoConseguirClientes.slice(0, 100),
      quantoPoderiaGerar: idea.quantoPoderiaGerar,
      velocidade: 'rapido',
      selecionada: true,
      primeiroPasso: idea.comoGeraRenda.slice(0, 150),
    };

    updateData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));

    setSuggestedIdeas(null);
    setWarningMessage(null);
  };

  // Math from Stage 1 (9 Categorias Ativas)
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
  const buraco = totalExpenses - (Number(data.currentRevenue) || 0);

  // Selected skills math
  const selectedSkills = data.skills.filter(s => s.selecionada);
  const totalPlannedRevenue = selectedSkills.reduce((sum, s) => sum + (Number(s.quantoPoderiaGerar) || 0), 0);
  
  // % coverage calculation
  const coveragePercentage = buraco > 0 
    ? Math.min(100, Math.round((totalPlannedRevenue / buraco) * 100))
    : 100;

  // Add Skill helper
  const addSkill = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      habilidade: '',
      jaRecebeu: false,
      quemPagaria: '',
      quantoPoderiaGerar: 0,
      velocidade: 'rapido',
      selecionada: false,
      primeiroPasso: '',
    };
    updateData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));
    setWarningMessage(null);
  };

  const removeSkill = (id: string) => {
    updateData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
    setWarningMessage(null);
  };

  const updateSkill = (id: string, fields: Partial<Skill>) => {
    updateData((prev) => {
      // Check for selecting more than 3
      if (fields.selecionada === true) {
        const currentlySelected = prev.skills.filter(s => s.selecionada).length;
        if (currentlySelected >= 3) {
          setWarningMessage('Você pode selecionar no máximo 3 habilidades para testar primeiro neste ciclo.');
          return prev; // don't update
        }
      }
      setWarningMessage(null);
      return {
        ...prev,
        skills: prev.skills.map((s) => (s.id === id ? { ...s, ...fields } : s)),
      };
    });
  };

  // Close Stage 2
  const handleCloseStage = () => {
    if (!data.stage2Confirmed) return;
    updateData((prev) => {
      const completed = prev.completedStages.includes('receita')
        ? prev.completedStages
        : [...prev.completedStages, 'receita'];
      return {
        ...prev,
        completedStages: completed,
        currentStage: 'orcamento',
      };
    });
  };

  const ResultadoDominante: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
    return (
      <div className={`bg-[#FAF7F1] border-2 border-[#E1DBD2] p-6 rounded-xl relative overflow-hidden ${isMobile ? 'block lg:hidden mb-6' : 'hidden lg:block'}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#5C5852] mb-1">Resultado Dominante</p>
        
        <div className="space-y-3">
          {buraco > 0 ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#F8E3DE] text-[#C8442F]">
                <Lightbulb className="w-4 h-4" /> COBERTURA DO BURACO MENSAL
              </span>
              <div className="text-5xl font-black text-brand tabular-nums">
                {coveragePercentage}%
              </div>
              <p className="text-xs text-[#5C5852] leading-relaxed">
                As fontes de renda selecionadas cobrem aproximadamente <strong>{coveragePercentage}%</strong> do seu buraco mensal de <strong>R$ {buraco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#E6F0E6] text-[#4F7655]">
                <Check className="w-4 h-4" /> SALDO JÁ POSITIVO
              </span>
              <div className="text-5xl font-black text-success tabular-nums">
                100%+
              </div>
              <p className="text-xs text-[#5C5852] leading-relaxed">
                Você não possui buraco mensal atualmente. Suas fontes extras servirão como sobra e segurança direta.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E1DBD2] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#5C5852]">Buraco a Cobrir:</span>
            <span className="font-semibold text-[#22201D] tabular-nums">R$ {Math.max(0, buraco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C5852]">Renda Extra Estimada:</span>
            <span className="font-semibold text-[#4F7655] tabular-nums">+ R$ {totalPlannedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
              2. Aumentar minha renda
            </h1>
            <p className="text-sm text-[#5C5852] mt-1 leading-relaxed">
              Mapeie habilidades reais para gerar dinheiro rápido. Sem julgamentos ou filtros nesta etapa.
            </p>
          </div>

          {/* SECTION A: LISTA DE HABILIDADES */}
          <div className="bg-white shadow-sm border-l-4 border-l-[#C8442F] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#22201D]">
                  O que eu sei fazer?
                </h3>
                <p className="text-xs text-[#5C5852] mt-0.5">
                  Lista de potenciais fontes de renda baseadas em habilidades existentes.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateSidehustlesWithAI}
                  disabled={isGeneratingIdeas}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border focus-ring transition-all cursor-pointer ${
                    isGeneratingIdeas
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E6F0E6] border-[#4F7655]/30 text-[#4F7655] hover:bg-[#d0ebd0]'
                  }`}
                >
                  <Cpu className={`w-3.5 h-3.5 ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingIdeas ? 'Sugerindo...' : 'Ideias com IA'}</span>
                </button>
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex items-center gap-1 bg-[#FAF7F1] hover:bg-[#F8E3DE] text-[#C8442F] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#C8442F] transition-colors focus-ring cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar habilidade
                </button>
              </div>
            </div>

            {warningMessage && (
              <div className="bg-[#F8E3DE] border border-[#C8442F] text-[#B72E2A] text-xs font-medium p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{warningMessage}</span>
              </div>
            )}

            {suggestedIdeas && (
              <div className="p-4 border-2 border-[#4F7655] bg-[#E6F0E6]/10 rounded-xl space-y-4 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-[#4F7655]/10 pb-2">
                  <h4 className="text-xs font-bold text-[#4F7655] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Sugestões de Renda Extra Recomendadas
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSuggestedIdeas(null)}
                    className="text-xs text-[#5C5852] hover:text-[#B72E2A] font-bold uppercase cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestedIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-white border border-[#E1DBD2] p-3.5 rounded-lg space-y-3 shadow-sm flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold uppercase bg-[#E6F0E6] text-[#4F7655] px-2 py-0.5 rounded-md">
                          Opção #{idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-[#22201D] tracking-tight">{idea.habilidade}</h5>
                        <p className="text-[10px] text-[#5C5852] leading-relaxed"><strong className="text-[#C8442F]">Como fazer:</strong> {idea.comoGeraRenda}</p>
                        <p className="text-[10px] text-[#5C5852] leading-relaxed"><strong className="text-[#C8442F]">Atração:</strong> {idea.comoConseguirClientes}</p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-[#22201D] font-bold">
                          <span>Cobrar: {idea.quantoCobrar}</span>
                          <span className="text-[#4F7655]">Est: R$ {idea.quantoPoderiaGerar}/mês</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => acceptSuggestedIdea(idea)}
                        className="w-full mt-3 px-3 py-1.5 bg-[#4F7655] hover:bg-[#3d5d42] text-white text-xs font-bold rounded-md shadow-sm transition-colors cursor-pointer text-center"
                      >
                        Aceitar e Integrar Plano
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.skills.length === 0 ? (
              <p className="text-xs text-[#5C5852] italic py-4 text-center border border-dashed border-[#E1DBD2] rounded-lg">
                Nenhuma habilidade listada ainda. Clique acima para começar a mapear o que você sabe fazer.
              </p>
            ) : (
              <div className="space-y-4">
                {data.skills.map((skill) => {
                  const skillPercent = buraco > 0 
                    ? Math.round((Number(skill.quantoPoderiaGerar || 0) / buraco) * 100)
                    : 100;

                  return (
                    <div
                      key={skill.id}
                      className={`border border-l-4 p-4 rounded-lg space-y-3 relative transition-all ${
                        skill.selecionada
                          ? 'border-[#4F7655] border-l-4 bg-[#E6F0E6]/10'
                          : 'border-gray-200 border-l-4 bg-white opacity-85 hover:opacity-100 shadow-sm'
                      }`}
                    >
                      
                      {/* Close/Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.id)}
                        className="absolute top-2 right-2 p-1.5 text-[#B72E2A] hover:bg-[#F8E3DE] rounded transition-colors focus-ring"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pr-8">
                        {/* Habilidade */}
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-[#5C5852] uppercase mb-1">O que você sabe fazer?</label>
                          <input
                            type="text"
                            placeholder="Ex: Fazer bolos, Consultoria financeira, Digitação..."
                            value={skill.habilidade}
                            onChange={(e) => updateSkill(skill.id, { habilidade: e.target.value })}
                            className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2.5 py-1.5 text-xs focus-ring text-[#22201D] font-medium"
                          />
                        </div>

                        {/* Já recebeu? */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-[#5C5852] uppercase mb-1">Já recebeu por isso?</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateSkill(skill.id, { jaRecebeu: true })}
                              className={`flex-1 text-xs py-1 rounded font-medium border transition-colors ${
                                skill.jaRecebeu
                                  ? 'bg-[#C8442F] border-[#C8442F] text-[#FAF7F1]'
                                  : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#22201D] hover:bg-[#F8E3DE]/30'
                              }`}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSkill(skill.id, { jaRecebeu: false })}
                              className={`flex-1 text-xs py-1 rounded font-medium border transition-colors ${
                                !skill.jaRecebeu
                                  ? 'bg-[#C8442F] border-[#C8442F] text-[#FAF7F1]'
                                  : 'bg-[#FAF7F1] border-[#E1DBD2] text-[#22201D] hover:bg-[#F8E3DE]/30'
                              }`}
                            >
                              Não
                            </button>
                          </div>
                        </div>

                        {/* Velocidade */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-[#5C5852] uppercase mb-1">Velocidade de Retorno</label>
                          <select
                            value={skill.velocidade}
                            onChange={(e) => updateSkill(skill.id, { velocidade: e.target.value as Skill['velocidade'] })}
                            className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2 py-1.5 text-xs focus-ring text-[#22201D] font-medium"
                          >
                            <option value="rapido">Rápido (dias)</option>
                            <option value="medio">Médio (semanas)</option>
                            <option value="lento">Lento (meses)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Quem pagaria */}
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-[#5C5852] uppercase mb-1">Quem pagaria por isso hoje?</label>
                          <input
                            type="text"
                            placeholder="Ex: Vizinhos, amigos, empresas locais..."
                            value={skill.quemPagaria}
                            onChange={(e) => updateSkill(skill.id, { quemPagaria: e.target.value })}
                            className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2.5 py-1.5 text-xs focus-ring text-[#22201D]"
                          />
                        </div>

                        {/* Quanto gerar */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-[#5C5852] uppercase mb-1">Geração mensal estimada</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[10px] font-semibold text-[#5C5852]">R$</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0,00"
                              value={skill.quantoPoderiaGerar || ''}
                              onChange={(e) => updateSkill(skill.id, { quantoPoderiaGerar: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded pl-7 pr-1.5 py-1.5 text-xs focus-ring text-[#22201D] font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* Auto-coverage feedback */}
                        <div className="md:col-span-3 flex items-center pt-4 md:pt-0">
                          {buraco > 0 ? (
                            <div className="text-xs bg-[#F8E3DE] text-[#C8442F] font-bold px-2.5 py-2 rounded-lg border border-[#F8E3DE] w-full text-center">
                              Cobre aprox. {skillPercent}% do buraco
                            </div>
                          ) : (
                            <div className="text-xs bg-[#E6F0E6] text-[#4F7655] font-bold px-2.5 py-2 rounded-lg border border-[#E6F0E6] w-full text-center">
                              100% de sobra pura
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Select to Test Checkbox */}
                      <div className="pt-3 border-t border-dashed border-[#E1DBD2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={skill.selecionada || false}
                            onChange={(e) => updateSkill(skill.id, { selecionada: e.target.checked })}
                            className="w-4 h-4 text-brand bg-[#FAF7F1] border-[#E1DBD2] rounded focus:ring-brand accent-[#C8442F]"
                          />
                          <span className="text-xs font-bold text-[#22201D]">
                            Selecionar esta habilidade para testar primeiro (Escolha até 3)
                          </span>
                        </label>
                      </div>

                      {/* Concrete first step */}
                      {skill.selecionada && (
                        <div className="mt-3 p-3 bg-[#FAF7F1] border border-[#C8442F]/30 rounded-lg space-y-1.5">
                          <label className="block text-xs font-bold text-[#C8442F] uppercase">Primeiro passo concreto para executar</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Mandar mensagem oferecendo para 5 pessoas, criar post no Instagram..."
                            value={skill.primeiroPasso || ''}
                            onChange={(e) => updateSkill(skill.id, { primeiroPasso: e.target.value })}
                            className="w-full bg-[#FAF7F1] border border-[#E1DBD2] rounded px-2.5 py-1.5 text-xs focus-ring text-[#22201D] font-medium"
                          />
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: FECHAMENTO */}
          <div className="bg-white shadow-sm border-l-4 border-l-[#4F7655] p-5 rounded-lg space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.stage2Confirmed}
                onChange={(e) => updateData((prev) => ({ ...prev, stage2Confirmed: e.target.checked }))}
                className="w-4 h-4 text-brand bg-[#FAF7F1] border-[#E1DBD2] rounded focus:ring-brand mt-0.5 accent-[#C8442F]"
              />
              <span className="text-xs text-[#22201D] font-semibold leading-relaxed">
                Conferi minhas possibilidades reais de renda e escolhi as melhores para iniciar.
              </span>
            </label>

            <div>
              <button
                type="button"
                disabled={!data.stage2Confirmed}
                onClick={handleCloseStage}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-lg focus-ring transition-colors select-none ${
                  data.stage2Confirmed
                    ? 'bg-[#C8442F] hover:bg-[#9F3022] text-[#FAF7F1]'
                    : 'bg-[#FAF7F1] border border-[#E1DBD2] text-[#5C5852] cursor-not-allowed'
                }`}
              >
                <span>Fechar minhas fontes de renda e seguir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {!data.stage2Confirmed && (
                <p className="text-[10px] text-[#B72E2A] mt-1.5 font-medium">
                  Conclua todos os itens desta etapa (marcando a confirmação) para continuar.
                </p>
              )}
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
