import React, { useRef, useState, useEffect } from 'react';
import { useSpaget } from '../context/SpagetContext';
import { Lock, Check, Cloud, CloudOff, LogOut, User, Mail, Shield, Loader, Key, Sliders, Heart } from 'lucide-react';
import { ManagementCenterModal } from './ManagementCenterModal';
import { UserPreferencesModal } from './UserPreferencesModal';
import { userPreferencesService } from '../services/userPreferencesService';

export const Header: React.FC = () => {
  const { 
    data, 
    moveToStage, 
    exportBackup, 
    importBackup,
    user,
    authLoading,
    signInWithGoogle,
    loginOrRegisterWithEmail,
    logout,
    isSynced,
    isSaving
  } = useSpaget();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    if (user) {
      userPreferencesService.getUserRole(user.uid).then((r) => setUserRole(r));
    } else {
      setUserRole('user');
    }
  }, [user]);
  
  // Local state for Email login/magic register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const stages = [
    { id: 'diagnostico', label: '1. Diagnóstico', isConfirmed: data.stage1Confirmed },
    { id: 'receita', label: '2. Renda', isConfirmed: data.stage2Confirmed },
    { id: 'orcamento', label: '3. Orçamento', isConfirmed: data.stage3Confirmed },
    { id: 'plano', label: '4. Plano', isConfirmed: data.stage4Confirmed },
  ] as const;

  const isStageAccessible = (stageId: typeof stages[number]['id']) => {
    if (stageId === 'diagnostico') return true;
    if (stageId === 'receita') return data.stage1Confirmed;
    if (stageId === 'orcamento') return data.stage1Confirmed && data.stage2Confirmed;
    if (stageId === 'plano') return data.stage1Confirmed && data.stage2Confirmed && data.stage3Confirmed;
    return false;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (importBackup(text)) {
        alert('Dados importados com sucesso!');
      } else {
        alert('Erro ao importar o arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setAuthError('A senha/código de acesso deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      await loginOrRegisterWithEmail(email, password);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      // Message already alerted inside context, but we can set local state
      setAuthError('Falha na autenticação. Verifique os dados ou tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (err) {
      // Fallback or notice shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="border-b border-[#E1DBD2] bg-[#FAF7F1] sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* ZONE 1: BRAND TITLE */}
          <h1 className="text-2xl font-bold tracking-tight text-brand shrink-0 select-none">
            SPAGET
          </h1>

          {/* ZONE 2: 4 NAV LINKS */}
          <nav className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-1">
            {stages.map((stage, idx) => {
              const active = data.currentStage === stage.id;
              const completed = stage.isConfirmed;
              const accessible = isStageAccessible(stage.id);

              let statusClasses = 'bg-white border border-[#E1DBD2] text-[#5C5852] opacity-50 grayscale cursor-not-allowed';
              if (active) {
                statusClasses = 'bg-[#F8E3DE] border-[#C8442F] text-[#C8442F] font-bold';
              } else if (completed) {
                statusClasses = 'bg-[#E6F0E6] border-[#4F7655] text-[#4F7655] font-bold';
              } else if (accessible) {
                statusClasses = 'bg-white border-[#E1DBD2] text-[#22201D] font-medium hover:border-brand/40';
              }

              return (
                <React.Fragment key={stage.id}>
                  {idx > 0 && <div className="hidden md:block w-4 lg:w-8 h-[1px] bg-gray-300 shrink-0"></div>}
                  <button
                    onClick={() => accessible && moveToStage(stage.id)}
                    disabled={!accessible && !active}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all focus-ring whitespace-nowrap shrink-0 ${statusClasses}`}
                  >
                    {completed && <Check className="w-3.5 h-3.5 text-[#4F7655]" />}
                    {!accessible && !active && <Lock className="w-3 h-3 text-gray-400" />}
                    <span>{stage.label.split('. ')[1]}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* ZONE 3: PRIMARY ACTIONS */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Realtime Sync indicator / login trigger */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1.5 bg-[#E6F0E6] hover:bg-[#d0ebd0] border border-[#4F7655]/30 text-[#4F7655] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Nuvem ativa</span>
                  <div className="w-2 h-2 rounded-full bg-[#4F7655]"></div>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E1DBD2] rounded-xl shadow-lg p-4 space-y-3 z-50 text-left">
                    <div className="border-b border-gray-100 pb-2">
                      <p className="text-[10px] font-bold text-[#5C5852] uppercase tracking-wider">Conta Sincronizada</p>
                      <p className="text-xs font-black text-[#22201D] truncate">{user.email || 'Usuário Autenticado'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[#5C5852]">
                        <span>Status de sincronia:</span>
                        <span className="font-bold text-[#4F7655]">Conectado</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#5C5852]">
                        <span>Atualizado na nuvem:</span>
                        <span className="font-bold text-[#22201D]">Agora mesmo</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#5C5852] pt-1.5 border-t border-gray-100">
                        <span>Perfil de acesso:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                            userRole === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {userRole === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-[#B72E2A]/20 bg-[#FAF7F1] hover:bg-[#F8E3DE] text-[#B72E2A] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar nuvem</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 bg-[#FAF7F1] hover:bg-[#F8E3DE]/30 border border-[#C8442F] text-[#C8442F] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring cursor-pointer"
              >
                <CloudOff className="w-3.5 h-3.5" />
                <span>Salvar na Nuvem</span>
              </button>
            )}

            {userRole === 'admin' ? (
              <button
                onClick={() => setShowManagementModal(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-amber-50/60 border border-[#E1DBD2] text-[#22201D] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring shadow-sm cursor-pointer"
                title="Abrir Central de Controle e Gestão Master (Admin)"
              >
                <Sliders className="w-3.5 h-3.5 text-[#C8442F]" />
                <span className="hidden sm:inline">Central de Gestão (Admin)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="flex items-center gap-1.5 bg-[#E6F0E6] hover:bg-[#d0ebd0] border border-[#4F7655]/30 text-[#4F7655] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring shadow-sm cursor-pointer"
                title="Minhas Preferências Alimentares Pessoais"
              >
                <Heart className="w-3.5 h-3.5 text-[#4F7655]" />
                <span className="hidden sm:inline">Minhas Preferências</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:inline-flex items-center justify-center text-xs text-[#5C5852] hover:text-[#22201D] hover:bg-[#F8E3DE]/30 px-3 py-1.5 rounded border border-[#E1DBD2] focus-ring font-medium whitespace-nowrap transition-colors"
            >
              Importar
            </button>
            <button
              onClick={exportBackup}
              className="inline-flex items-center justify-center bg-[#C8442F] hover:bg-[#9F3022] text-[#FAF7F1] text-xs font-semibold px-3.5 py-2 rounded focus-ring transition-colors shrink-0 cursor-pointer"
            >
              Exportar
            </button>
          </div>

        </div>
      </div>

      {/* SECURE CLOUD AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#22201D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E1DBD2] max-w-md w-full rounded-2xl shadow-2xl p-6 relative text-left space-y-6">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-[#5C5852] hover:text-[#22201D] text-sm font-bold uppercase cursor-pointer"
            >
              Fechar
            </button>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F1] flex items-center justify-center border border-[#E1DBD2]">
                <Shield className="w-5 h-5 text-[#C8442F]" />
              </div>
              <h2 className="text-lg font-black text-[#22201D] tracking-tight">Sincronização em Nuvem Dual-Engine</h2>
              <p className="text-xs text-[#5C5852] leading-relaxed">
                Seus dados serão gravados com segurança em tempo real tanto no seu navegador quanto em nossos servidores na nuvem do Google Firestore. Nunca mais perca seu progresso.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-[#FAF7F1] border-l-4 border-l-[#B72E2A] text-xs text-[#B72E2A] rounded font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              {/* Primary Method: Google Sign In */}
              <button
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border-2 border-[#E1DBD2] hover:border-[#C8442F] text-[#22201D] text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer focus-ring"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Conectar com o Google</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-[#5C5852] font-bold uppercase tracking-wider">ou login por e-mail</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Secondary Backup Method: Frictionless Email login */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5C5852] uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#C8442F]" /> Endereço de e-mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E1DBD2] bg-[#FAF7F1]/30 rounded-lg focus:outline-none focus:border-[#C8442F] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5C5852] uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#C8442F]" /> Senha ou código de acesso (mín. 6 dígitos)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Sua senha secreta de sincronia"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E1DBD2] bg-[#FAF7F1]/30 rounded-lg focus:outline-none focus:border-[#C8442F] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-[#C8442F] hover:bg-[#9F3022] text-[#FAF7F1] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isSubmitting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Entrar ou Criar Conta</span>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[9px] text-[#5C5852] leading-relaxed block italic">
                * Se for seu primeiro acesso com este e-mail, sua conta será criada automaticamente no ato.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* CENTRAL DE CONTROLE E GESTÃO NO-CODE (ADMIN) */}
      <ManagementCenterModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
      />

      {/* MODAL DE PREFERÊNCIAS INDIVIDUAIS (USUÁRIO) */}
      <UserPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />
    </header>
  );
};
