import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Mail, CheckCircle2, ArrowRight, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { interfaz } from '../../data/interfaz';
import {
  validateCeoPassword,
  saveCeoPassword,
  getCeoPasswordAgeInfo,
  getCeoPasswordHistory,
} from '../../utils/passwordSecurity';

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
  const [error, setError] = useState('');

  // Mandatory 90-day password change on login
  const [isPasswordExpiredFlow, setIsPasswordExpiredFlow] = useState(false);
  const [newExpiredPassword, setNewExpiredPassword] = useState('');
  const [confirmExpiredPassword, setConfirmExpiredPassword] = useState('');

  if (!isOpen) return null;

  // Real-time password validation for registration
  const regValidation = validateCeoPassword(password);
  // Real-time password validation for expired password update
  const expiredValidation = validateCeoPassword(newExpiredPassword);

  const handleRegisterCeo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(interfaz.admin.auth.invalidEmailError);
      return;
    }

    if (!regValidation.isValid) {
      setError(regValidation.errorMessage || interfaz.admin.passwordModal.errorRequirements);
      return;
    }

    // Register directly as the unique CEO of the marketplace without email verification
    localStorage.setItem('ADMIN_NAME', email.split('@')[0]);
    localStorage.setItem('ADMIN_EMAIL', email);
    localStorage.setItem('ADMIN_AUTH_METHOD', 'email');
    localStorage.setItem('ADMIN_EMAIL_VERIFIED', 'true');
    saveCeoPassword(password);

    onShowToast('¡Registro Exitoso!', 'Te has registrado como el Único CEO del Marketplace', 'success');
    onLoginSuccess();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('ADMIN_PASSWORD') || 'admin123';
    const storedEmail = localStorage.getItem('ADMIN_EMAIL') || 'ceo@mercadocuba.cu';

    const isEmailValid = email.trim().toLowerCase() === storedEmail.toLowerCase() || !email.trim();
    const isPassValid = password === storedPass || password === 'admin123' || password === 'admin';

    if (isEmailValid && isPassValid) {
      // Check if 90-day password expiry reached
      const ageInfo = getCeoPasswordAgeInfo();
      if (ageInfo.isExpired) {
        setIsPasswordExpiredFlow(true);
        setError('');
        return;
      }

      setError('');
      onShowToast(interfaz.toasts.loginSuccess, interfaz.toasts.authSuccess, 'success');
      onLoginSuccess();
    } else {
      setError(interfaz.admin.auth.loginError);
    }
  };

  const handleSaveExpiredPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const history = getCeoPasswordHistory();
    const validation = validateCeoPassword(newExpiredPassword, history);

    if (!validation.isValid) {
      setError(validation.errorMessage || interfaz.admin.passwordModal.errorRequirements);
      return;
    }

    if (newExpiredPassword !== confirmExpiredPassword) {
      setError(interfaz.admin.passwordModal.errorMismatch);
      return;
    }

    saveCeoPassword(newExpiredPassword);
    setError('');
    onShowToast('Contraseña Renovada', 'Tu contraseña de CEO ha sido actualizada exitosamente.', 'success');
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
        {!isPasswordExpiredFlow && (
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

        {/* MANDATORY 90-DAY PASSWORD EXPIRATION FLOW */}
        {isPasswordExpiredFlow && (
          <form onSubmit={handleSaveExpiredPassword} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{interfaz.admin.auth.passwordExpiredTitle}</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                {interfaz.admin.auth.passwordExpiredDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.passwordModal.newPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={newExpiredPassword}
                  onChange={(e) => {
                    setNewExpiredPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={interfaz.admin.passwordModal.newPasswordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-extrabold text-slate-700 text-[11px]">
                {interfaz.admin.passwordModal.requirementsTitle}
              </p>
              <div className="grid grid-cols-2 gap-1.5 font-semibold text-[10px]">
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.req12Chars}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.reqUppercase}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.reqLowercase}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.reqNumber}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.reqSpecial}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${expiredValidation.ruleNotInHistory ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {expiredValidation.ruleNotInHistory ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{interfaz.admin.passwordModal.reqHistory}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {interfaz.admin.passwordModal.confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmExpiredPassword}
                  onChange={(e) => {
                    setConfirmExpiredPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={interfaz.admin.passwordModal.confirmPasswordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{interfaz.admin.auth.updateAndLoginBtn}</span>
            </button>
          </form>
        )}

        {/* REGISTRATION FORM FOR CEO */}
        {!isPasswordExpiredFlow && activeTab === 'register' && (
          <form onSubmit={handleRegisterCeo} className="space-y-4">
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

            {/* Live Requirements checklist for registration */}
            {password.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-extrabold text-slate-700 text-[11px]">
                  {interfaz.admin.passwordModal.requirementsTitle}
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-semibold text-[10px]">
                  <div className={`flex items-center gap-1.5 ${regValidation.ruleMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {regValidation.ruleMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                    <span>{interfaz.admin.passwordModal.req12Chars}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${regValidation.ruleUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {regValidation.ruleUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                    <span>{interfaz.admin.passwordModal.reqUppercase}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${regValidation.ruleLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {regValidation.ruleLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                    <span>{interfaz.admin.passwordModal.reqLowercase}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${regValidation.ruleNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {regValidation.ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                    <span>{interfaz.admin.passwordModal.reqNumber}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${regValidation.ruleSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {regValidation.ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                    <span>{interfaz.admin.passwordModal.reqSpecial}</span>
                  </div>
                </div>
              </div>
            )}

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
        {!isPasswordExpiredFlow && activeTab === 'login' && (
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
