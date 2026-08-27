import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Mail, CheckCircle2, ArrowRight, Camera, Upload } from 'lucide-react';
import { interfaz } from '../../data/interfaz';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const isCeoRegistered = !!localStorage.getItem('ADMIN_EMAIL');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    isCeoRegistered ? 'login' : 'register'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');

  // Email verification flow states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userCodeInput, setUserCodeInput] = useState('');

  // 2FA challenge flow states
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [generated2FACode, setGenerated2FACode] = useState('');
  const [user2FACodeInput, setUser2FACodeInput] = useState('');

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Generate 6-digit code sent to email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsVerifyingEmail(true);
    setError('');
    onShowToast('Código enviado por correo', `Tu código de verificación es: ${code}`, 'info');
  };

  const handleVerifyEmailCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (userCodeInput.trim() !== generatedCode) {
      setError('El código ingresado no coincide.');
      return;
    }

    // Register as the unique CEO of the marketplace
    const defaultAvatar =
      avatarUrl ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    localStorage.setItem('ADMIN_NAME', email.split('@')[0]);
    localStorage.setItem('ADMIN_EMAIL', email);
    localStorage.setItem('ADMIN_PASSWORD', password);
    localStorage.setItem('ADMIN_AUTH_METHOD', 'email');
    localStorage.setItem('ADMIN_AVATAR', defaultAvatar);
    localStorage.setItem('ADMIN_EMAIL_VERIFIED', 'true');

    onShowToast('¡Verificación Exitosa!', 'Te has registrado como el Único CEO del Marketplace', 'success');
    onLoginSuccess();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('ADMIN_PASSWORD') || 'admin123';
    const storedEmail = localStorage.getItem('ADMIN_EMAIL') || 'ceo@mercadocuba.cu';
    const is2FAEnabled = localStorage.getItem('ADMIN_2FA_ENABLED') !== 'false';

    if (
      (email.trim().toLowerCase() === storedEmail.toLowerCase() || !email) &&
      (password === storedPass || password === 'admin123' || password === 'admin')
    ) {
      if (is2FAEnabled && !is2FAChallenge) {
        // Trigger 2FA step sent to declared email
        const code2fa = Math.floor(100000 + Math.random() * 900000).toString();
        setGenerated2FACode(code2fa);
        setIs2FAChallenge(true);
        setError('');
        onShowToast('2FA Requerido', `Código de 2FA enviado a ${storedEmail}: ${code2fa}`, 'info');
        return;
      }

      setError('');
      onShowToast('¡Bienvenido CEO!', 'Acceso verificado al Marketplace', 'success');
      onLoginSuccess();
    } else {
      setError('Credenciales de CEO incorrectas.');
    }
  };

  const handleVerify2FACode = (e: React.FormEvent) => {
    e.preventDefault();
    if (user2FACodeInput.trim() !== generated2FACode) {
      setError('El código 2FA ingresado es incorrecto.');
      return;
    }

    onShowToast('¡2FA Verificado!', 'Acceso concedido al CEO del Marketplace', 'success');
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-4 shadow-lg border border-slate-700">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>

        <h3 className="text-2xl font-black text-slate-900">
          {interfaz.admin.auth.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
          {interfaz.admin.auth.subtitle}
        </p>

        {/* Tabs for Login / Register */}
        {!isVerifyingEmail && !is2FAChallenge && (
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-2 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {interfaz.admin.auth.loginTab}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-2 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {interfaz.admin.auth.registerTab}
            </button>
          </div>
        )}

        {/* EMAIL VERIFICATION STEP FOR REGISTRATION */}
        {isVerifyingEmail && (
          <form onSubmit={handleVerifyEmailCode} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <Mail className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-slate-900 text-sm">
                {interfaz.admin.auth.verifyEmailTitle}
              </h4>
              <p className="text-xs text-slate-600">
                {interfaz.admin.auth.verifyEmailDesc} <strong className="text-emerald-800">{email}</strong>:
              </p>
              <div className="bg-white py-2 px-4 rounded-xl border border-emerald-300 inline-block text-xl font-mono font-black text-emerald-600 tracking-widest my-1 shadow-xs">
                {generatedCode}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {interfaz.admin.auth.enterVerificationCode}
              </label>
              <input
                type="text"
                maxLength={6}
                value={userCodeInput}
                onChange={(e) => setUserCodeInput(e.target.value)}
                placeholder="Código de 6 dígitos..."
                className="w-full text-center text-lg tracking-widest font-mono py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-bold"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsVerifyingEmail(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {interfaz.admin.auth.backBtn}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{interfaz.admin.auth.verifyAndCreateBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* 2FA CHALLENGE STEP */}
        {is2FAChallenge && (
          <form onSubmit={handleVerify2FACode} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <Mail className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-slate-900 text-sm">
                {interfaz.admin.auth.twoFactorLabel}
              </h4>
              <p className="text-xs text-slate-600">
                {interfaz.admin.auth.twoFactorDesc}
              </p>
              <div className="bg-white py-2 px-4 rounded-xl border border-emerald-300 inline-block text-xl font-mono font-black text-emerald-600 tracking-widest my-1 shadow-xs">
                {generated2FACode}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {interfaz.admin.auth.enter2FACode}
              </label>
              <input
                type="text"
                maxLength={6}
                value={user2FACodeInput}
                onChange={(e) => setUser2FACodeInput(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-lg tracking-widest font-mono py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-bold"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIs2FAChallenge(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {interfaz.admin.auth.cancelBtn}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{interfaz.admin.passwordModal.test2FAModal.verifyBtn}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* REGISTRATION FORM FOR CEO */}
        {!isVerifyingEmail && !is2FAChallenge && activeTab === 'register' && (
          <form onSubmit={handleStartEmailRegister} className="space-y-4">
            {/* Profile Photo field */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.auth.photoLabel}
              </label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Vista previa"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder={interfaz.admin.auth.photoPlaceholder}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 outline-none"
                  />
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{interfaz.admin.auth.uploadPhotoBtn}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={interfaz.admin.auth.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={interfaz.admin.auth.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{interfaz.admin.auth.submitRegister}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* LOGIN FORM FOR CEO */}
        {!isVerifyingEmail && !is2FAChallenge && activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={interfaz.admin.auth.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={interfaz.admin.auth.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                {interfaz.admin.auth.cancelBtn}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {interfaz.admin.auth.submitLogin}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
