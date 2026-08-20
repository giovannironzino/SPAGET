import { SpagetData, CategoryKey, CategorizedExpenseItem } from '../types';
import { systemConfig } from './systemConfigService';

export interface CalibrationAlert {
  id: string;
  categoryKey: CategoryKey;
  itemId?: string;
  type: 'under' | 'over' | 'tip';
  severity: 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export interface BudgetScenario {
  key: 'minimo' | 'ideal' | 'livre';
  name: string;
  description: string;
  badge: string;
  colorClass: string;
  totalExpenses: number;
  totalRevenue: number;
  surplusOrDeficit: number;
  isDeficit: boolean;
  plannedExpenses: Record<string, number>;
}

/**
 * Dynamic Calibration Engine connected to Management Center
 */
export function analyzeCalibration(data: SpagetData): CalibrationAlert[] {
  const alerts: CalibrationAlert[] = [];
  const currentRevenue = Number(data.currentRevenue) || 0;
  const categories = data.categorizedExpenses || {};
  const rules = systemConfig.getData().calibrationRules;

  // Flatten active items
  const activeItems: CategorizedExpenseItem[] = [];
  Object.values(categories).forEach((items) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item.temDespesa) {
          activeItems.push(item);
        }
      });
    }
  });

  const totalActiveExpenseVal = activeItems.reduce((sum, i) => sum + (Number(i.valorDeclarado) || 0), 0);

  // 1. Food Heuristics (Dynamic Floor)
  const foodItems = categories['alimentacao'] || [];
  const activeFoodItems = foodItems.filter((i) => i.temDespesa);
  const totalFoodVal = activeFoodItems.reduce((sum, i) => sum + (Number(i.valorDeclarado) || 0), 0);
  const foodFloor = rules.foodUnderestimationFloor || 300;

  if (activeFoodItems.length > 0 && totalFoodVal < foodFloor) {
    alerts.push({
      id: 'alert-food-under',
      categoryKey: 'alimentacao',
      type: 'under',
      severity: 'warning',
      title: '⚠️ Alerta de Subestimação (Alimentação)',
      message: `R$ ${totalFoodVal.toFixed(2)}/mês com alimentação costuma ser insuficiente para cobrir feira, mercado e proteínas básicas (referência mínima: R$ ${foodFloor.toFixed(2)}). Verifique se você não omitiu compras cotidianas.`,
    });
  }

  // Delivery Threshold
  const deliveryItem = foodItems.find((i) => i.id === 'alim-delivery');
  const deliveryThreshold = rules.deliveryMaxPercentageOfIncome || 12;
  if (deliveryItem && deliveryItem.temDespesa && currentRevenue > 0) {
    const deliveryVal = Number(deliveryItem.valorDeclarado) || 0;
    const deliveryPercentage = (deliveryVal / currentRevenue) * 100;
    if (deliveryPercentage >= deliveryThreshold) {
      alerts.push({
        id: 'alert-delivery-over',
        categoryKey: 'alimentacao',
        itemId: 'alim-delivery',
        type: 'over',
        severity: 'info',
        title: '💡 Alerta de Superestimação (Delivery)',
        message: `Seus gastos com delivery (R$ ${deliveryVal.toFixed(2)}) representam ${deliveryPercentage.toFixed(1)}% da sua renda (limite sugerido: ${deliveryThreshold}%). Este é o principal ponto para alavancar sua folga financeira imediata.`,
      });
    }
  }

  // 2. Transport Heuristics
  const transportItems = categories['transporte'] || [];
  const vehicleFinancing = transportItems.find((i) => i.id === 'transp-financiamento' && i.temDespesa);
  const vehicleMaintenance = transportItems.find((i) => i.id === 'transp-manutencao' && i.temDespesa);
  if (vehicleFinancing && (!vehicleMaintenance || vehicleMaintenance.valorDeclarado === 0)) {
    alerts.push({
      id: 'alert-transp-under',
      categoryKey: 'transporte',
      type: 'under',
      severity: 'warning',
      title: '⚠️ Alerta de Subestimação (Manutenção Veicular)',
      message: 'Você possui custos com veículo próprio, mas reservou R$ 0 para manutenção e trocas de óleo. Lembre-se de reservar ao menos R$ 80/mês para imprevistos mecânicos.',
    });
  }

  // 3. Health & Pharmacy Heuristics
  const healthItems = categories['saude'] || [];
  const activeHealthItems = healthItems.filter((i) => i.temDespesa);
  const healthReserve = rules.healthReserveSuggested || 50;
  if (activeHealthItems.length === 0) {
    alerts.push({
      id: 'alert-health-missing',
      categoryKey: 'saude',
      type: 'under',
      severity: 'info',
      title: '💡 Lembrete de Proteção (Farmácia e Saúde)',
      message: `Você não marcou nenhuma despesa em Saúde. É recomendável manter uma reserva mínima de R$ ${healthReserve.toFixed(2)}/mês para farmácia e remédios imprevistos.`,
    });
  }

  // 4. Subscriptions Heuristics
  const subItems = categories['assinaturas'] || [];
  const activeStreamings = subItems.filter((i) => i.temDespesa && i.id.startsWith('sub-') && !['sub-internet', 'sub-celular'].includes(i.id));
  const maxStreaming = rules.streamingMaxCount || 4;
  if (activeStreamings.length >= maxStreaming) {
    const totalStreamingVal = activeStreamings.reduce((sum, i) => sum + (Number(i.valorDeclarado) || 0), 0);
    alerts.push({
      id: 'alert-streaming-over',
      categoryKey: 'assinaturas',
      type: 'over',
      severity: 'info',
      title: '💡 Dica de Otimização (Streamings Acumulados)',
      message: `Você tem ${activeStreamings.length} serviços de streaming e IA ativos somando R$ ${totalStreamingVal.toFixed(2)}/mês (limite sugerido: até ${maxStreaming}). Alternar entre eles mês a mês economizaria mais de R$ ${(totalStreamingVal * 6).toFixed(2)} por ano.`,
    });
  }

  // 5. Macro Deficit
  if (currentRevenue > 0 && totalActiveExpenseVal > currentRevenue) {
    const deficit = totalActiveExpenseVal - currentRevenue;
    alerts.push({
      id: 'alert-macro-deficit',
      categoryKey: 'financeiro',
      type: 'under',
      severity: 'warning',
      title: '🚨 Alerta de Buraco Mensal de Caixa',
      message: `Suas contas ativas ultrapassam a sua renda declarada em R$ ${deficit.toFixed(2)}/mês. Vamos usar a Etapa 2 (Renda Extra) e a Etapa 3 (Cenários) para reequilibrar essa conta.`,
    });
  }

  return alerts;
}

/**
 * 3 Scenarios Generator connected to Management Rules
 */
export function calculateScenarios(data: SpagetData): Record<'minimo' | 'ideal' | 'livre', BudgetScenario> {
  const currentRevenue = Number(data.currentRevenue) || 0;
  const selectedSkills = (data.skills || []).filter((s) => s.selecionada);
  const extraRevenue = selectedSkills.reduce((sum, s) => sum + (Number(s.quantoPoderiaGerar) || 0), 0);
  const totalRevenue = currentRevenue + extraRevenue;

  const categories = data.categorizedExpenses || {};
  const activeItems: CategorizedExpenseItem[] = [];
  Object.values(categories).forEach((items) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item.temDespesa) {
          activeItems.push(item);
        }
      });
    }
  });

  const plannedLivre: Record<string, number> = {};
  const plannedIdeal: Record<string, number> = {};
  const plannedMinimo: Record<string, number> = {};

  let totalLivre = 0;
  let totalIdeal = 0;
  let totalMinimo = 0;

  activeItems.forEach((item) => {
    const val = Number(item.valorDeclarado) || 0;
    plannedLivre[item.id] = val;
    totalLivre += val;

    // Ideal Scenario
    let idealVal = val;
    if (['alim-delivery', 'lazer-compras', 'lazer-hobbies', 'lazer-presentes'].includes(item.id)) {
      idealVal = Math.round(val * 0.5);
    } else if (['alim-restaurantes', 'transp-apps', 'lazer-eventos'].includes(item.id)) {
      idealVal = Math.round(val * 0.7);
    }
    plannedIdeal[item.id] = idealVal;
    totalIdeal += idealVal;

    // Mínimo Scenario
    let minimoVal = val;
    if (item.categoriaKey === 'lazer' || ['alim-delivery', 'sub-netflix', 'sub-prime'].includes(item.id)) {
      minimoVal = 0;
    } else if (['alim-restaurantes', 'alim-padaria', 'transp-apps'].includes(item.id)) {
      minimoVal = Math.round(val * 0.25);
    }
    plannedMinimo[item.id] = minimoVal;
    totalMinimo += minimoVal;
  });

  const surplusLivre = totalRevenue - totalLivre;
  const surplusIdeal = totalRevenue - totalIdeal;
  const surplusMinimo = totalRevenue - totalMinimo;

  return {
    minimo: {
      key: 'minimo',
      name: '🟢 Cenário Mínimo (Sobrevivência Essencial)',
      description: 'Corta 100% de gastos discricionários para virada de jogo rápida em momentos de emergência.',
      badge: 'Virada Rápida',
      colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-900',
      totalExpenses: totalMinimo,
      totalRevenue: totalRevenue,
      surplusOrDeficit: surplusMinimo,
      isDeficit: surplusMinimo < 0,
      plannedExpenses: plannedMinimo,
    },
    ideal: {
      key: 'ideal',
      name: '🔵 Cenário Ideal (Recomendado SPAGET)',
      description: 'Equilíbrio perfeito entre viver com dignidade, manter 1-2 descansos e quitar dívidas.',
      badge: 'Recomendado',
      colorClass: 'border-brand bg-brand-light/30 text-[#22201D]',
      totalExpenses: totalIdeal,
      totalRevenue: totalRevenue,
      surplusOrDeficit: surplusIdeal,
      isDeficit: surplusIdeal < 0,
      plannedExpenses: plannedIdeal,
    },
    livre: {
      key: 'livre',
      name: '🟠 Cenário Livre (Estilo de Vida Atual)',
      description: 'Mantém 100% dos seus lançamentos atuais sem nenhum corte.',
      badge: 'Atual Sem Cortes',
      colorClass: 'border-amber-400 bg-amber-50 text-amber-900',
      totalExpenses: totalLivre,
      totalRevenue: totalRevenue,
      surplusOrDeficit: surplusLivre,
      isDeficit: surplusLivre < 0,
      plannedExpenses: plannedLivre,
    },
  };
}
