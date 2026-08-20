import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, Terminal, Copy, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  private isBenignError = (message: string): boolean => {
    const benignPatterns = [
      'Database is closing/hidden',
      'ResizeObserver loop',
      'AbortError',
      'canceled',
      'cancelled',
      'indexeddb',
      'Failed to fetch',
      'NetworkError'
    ];
    const lower = message.toLowerCase();
    return benignPatterns.some(pattern => lower.includes(pattern.toLowerCase()));
  };

  private handleGlobalError = (event: ErrorEvent) => {
    const message = event.message || (event.error && event.error.message) || '';
    if (this.isBenignError(message)) {
      console.warn("Ignored non-fatal global window error:", message);
      event.preventDefault?.();
      return;
    }
    console.error("Global uncaught error caught by ErrorBoundary:", event.error);
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message || 'Erro assíncrono desconhecido')
    });
  };

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || '');
    
    if (this.isBenignError(message)) {
      console.warn("Ignored non-fatal background promise rejection:", message);
      event.preventDefault?.();
      return;
    }

    console.error("Unhandled promise rejection caught by ErrorBoundary:", event.reason);
    const reasonError = event.reason instanceof Error 
      ? event.reason 
      : new Error(typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason || 'Rejeição de Promise não tratada'));
    this.setState({
      hasError: true,
      error: reasonError
    });
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by SPAGET ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleCopyError = () => {
    if (!this.state.error) return;
    const fullLog = `SPAGET Runtime Error Log
-----------------------------------
Timestamp: ${new Date().toISOString()}
User-Agent: ${navigator.userAgent}
URL: ${window.location.href}

Error Message:
${this.state.error.message}

Error Stack:
${this.state.error.stack || 'No stack trace available'}

Component Stack Trace:
${this.state.errorInfo?.componentStack || 'No component stack trace available'}
`;
    navigator.clipboard.writeText(fullLog).then(() => {
      alert('Log do erro copiado para a área de transferência!');
    }).catch(err => {
      console.error('Failed to copy error to clipboard', err);
    });
  };

  private handleResetCache = () => {
    if (window.confirm('Deseja limpar todos os dados locais salvos para tentar recuperar o sistema? Isso removerá dados de simulação não sincronizados na nuvem.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F1] flex flex-col items-center justify-center p-6 selection:bg-brand-light selection:text-brand">
          <div className="max-w-2xl w-full bg-white border border-[#E1DBD2] rounded-2xl shadow-xl p-8 space-y-6">
            
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
              <div className="p-3 bg-[#F8E3DE] border border-[#C8442F]/20 rounded-xl text-[#C8442F] shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-black text-[#22201D] tracking-tight">Ocorreu um erro inesperado</h1>
                <p className="text-xs text-[#5C5852] leading-relaxed">
                  A Engine de Visualização do SPAGET encontrou um erro crítico de execução. Para auxiliar no desenvolvimento e depuração do sistema, o log de erro completo está detalhado abaixo.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {this.state.error && (
              <div className="bg-[#FAF7F1] border-l-4 border-l-[#C8442F] p-4 rounded text-xs font-semibold text-[#C8442F] break-words leading-relaxed">
                <strong>Erro:</strong> {this.state.error.toString()}
              </div>
            )}

            {/* Terminal Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#5C5852] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#C8442F]" /> Log do Erro Completo (Stack Trace)
                </span>
                <span>DESENVOLVEDOR</span>
              </div>
              <div className="bg-[#1C1A17] text-[#D0C2B0] p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 shadow-inner border border-[#2A2723]">
                <p className="text-[#8A7E72] mb-2">// SPAGET CRASH LOG - {new Date().toLocaleTimeString()}</p>
                <pre className="whitespace-pre">{this.state.error?.stack || 'Processando stack...'}</pre>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <div className="border-t border-[#2A2723] my-3"></div>
                    <p className="text-[#8A7E72] mb-2">// COMPONENT HIERARCHY STACK</p>
                    <pre className="whitespace-pre text-gray-400">{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleCopyError}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-[#E1DBD2] hover:border-[#C8442F] text-[#22201D] hover:text-[#C8442F] text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Erro Completo</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#C8442F] hover:bg-[#9F3022] text-[#FAF7F1] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-[#F8E3DE] border border-[#B72E2A]/20 text-[#B72E2A] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                title="Limpar localStorage para resolver problemas de dados corrompidos"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sm:hidden">Limpar Cache</span>
              </button>
            </div>

            <div className="text-center text-[9px] text-[#5C5852] italic">
              * Se o erro persistir após "Tentar Novamente", clique no ícone de lixeira para limpar dados corrompidos.
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
