import React from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Plus, Trash2 } from 'lucide-react';
import { BRAZIL_STATES } from '../../data/brazilLocations';
import type { UserAnamnesisData } from '../../services/nutritionAiConsultantService';

interface AnamnesisFormProps {
  anamnesis: UserAnamnesisData;
  updateAnamnesis: (partial: Partial<UserAnamnesisData>) => void;
  anamnesisStep: 1 | 2 | 3;
  setAnamnesisStep: (step: 1 | 2 | 3) => void;
  blacklistedInput: string;
  setBlacklistedInput: (val: string) => void;
  onGeneratePlan: () => void;
}

export const AnamnesisForm: React.FC<AnamnesisFormProps> = ({
  anamnesis,
  updateAnamnesis,
  anamnesisStep,
  setAnamnesisStep,
  blacklistedInput,
  setBlacklistedInput,
  onGeneratePlan,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between max-w-3xl mx-auto w-full space-y-6 text-left">
      <div className="space-y-6">
        {/* INDICADOR DE PROGRESSO */}
        <div className="flex items-center justify-between border-b border-[#E1DBD2] pb-4">
          {[
            { stepNum: 1, title: '1. Você & Seu Corpo' },
            { stepNum: 2, title: '2. Região & Preferências' },
            { stepNum: 3, title: '3. Cozinha & Rotina' },
          ].map((s) => (
            <div
              key={s.stepNum}
              className={`flex items-center gap-2 text-xs font-bold ${
                anamnesisStep === s.stepNum
                  ? 'text-[#C8442F]'
                  : anamnesisStep > s.stepNum
                  ? 'text-[#4F7655]'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  anamnesisStep === s.stepNum
                    ? 'bg-[#C8442F] text-white'
                    : anamnesisStep > s.stepNum
                    ? 'bg-[#4F7655] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {anamnesisStep > s.stepNum ? '✓' : s.stepNum}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* PASSO 1: DADOS BIOMÉTRICOS */}
        {anamnesisStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-black text-[#22201D]">
                Vamos conhecer sua fisiologia e seus objetivos
              </h3>
              <p className="text-xs text-[#5C5852]">
                Calculamos sua taxa metabólica exata (Mifflin-St Jeor) para que você nunca passe fome.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Idade (anos):</label>
                <input
                  type="number"
                  value={anamnesis.age}
                  onChange={(e) => updateAnamnesis({ age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Sexo Biológico:</label>
                <select
                  value={anamnesis.sex}
                  onChange={(e) => updateAnamnesis({ sex: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Peso Atual (kg):</label>
                <input
                  type="number"
                  value={anamnesis.weightKg}
                  onChange={(e) => updateAnamnesis({ weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Altura (cm):</label>
                <input
                  type="number"
                  value={anamnesis.heightCm}
                  onChange={(e) => updateAnamnesis({ heightCm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Nível de Movimento no Dia a Dia:</label>
                <select
                  value={anamnesis.activityLevel}
                  onChange={(e) => updateAnamnesis({ activityLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                >
                  <option value="sedentary">Sedentário (Trabalho sentado, pouco movimento)</option>
                  <option value="light">Leve (Caminhadas ocasionais, tarefas do lar)</option>
                  <option value="moderate">Moderado (Treina 3 a 4x na semana / em pé)</option>
                  <option value="intense">Intenso (Treino pesado diário / trabalho braçal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Seu Objetivo de Saúde:</label>
                <select
                  value={anamnesis.healthGoal || (anamnesis.goal === 'budget_priority' ? 'maintain' : anamnesis.goal) || 'lose_weight'}
                  onChange={(e) => updateAnamnesis({ healthGoal: e.target.value as any, goal: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold text-[#C8442F]"
                >
                  <option value="lose_weight">Emagrecer com saúde e sem passar fome</option>
                  <option value="maintain">Manter peso, disposição e longevidade</option>
                  <option value="muscle_gain">Ganhar massa muscular e energia (Hipertrofia)</option>
                </select>
              </div>
            </div>

            {/* PRIORIDADE DE ECONOMIA DESACOPLADA */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs mt-2">
              <div className="space-y-0.5">
                <span className="font-black text-amber-950 block">💰 Priorizar Máxima Economia nas Compras</span>
                <span className="text-[11px] text-amber-800">
                  Prioriza alimentos da safra e compras em atacado, mantendo 100% da sua meta corporal.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anamnesis.prioritizeSavings}
                  onChange={(e) => updateAnamnesis({ prioritizeSavings: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F7655]"></div>
              </label>
            </div>
          </div>
        )}

        {/* PASSO 2: REGIONALIDADE & AVERSÕES */}
        {anamnesisStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-black text-[#22201D]">
                Sua Região, Família e o que você gosta de comer
              </h3>
              <p className="text-xs text-[#5C5852]">
                Conectamos sua lista com a safra dos Ceasas da sua região para baratear a feira.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Estado (UF):</label>
                <select
                  value={anamnesis.stateUf}
                  onChange={(e) => updateAnamnesis({ stateUf: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                >
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.name} ({st.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Cidade:</label>
                <input
                  type="text"
                  value={anamnesis.cityName}
                  onChange={(e) => updateAnamnesis({ cityName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Pessoas na Casa:</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={anamnesis.numberOfPeople}
                  onChange={(e) => updateAnamnesis({ numberOfPeople: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="font-bold text-[#22201D] block">Estilo Alimentar:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'omnivore', label: '🥩 Onívoro (Carnes, Ovos, Legumes)' },
                  { id: 'vegetarian', label: '🧀 Vegetariano (Com Ovos & Laticínios)' },
                  { id: 'vegan', label: '🌱 100% Vegano (Sem Animal)' },
                  { id: 'glutenFree', label: '🌾 Sem Glúten (Celíaco / Opção)' },
                  { id: 'lactoseFree', label: '🥛 Sem Lactose' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateAnamnesis({ dietaryStyle: st.id as any })}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      anamnesis.dietaryStyle === st.id
                        ? 'border-[#4F7655] bg-[#E6F0E6] text-[#4F7655] shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="font-bold text-[#22201D] block">
                Alimentos que você DETESTA (Nunca prescrever):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: quiabo, coentro, fígado, berinjela..."
                  value={blacklistedInput}
                  onChange={(e) => setBlacklistedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (blacklistedInput.trim()) {
                        updateAnamnesis({
                          blacklistedFoods: [...anamnesis.blacklistedFoods, blacklistedInput.trim()],
                        });
                        setBlacklistedInput('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (blacklistedInput.trim()) {
                      updateAnamnesis({
                        blacklistedFoods: [...anamnesis.blacklistedFoods, blacklistedInput.trim()],
                      });
                      setBlacklistedInput('');
                    }
                  }}
                  className="px-4 py-2 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {anamnesis.blacklistedFoods.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 font-bold text-[11px]"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateAnamnesis({
                          blacklistedFoods: anamnesis.blacklistedFoods.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-red-500 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* CONDIÇÕES CLÍNICAS DIAGNOSTICADAS */}
            <div className="space-y-2 pt-2 text-xs">
              <label className="font-bold text-[#22201D] block">
                Condições Clínicas de Saúde (Opcional - Ajusta restrições de sódio e açúcares):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'hipertensao', label: '🩺 Hipertensão (Controle de Sódio)' },
                  { id: 'diabetes_tipo2', label: '🩸 Diabetes Tipo 2 (Sem Açúcar)' },
                  { id: 'doenca_renal', label: '🫘 Saúde Renal (Nefroproteção)' },
                ].map((cond) => {
                  const isChecked = (anamnesis.clinicalConditions || []).includes(cond.id as any);
                  return (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => {
                        const current = anamnesis.clinicalConditions || [];
                        const next = isChecked ? current.filter((c) => c !== cond.id) : [...current, cond.id as any];
                        updateAnamnesis({ clinicalConditions: next });
                      }}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {cond.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: COZINHA & ROTINA */}
        {anamnesisStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-black text-[#22201D]">Sua Cozinha e seu Ritmo de Vida</h3>
              <p className="text-xs text-[#5C5852]">
                Para desenhar receitas que você consiga fazer em 15 minutos ou no domingo em 1h30.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Refeições por dia:</label>
                <select
                  value={anamnesis.mealsPerDay}
                  onChange={(e) => updateAnamnesis({ mealsPerDay: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                >
                  <option value={3}>3 refeições (Café, Almoço, Jantar)</option>
                  <option value={4}>4 refeições (Café, Almoço, Lanche, Jantar) - Padrão Ouro</option>
                  <option value={5}>5 refeições (+ Ceia leve)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#22201D] block">Leva marmita para o trabalho?</label>
                <select
                  value={anamnesis.bringsLunchToWork ? 'sim' : 'nao'}
                  onChange={(e) => updateAnamnesis({ bringsLunchToWork: e.target.value === 'sim' })}
                  className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-white font-bold"
                >
                  <option value="sim">Sim, levo marmita caseira (Economia máxima)</option>
                  <option value="nao">Não, almoço em casa ou self-service</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="font-bold text-[#22201D] block">
                Equipamentos que você tem na cozinha:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pressure_cooker', label: '🍲 Panela de Pressão' },
                  { id: 'airfryer', label: '🍟 Airfryer' },
                  { id: 'oven', label: '🔥 Forno a Gás / Elétrico' },
                  { id: 'freezer', label: '❄️ Congelador / Freezer' },
                ].map((eq) => {
                  const hasIt = anamnesis.kitchenEquipments.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      onClick={() => {
                        if (hasIt) {
                          updateAnamnesis({
                            kitchenEquipments: anamnesis.kitchenEquipments.filter((x) => x !== eq.id),
                          });
                        } else {
                          updateAnamnesis({
                            kitchenEquipments: [...anamnesis.kitchenEquipments, eq.id],
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        hasIt
                          ? 'border-[#4F7655] bg-[#E6F0E6] text-[#4F7655]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {eq.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTÕES DO FORMULÁRIO */}
      <div className="flex items-center justify-between border-t border-[#E1DBD2] pt-4">
        {anamnesisStep > 1 ? (
          <button
            type="button"
            onClick={() => setAnamnesisStep((anamnesisStep - 1) as any)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        ) : <div />}

        {anamnesisStep < 3 ? (
          <button
            type="button"
            onClick={() => setAnamnesisStep((anamnesisStep + 1) as any)}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            <span>Próximo Passo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onGeneratePlan}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#C8442F] hover:bg-[#9F3022] text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Meu Cardápio & Lista Inteligente</span>
          </button>
        )}
      </div>
    </div>
  );
};
