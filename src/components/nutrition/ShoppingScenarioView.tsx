import React from 'react';
import type { ShoppingScenario } from '../../services/nutritionAiConsultantService';

interface ShoppingScenarioViewProps {
  shoppingScenarios: Record<'pe_no_chao' | 'equilibrado' | 'pratico', ShoppingScenario>;
  activeShoppingScenario: 'pe_no_chao' | 'equilibrado' | 'pratico';
  onSelectScenario: (scen: 'pe_no_chao' | 'equilibrado' | 'pratico') => void;
  ownedPantryItems: Record<string, boolean>;
  onTogglePantryItem: (name: string, value: boolean) => void;
  savingsFromPantry: number;
  finalCostAfterPantry: number;
  swapDeltaTotal: number;
  stateUf: string;
  dietaryStyle: string;
}

export const ShoppingScenarioView: React.FC<ShoppingScenarioViewProps> = ({
  shoppingScenarios,
  activeShoppingScenario,
  onSelectScenario,
  ownedPantryItems,
  onTogglePantryItem,
  savingsFromPantry,
  finalCostAfterPantry,
  swapDeltaTotal,
  stateUf,
  dietaryStyle,
}) => {
  const currentScenario = shoppingScenarios[activeShoppingScenario];

  return (
    <div className="space-y-6 text-left">
      {/* SELETOR DOS 3 CENÁRIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'pe_no_chao', title: '1. Pé no Chão (Feira Livre)', desc: 'Máxima economia com ovos e safra', cost: shoppingScenarios.pe_no_chao.totalFamilyCost },
          { id: 'equilibrado', title: '2. Equilibrado (Padrão)', desc: 'Variedade saudável de alimentos', cost: shoppingScenarios.equilibrado.totalFamilyCost },
          { id: 'pratico', title: '3. Prático & Nobre', desc: 'Ingredientes nobres e praticidade', cost: shoppingScenarios.pratico.totalFamilyCost },
        ].map((scen) => (
          <button
            key={scen.id}
            onClick={() => onSelectScenario(scen.id as any)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
              activeShoppingScenario === scen.id
                ? 'border-[#4F7655] bg-[#E6F0E6]/50 shadow-sm'
                : 'border-[#E1DBD2] bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#22201D]">{scen.title}</span>
              <span className="text-xs font-black text-[#4F7655]">R$ {scen.cost}</span>
            </div>
            <p className="text-[11px] text-[#5C5852]">{scen.desc}</p>
          </button>
        ))}
      </div>

      {/* BANNER DE IMPACTO FINANCEIRO DAS SUBSTITUIÇÕES NO PRATO */}
      {swapDeltaTotal !== 0 && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border ${swapDeltaTotal < 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <span>
            {swapDeltaTotal < 0 ? '📉 Economia gerada pelas trocas no prato:' : '📈 Acréscimo gerado pelas trocas no prato:'} R$ {Math.abs(swapDeltaTotal).toFixed(2)}/mês
          </span>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/70">Calculado via Guia MS</span>
        </div>
      )}

      {/* BANNER DE ECONOMIA DA DESPENSA */}
      {savingsFromPantry > 0 && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>🎉 Você já tem R$ {savingsFromPantry.toFixed(2)} em alimentos na despensa!</span>
          <span className="text-emerald-700">Novo Total a Comprar: R$ {finalCostAfterPantry.toFixed(2)}</span>
        </div>
      )}

      {/* DETALHE DO CENÁRIO SELECIONADO */}
      <div className="bg-white border border-[#E1DBD2] p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h4 className="text-sm font-black text-[#22201D]">{currentScenario.scenarioTitle}</h4>
            <p className="text-xs text-[#5C5852]">
              Marque os itens que você <strong>já tem na despensa</strong> para recalcular o custo real:
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Custo Final Estimado</span>
            <span className="text-lg font-black text-[#4F7655]">R$ {finalCostAfterPantry.toFixed(2)}/mês</span>
          </div>
        </div>

        {/* CORREDORES DE COMPRA COM CHECKBOXES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* FEIRA & HORTIFRÚTI */}
          <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-3">
            <h5 className="font-black text-[#22201D] flex items-center justify-between border-b pb-2">
              <span>🥦 Feira Livre & Hortifrúti</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Safra de {stateUf}</span>
            </h5>
            <ul className="space-y-2">
              {currentScenario.aisles.feiraHortifruti.map((item, idx) => {
                const isOwned = !!ownedPantryItems[item.name];
                return (
                  <li key={idx} className={`flex items-center justify-between ${isOwned ? 'opacity-40 line-through' : ''}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwned}
                        onChange={(e) => onTogglePantryItem(item.name, e.target.checked)}
                        className="accent-[#4F7655]"
                      />
                      <span>• {item.name} ({item.umcQuantity})</span>
                    </label>
                    <span className="font-bold">R$ {item.estimatedPrice.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* PROTEÍNAS / OVOS */}
          <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-3">
            <h5 className="font-black text-[#22201D] flex items-center justify-between border-b pb-2">
              <span>{dietaryStyle === 'vegetarian' ? '🧀 Ovos Caipiras & Queijos' : dietaryStyle === 'vegan' ? '🌱 Leguminosas & Tofu' : '🥩 Açougue & Ovos'}</span>
              <span className="text-[10px] text-gray-500 font-bold">Proteínas In Natura</span>
            </h5>
            <ul className="space-y-2">
              {currentScenario.aisles.acougueOvos.map((item, idx) => {
                const isOwned = !!ownedPantryItems[item.name];
                return (
                  <li key={idx} className={`flex items-center justify-between ${isOwned ? 'opacity-40 line-through' : ''}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwned}
                        onChange={(e) => onTogglePantryItem(item.name, e.target.checked)}
                        className="accent-[#4F7655]"
                      />
                      <span>• {item.name} ({item.umcQuantity})</span>
                    </label>
                    <span className="font-bold">R$ {item.estimatedPrice.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* GRÃOS & CEREAIS */}
          <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-3">
            <h5 className="font-black text-[#22201D] flex items-center justify-between border-b pb-2">
              <span>🌾 Grãos & Cereais</span>
              <span className="text-[10px] text-gray-500 font-bold">Base Brasileira</span>
            </h5>
            <ul className="space-y-2">
              {currentScenario.aisles.graosCereais.map((item, idx) => {
                const isOwned = !!ownedPantryItems[item.name];
                return (
                  <li key={idx} className={`flex items-center justify-between ${isOwned ? 'opacity-40 line-through' : ''}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwned}
                        onChange={(e) => onTogglePantryItem(item.name, e.target.checked)}
                        className="accent-[#4F7655]"
                      />
                      <span>• {item.name} ({item.umcQuantity})</span>
                    </label>
                    <span className="font-bold">R$ {item.estimatedPrice.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* MERCEARIA & TEMPEROS */}
          <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-3">
            <h5 className="font-black text-[#22201D] flex items-center justify-between border-b pb-2">
              <span>🧂 Temperos & Mercearia</span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Ingredientes Culinários</span>
            </h5>
            <ul className="space-y-2">
              {currentScenario.aisles.merceariaTemperos.map((item, idx) => {
                const isOwned = !!ownedPantryItems[item.name];
                return (
                  <li key={idx} className={`flex items-center justify-between ${isOwned ? 'opacity-40 line-through' : ''}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOwned}
                        onChange={(e) => onTogglePantryItem(item.name, e.target.checked)}
                        className="accent-[#4F7655]"
                      />
                      <span>• {item.name} ({item.umcQuantity})</span>
                    </label>
                    <span className="font-bold">R$ {item.estimatedPrice.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
