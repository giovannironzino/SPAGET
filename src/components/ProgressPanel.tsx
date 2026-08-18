import React from 'react';
import { useSpaget } from '../context/SpagetContext';
import { Sparkles, Calendar, CheckSquare, RefreshCw } from 'lucide-react';

export const ProgressPanel: React.FC = () => {
  const { data, getDayCount, getCompletedItemsCount, isSaving } = useSpaget();
  const currentStage = data.currentStage;

  if (currentStage === 'concluido') return null;

  const day = getDayCount();
  const { completed, total } = getCompletedItemsCount(currentStage);

  // Format stage names gracefully
  const stageNames: Record<string, string> = {
    diagnostico: 'Diagnóstico de Situação',
    receita: 'Mapeamento de Nova Renda',
    orcamento: 'Ajuste de Orçamento',
    plano: 'Plano de Ação Prático',
  };

  return (
    <div className="bg-[#FAF7F1] border-b border-[#E1DBD2] py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Stage name and Day count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-[#C8442F] text-[#FAF7F1] font-bold text-xs px-2.5 py-1.5 rounded-md shrink-0">
              <Calendar className="w-4.5 h-4.5 mr-1" />
              Dia {day} de 21
            </div>
            <div>
              <p className="text-xs text-[#5C5852] font-semibold uppercase tracking-wider">Etapa Atual</p>
              <h2 className="text-base font-bold text-[#22201D]">{stageNames[currentStage] || currentStage}</h2>
            </div>
          </div>

          {/* Progress bar and indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#5C5852]" />
              <div className="text-sm text-[#22201D]">
                <span className="font-bold text-brand">{completed}</span> de <span className="font-semibold">{total}</span> concluídos
              </div>
            </div>

            {/* Disk/saving indicator */}
            <div className="flex items-center gap-1.5 text-xs text-[#5C5852] font-medium bg-[#FAF7F1] px-2 py-1 rounded border border-[#E1DBD2]">
              <RefreshCw className={`w-3.5 h-3.5 text-[#5C5852] ${isSaving ? 'animate-spin text-brand' : ''}`} />
              <span>{isSaving ? 'Salvando...' : 'Salvo automaticamente'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
