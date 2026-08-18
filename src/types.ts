export type CategoryKey = 
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'assinaturas'
  | 'educacao'
  | 'lazer'
  | 'pets'
  | 'financeiro';

export interface CategoryInfo {
  key: CategoryKey;
  titulo: string;
  subtitulo: string;
  icone: string;
  sugestaoReferencia: string;
}

export interface CategorizedExpenseItem {
  id: string;
  categoriaKey: CategoryKey;
  rotulo: string;
  temDespesa: boolean;
  valorDeclarado: number;
  sugestaoMinima: string;
  observacao?: string;
  isCustom?: boolean;
  
  // Metadados específicos para despesas financeiras / dívidas
  isDebt?: boolean;
  credor?: string;
  valorTotalDivida?: number;
  jurosMensais?: number;
  parcelaMinima?: number;
  dataVencimento?: string;
}

export interface Debt {
  id: string;
  credor: string;
  valor: number;
  tipo: 'pessoal' | 'banco' | 'cartao' | 'outro';
  dataOrigem?: string;
  dataVencimento?: string;
  juros?: number;
  parcelaMinima?: number;
  prioridade?: number;
}

export interface Expense {
  id: string;
  nome: string;
  valor: number;
  categoria?: string;
}

export interface Skill {
  id: string;
  habilidade: string;
  jaRecebeu: boolean;
  quemPagaria: string;
  quantoPoderiaGerar: number;
  velocidade: 'rapido' | 'medio' | 'lento';
  selecionada?: boolean;
  primeiroPasso?: string;
}

export interface ActionStep {
  id: string;
  descricao: string;
  prazoEstimado: number; // in days
}

export interface SpagetData {
  userId: string;
  createdAt: string;
  updatedAt: string;
  challengeStartDate: string; // ISO date string
  challengeEndDate: string; // ISO date string
  currentStage: 'diagnostico' | 'receita' | 'orcamento' | 'plano' | 'concluido';
  completedStages: string[]; // e.g. ['diagnostico']
  
  // Etapa 1 - Novas 9 Categorias
  categorizedExpenses: Record<string, CategorizedExpenseItem[]>;
  currentRevenue: number;
  forgottenCategoriesChecked: string[]; // para memória visual de categorias
  stage1Confirmed: boolean;

  // Compatibilidade com despesas planas e dívidas antigas
  debts: Debt[];
  fixedExpenses: Expense[];
  variableExpenses: Expense[];

  // Etapa 2
  skills: Skill[];
  stage2Confirmed: boolean;

  // Etapa 3
  debtStrategy: 'snowball' | 'avalanche'; // 'snowball' = Vitórias Rápidas (menor valor primeiro), 'avalanche' = Maior Juro
  plannedExpenses: Record<string, number>; // expenseId -> plannedValue
  plannedRevenue: Record<string, number>; // skillId or 'base' -> plannedValue
  priorityDebtId: string;
  priorityDebtPayment: number;
  otherDebtsPayments: Record<string, number>; // debtId -> payment
  debtPriorityOrder: string[]; // array of debtIds
  whatToCutFirst: string;
  stage3Confirmed: boolean;

  // Etapa 4
  selectedRevenueSourceId: string; // skillId
  actions: ActionStep[];
  debtStartDates: Record<string, string>; // debtId -> start date string
  whatToResolveNext: string; // "depois deste SPAGET, o que preciso resolver"
  safetyMarginFactor: number; // 1.2, 1.5, ou 2.0
  stage4Confirmed: boolean;
}

