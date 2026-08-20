import React from 'react';
import { Flame } from 'lucide-react';
import type { BatchCookingGuideStep } from '../../services/nutritionAiConsultantService';

interface BatchCookingGuideViewProps {
  batchCookingGuide: BatchCookingGuideStep[];
}

export const BatchCookingGuideView: React.FC<BatchCookingGuideViewProps> = ({
  batchCookingGuide,
}) => {
  return (
    <div className="space-y-6 text-left">
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2">
        <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-700" />
          O Método de Cozinha em 1h30 (Capítulo 5 do Guia MS: Superando a Falta de Tempo)
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          Você não precisa cozinhar do zero 4 vezes por dia. Com apenas 1h30 no domingo, você prepara a base da semana inteira, economiza gás e tem comida caseira fresca em apenas 10 minutos de segunda a sexta!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {batchCookingGuide.map((step) => (
          <div
            key={step.stepNumber}
            className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F1] border border-[#E1DBD2] flex items-center justify-center font-black text-[#C8442F] text-xs">
                {step.stepNumber}
              </div>
              <h4 className="text-xs font-black text-[#22201D]">{step.title}</h4>
              <p className="text-[11px] text-[#5C5852] leading-relaxed">{step.description}</p>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800">
              {step.protocolBadge}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
