import React from 'react';
import { Leaf, Flame, Activity, Droplets } from 'lucide-react';
import { BRAZIL_STATES } from '../../data/brazilLocations';
import type { NutritionPrescriptionResult } from '../../services/nutritionAiConsultantService';

interface BiometricsSummaryCardProps {
  biometrics: NutritionPrescriptionResult['biometrics'];
  dietaryStyle: string;
  numberOfPeople: number;
  stateUf: string;
  onUpdateDietaryStyle: (style: any) => void;
  onUpdatePeople: (people: number) => void;
  onUpdateStateUf: (uf: string) => void;
}

export const BiometricsSummaryCard: React.FC<BiometricsSummaryCardProps> = ({
  biometrics,
  dietaryStyle,
  numberOfPeople,
  stateUf,
  onUpdateDietaryStyle,
  onUpdatePeople,
  onUpdateStateUf,
}) => {
  return (
    <div className="space-y-3">
      {/* BARRA DE CONFIGURAÇÃO RÁPIDA SUPERIOR */}
      <div className="bg-[#FAF7F1] border-b border-[#E1DBD2] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-gray-500">Estilo Ativo:</span>
          <select
            value={dietaryStyle}
            onChange={(e) => onUpdateDietaryStyle(e.target.value)}
            className="px-2.5 py-1 border border-[#E1DBD2] rounded-lg bg-white font-bold text-[#4F7655] cursor-pointer"
          >
            <option value="omnivore">🥩 Variado (Carnes, Ovos, Grãos)</option>
            <option value="vegetarian">🧀 Vegetariano (Ovos, Queijos, Legumes - Zero Carne)</option>
            <option value="vegan">🌱 100% Vegetal (Vegano)</option>
            <option value="glutenFree">🌾 Sem Glúten</option>
            <option value="lactoseFree">🥛 Sem Lactose</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-[#5C5852]">
            <span>Pessoas:</span>
            <select
              value={numberOfPeople}
              onChange={(e) => onUpdatePeople(Number(e.target.value))}
              className="px-2 py-1 border border-[#E1DBD2] rounded-lg bg-white font-bold text-[#22201D]"
            >
              <option value={1}>1 pessoa</option>
              <option value={2}>2 pessoas</option>
              <option value={3}>3 pessoas</option>
              <option value={4}>4 pessoas</option>
              <option value={5}>5+ pessoas</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#5C5852]">
            <span>Estado:</span>
            <select
              value={stateUf}
              onChange={(e) => onUpdateStateUf(e.target.value)}
              className="px-2 py-1 border border-[#E1DBD2] rounded-lg bg-white font-bold text-[#22201D]"
            >
              {BRAZIL_STATES.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* METAS BIOMÉTRICAS (BANNER) */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-black text-emerald-900 block">
              Cardápio {dietaryStyle === 'vegetarian' ? 'Vegetariano (Zero Carne)' : dietaryStyle === 'vegan' ? 'Vegano' : 'Personalizado'}: Escolha sua opção favorita
            </span>
            <span className="text-[11px] text-emerald-800">
              Você pode escolher a Opção A, B ou C, ou clicar em <strong>[ 🔄 Trocar ]</strong> ao lado de qualquer ingrediente!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[10px] font-bold text-gray-500 block uppercase">Proteínas</span>
            <span className="text-xs font-black text-emerald-950">{biometrics.targetProteinGrams}g/dia</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 block uppercase">Carboidratos</span>
            <span className="text-xs font-black text-emerald-950">{biometrics.targetCarbsGrams}g/dia</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 block uppercase">Água</span>
            <span className="text-xs font-black text-blue-900">
              {biometrics.targetWaterMl}ml <span className="text-[10px] font-normal text-blue-700">({Math.round(biometrics.targetWaterMl / 250)} copos)</span>
            </span>
          </div>
          <div className="border-l border-emerald-300 pl-3">
            <span className="text-[10px] font-bold text-gray-500 block uppercase">Meta Diária</span>
            <span className="text-sm font-black text-[#4F7655]">{biometrics.targetKcal} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
