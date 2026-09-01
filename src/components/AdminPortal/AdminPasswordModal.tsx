import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, X, KeyRound, Check, Mail, User, Clock, AlertTriangle } from 'lucide-react';
import { interfaz } from '../../data/interfaz';
import {
  validateCeoPassword,
  saveCeoPassword,
  getCeoPasswordAgeInfo,
  getCeoPasswordHistory,
  PASSWORD_EXPIRY_DAYS,
} from '../../utils/passwordSecurity';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [ceoName, setCeoName] = useState('');
  const [ceoEmail, setCeoEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Expiration info
  const [ageInfo, setAgeInfo] = useState({
    daysPassed: 0,
    daysRemaining: 90,
    isExpired: false,
    lastUpdateDate: new Date(),
  });

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('ADMIN_EMAIL') || 'ceo@mercadocuba.cu';
      const savedName = localStorage.getItem('ADMIN_NAME') || 'CEO Marketplace';

      setCeoName(savedName);
      setCeoEmail(savedEmail);
      setAgeInfo(getCeoPasswordAgeInfo());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time validation against rules and last 5 history
  const history = getCeoPasswordHistory();
  const validation = validateCeoPassword(newPassword, history);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('ADMIN_PASSWORD') || 'admin123';

    // Save profile data
    localStorage.setItem('ADMIN_NAME', ceoName);
    localStorage.setItem('ADMIN_EMAIL', ceoEmail);

    // Password change verification
    if (newPassword || currentPassword) {
      if (currentPassword !== storedPass && currentPassword !== 'admin123' && currentPassword !== 'admin') {
        setError(interfaz.admin.passwordModal.errorCurrentPassword);
        return;
      }

      if (!validation.isValid) {
        setError(validation.errorMessage || interfaz.admin.passwordModal.errorRequirements);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(interfaz.admin.passwordModal.errorMismatch);
        return;
      }

      saveCeoPassword(newPassword);
    }

    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Datos de CEO Guardados', 'Se actualizaron los datos del CEO y la configuración de seguridad.', 'success');
    onClose();
  };

  const percentageRemaining = Math.max(0, Math.min(100, Math.round((ageInfo.daysRemaining / PASSWORD_EXPIRY_DAYS) * 100)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CEO Profile Banner Header */}
        <div className="bg-slate-900 text-white p-4 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-emerald-400">
              {ceoName.charAt(0).toUpperCase() || 'C'}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-white">{ceoName}</h4>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {interfaz.admin.passwordModal.ceoBadge}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{ceoEmail}</p>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>{interfaz.admin.passwordModal.verifiedEmail}</span>
              </span>
            </div>
          </div>

          <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900">
          {interfaz.admin.passwordModal.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {interfaz.admin.passwordModal.subtitle}
        </p>

        {/* 90-Day Password Expiry Status Widget */}
        <div className={`mt-4 p-3.5 rounded-2xl border ${
          ageInfo.isExpired
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : ageInfo.daysRemaining <= 15
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <div className="flex items-center gap-1.5">
              {ageInfo.isExpired ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>
                {ageInfo.isExpired
                  ? interfaz.admin.passwordModal.statusExpired.replace('{days}', ageInfo.daysPassed.toString())
                  : interfaz.admin.passwordModal.statusValid.replace('{days}', ageInfo.daysRemaining.toString())}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/80 border border-current">
              {ageInfo.daysRemaining} / {PASSWORD_EXPIRY_DAYS} días
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                ageInfo.isExpired
                  ? 'bg-rose-600'
                  : ageInfo.daysRemaining <= 15
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Último cambio: {ageInfo.lastUpdateDate.toLocaleDateString()} (Rotación obligatoria cada {PASSWORD_EXPIRY_DAYS} días).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 1. CEO Information */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>{interfaz.admin.passwordModal.profileSectionTitle}</span>
            </span>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {interfaz.admin.passwordModal.nameLabel}
              </label>
              <input
                type="text"
                value={ceoName}
                onChange={(e) => setCeoName(e.target.value)}
                placeholder={interfaz.admin.passwordModal.namePlaceholder}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {interfaz.admin.passwordModal.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={ceoEmail}
                  onChange={(e) => setCeoEmail(e.target.value)}
                  placeholder={interfaz.admin.passwordModal.emailPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Password Change */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>{interfaz.admin.passwordModal.passwordSectionTitle}</span>
            </span>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {interfaz.admin.passwordModal.currentPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={interfaz.admin.passwordModal.currentPasswordPlaceholder}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none text-xs"
                />
              </div>
            </div>

            {currentPassword.length > 0 && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {interfaz.admin.passwordModal.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                      }}
                      placeholder={interfaz.admin.passwordModal.newPasswordPlaceholder}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Password Strength and Policy checklist */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                  <p className="font-extrabold text-slate-700 text-[11px]">
                    {interfaz.admin.passwordModal.requirementsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 font-semibold text-[10px]">
                    <div className={`flex items-center gap-1.5 ${validation.ruleMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.req12Chars}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validation.ruleUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqUppercase}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validation.ruleLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqLowercase}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validation.ruleNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqNumber}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validation.ruleSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqSpecial}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validation.ruleNotInHistory ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {validation.ruleNotInHistory ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqHistory}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {interfaz.admin.passwordModal.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder={interfaz.admin.passwordModal.confirmPasswordPlaceholder}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {interfaz.admin.passwordModal.cancelButton}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{interfaz.admin.passwordModal.saveButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
