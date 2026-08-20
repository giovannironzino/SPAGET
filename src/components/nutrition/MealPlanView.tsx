import React from 'react';
import { Clock, Repeat } from 'lucide-react';
import type { PlannedMealGroup } from '../../services/nutritionAiConsultantService';
import type { ClinicalFoodItem } from '../../services/clinicalNutritionEngine';

interface MealPlanViewProps {
  meals: PlannedMealGroup[];
  onSelectMealOption: (mealSlotId: string, optionIndex: number) => void;
  customSwappedIngredients: Record<string, Record<number, string>>;
  onOpenSwapModal: (mealSlotId: string, ingredientIndex: number, food: ClinicalFoodItem | null) => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({
  meals,
  onSelectMealOption,
  customSwappedIngredients,
  onOpenSwapModal,
}) => {
  return (
    <div className="space-y-6 text-left">
      {meals.map((meal) => {
        const selectedOpt = meal.options[meal.selectedOptionIndex] || meal.options[0];

        return (
          <div key={meal.mealSlotId} className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-[#22201D] flex items-center gap-2">
                {meal.mealSlotName}
              </h3>

              {/* SELETOR DE OPÇÕES A / B / C */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Opções:</span>
                {meal.options.map((opt, idx) => (
                  <button
                    key={opt.optionId}
                    onClick={() => onSelectMealOption(meal.mealSlotId, idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      meal.selectedOptionIndex === idx
                        ? 'bg-[#4F7655] text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Opção {String.fromCharCode(65 + idx)}
                  </button>
                ))}
              </div>
            </div>

            {/* DETALHE DO PRATO ESCOLHIDO */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-[#22201D]">{selectedOpt.title}</h4>
                  <p className="text-xs text-[#5C5852] mt-0.5">{selectedOpt.description}</p>
                </div>

                <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1 shrink-0 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {selectedOpt.prepTimeMinutes} min
                </span>
              </div>

              {/* PORÇÕES EM MEDIDAS CASEIRAS COM BOTÃO [ 🔄 TROCAR ] POR INGREDIENTE */}
              <div className="p-3.5 bg-[#FAF7F1] rounded-xl border border-[#E1DBD2]/60 space-y-2">
                <span className="text-[10px] font-black text-[#5C5852] uppercase tracking-wider block">
                  Ingredientes & Medidas Caseiras (Clique em Trocar para alterar qualquer item):
                </span>
                <ul className="text-xs text-gray-800 space-y-2">
                  {selectedOpt.householdPortions.map((portion, pIdx) => {
                    const customized = customSwappedIngredients[meal.mealSlotId]?.[pIdx];
                    const displayPortion = customized || portion;

                    return (
                      <li key={pIdx} className="flex items-center justify-between gap-2 bg-white/70 p-2 rounded-lg border border-gray-200/60">
                        <span className="leading-snug">{displayPortion}</span>
                        <button
                          onClick={() => {
                            onOpenSwapModal(
                              meal.mealSlotId,
                              pIdx,
                              selectedOpt.sourcedFoods?.[pIdx]?.food || null
                            );
                          }}
                          className="text-[10px] font-bold text-[#4F7655] hover:text-[#3d5d42] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Repeat className="w-3 h-3" />
                          <span>Trocar</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {meal.biochemicalNote && (
                <p className="text-[11px] text-[#4F7655] italic bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  💡 <strong>Dica Bioquímica do Nutricionista:</strong> {meal.biochemicalNote}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
