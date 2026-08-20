import React from 'react';
import { SpagetProvider, useSpaget } from './context/SpagetContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ProgressPanel } from './components/ProgressPanel';
import { DiagnosticoStage } from './components/DiagnosticoStage';
import { ReceitaStage } from './components/ReceitaStage';
import { OrcamentoStage } from './components/OrcamentoStage';
import { PlanoStage } from './components/PlanoStage';
import { FinalScreen } from './components/FinalScreen';
import { Lock } from 'lucide-react';

function MainLayout() {
  const { data, moveToStage } = useSpaget();

  // Route stages correctly
  const renderCurrentStage = () => {
    switch (data.currentStage) {
      case 'diagnostico':
        return <DiagnosticoStage />;
      case 'receita':
        if (!data.stage1Confirmed) {
          return <LockedStageView title="2. Aumentar minha renda" prerequisite="1. Entender minha situação" />;
        }
        return <ReceitaStage />;
      case 'orcamento':
        if (!data.stage1Confirmed || !data.stage2Confirmed) {
          return <LockedStageView title="3. Fazer o orçamento fechar" prerequisite="2. Aumentar minha renda" />;
        }
        return <OrcamentoStage />;
      case 'plano':
        if (!data.stage1Confirmed || !data.stage2Confirmed || !data.stage3Confirmed) {
          return <LockedStageView title="4. Colocar o plano em prática" prerequisite="3. Fazer o orçamento fechar" />;
        }
        return <PlanoStage />;
      case 'concluido':
        return <FinalScreen />;
      default:
        return <DiagnosticoStage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F1] flex flex-col selection:bg-brand-light selection:text-brand">
      <Header />
      <ProgressPanel />
      <main className="flex-1">
        {renderCurrentStage()}
      </main>
      <footer className="border-t border-[#E1DBD2] py-6 text-center text-[11px] text-[#5C5852] font-semibold bg-[#FAF7F1]">
        <p>SPAGET — Sistema Pessoal de Diagnóstico Financeiro e Plano de Ação</p>
        <p className="mt-1 font-normal opacity-80">Salvamento automático ativo • Alterações recalculam o restante</p>
      </footer>
    </div>
  );
}

// Beautiful zero-preview zero-sample lock view
interface LockedStageViewProps {
  title: string;
  prerequisite: string;
}

const LockedStageView: React.FC<LockedStageViewProps> = ({ title, prerequisite }) => {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E1DBD2]/30 text-[#5C5852]">
        <Lock className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-extrabold text-[#22201D]">{title}</h2>
        <p className="text-sm text-[#5C5852]">
          Esta etapa está bloqueada por um cadeado de segurança financeira.
        </p>
      </div>
      <p className="text-xs text-[#C8442F] bg-[#F8E3DE] px-3.5 py-2 rounded-lg font-bold border border-[#F8E3DE] inline-block">
        Conclua a etapa "{prerequisite}" para liberar este conteúdo.
      </p>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SpagetProvider>
        <MainLayout />
      </SpagetProvider>
    </ErrorBoundary>
  );
}
