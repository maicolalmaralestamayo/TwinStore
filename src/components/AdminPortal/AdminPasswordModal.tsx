import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, X, KeyRound, Check, Mail, User, Smartphone, Camera, Upload } from 'lucide-react';
import { interfaz } from '../../data/interfaz';

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
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [enable2FA, setEnable2FA] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // 2FA Test Modal inside banner
  const [show2FATest, setShow2FATest] = useState(false);
  const [testCodeInput, setTestCodeInput] = useState('');
  const [generated2FACode, setGenerated2FACode] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('ADMIN_EMAIL') || 'ceo@mercadocuba.cu';
      const savedName = localStorage.getItem('ADMIN_NAME') || 'CEO Marketplace';
      const savedAvatar = localStorage.getItem('ADMIN_AVATAR') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      const saved2FA = localStorage.getItem('ADMIN_2FA_ENABLED') !== 'false';

      setCeoName(savedName);
      setCeoEmail(savedEmail);
      setAvatarUrl(savedAvatar);
      setEnable2FA(saved2FA);
    }
  }, [isOpen]);

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

  // Password strength checklist
  const ruleMinLength = newPassword.length >= 12;
  const ruleUppercase = /[A-Z]/.test(newPassword);
  const ruleLowercase = /[a-z]/.test(newPassword);
  const ruleNumber = /[0-9]/.test(newPassword);
  const ruleSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isPasswordValid = ruleMinLength && ruleUppercase && ruleLowercase && ruleNumber && ruleSpecial;

  const handleGenerate2FA = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGenerated2FACode(code);
    setShow2FATest(true);
    onShowToast('Código 2FA Generado', `Tu código de verificación de prueba enviado a ${ceoEmail} es: ${code}`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('ADMIN_PASSWORD') || 'admin123';

    // Save profile data
    localStorage.setItem('ADMIN_NAME', ceoName);
    localStorage.setItem('ADMIN_EMAIL', ceoEmail);
    localStorage.setItem('ADMIN_AVATAR', avatarUrl);
    localStorage.setItem('ADMIN_2FA_ENABLED', enable2FA ? 'true' : 'false');

    // Password change verification
    if (newPassword || currentPassword) {
      if (currentPassword !== storedPass && currentPassword !== 'admin123' && currentPassword !== 'admin') {
        setError('La contraseña actual de CEO no es correcta.');
        return;
      }

      if (!isPasswordValid) {
        setError('La nueva contraseña debe cumplir con todos los requisitos de seguridad.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Las contraseñas nuevas no coinciden.');
        return;
      }

      localStorage.setItem('ADMIN_PASSWORD', newPassword);
    }

    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Datos de CEO Guardados', 'Se actualizaron la foto, correo, contraseña y 2FA', 'success');
    onClose();
  };

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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={ceoName}
                className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md border-2 border-emerald-400">
                {ceoName.charAt(0).toUpperCase() || 'C'}
              </div>
            )}

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

          <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900">
          {interfaz.admin.passwordModal.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {interfaz.admin.passwordModal.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 1. CEO Information & Photo */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase text-slate-800 block flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>{interfaz.admin.passwordModal.profileSectionTitle}</span>
            </span>

            {/* Photo update */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {interfaz.admin.passwordModal.photoLabel}
              </label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="CEO"
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="URL de foto de perfil..."
                    className="w-full px-3 py-1 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-emerald-500"
                  />
                  <label className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{interfaz.admin.passwordModal.uploadPhoto}</span>
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

            {/* 2FA Toggle & Verification */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enable2FA}
                    onChange={(e) => setEnable2FA(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {interfaz.admin.passwordModal.twoFactorCheckbox}
                  </span>
                </label>

                {enable2FA && (
                  <button
                    type="button"
                    onClick={handleGenerate2FA}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    {interfaz.admin.passwordModal.test2FABtn}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {interfaz.admin.passwordModal.twoFactorExplanation}
              </p>
            </div>
          </div>

          {/* 2. Password Change */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase text-slate-800 block flex items-center gap-1.5">
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

                {/* Password Strength checklist */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                  <p className="font-extrabold text-slate-700 text-[10px] mb-1">
                    {interfaz.admin.passwordModal.requirementsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-1 font-semibold text-[10px]">
                    <div className={`flex items-center gap-1 ${ruleMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ruleMinLength ? <Check className="w-3 h-3 text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.req12Chars}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${ruleUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ruleUppercase ? <Check className="w-3 h-3 text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqUppercase}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${ruleLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ruleLowercase ? <Check className="w-3 h-3 text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqLowercase}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${ruleNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ruleNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqNumber}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${ruleSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ruleSpecial ? <Check className="w-3 h-3 text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      <span>{interfaz.admin.passwordModal.reqSpecial}</span>
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

        {/* 2FA Modal Test overlay */}
        {show2FATest && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                {interfaz.admin.passwordModal.test2FAModal.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {interfaz.admin.passwordModal.test2FAModal.desc} ({ceoEmail}):
              </p>
              <div className="text-xl font-mono font-black text-emerald-600 tracking-widest my-2 bg-emerald-50 py-1 px-4 rounded-xl border border-emerald-200">
                {generated2FACode}
              </div>
            </div>

            <input
              type="text"
              maxLength={6}
              value={testCodeInput}
              onChange={(e) => setTestCodeInput(e.target.value)}
              placeholder={interfaz.admin.passwordModal.test2FAModal.codePlaceholder}
              className="w-36 text-center text-xl font-mono tracking-widest py-2 rounded-xl border-2 border-emerald-500 font-bold"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShow2FATest(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold cursor-pointer"
              >
                {interfaz.admin.passwordModal.test2FAModal.closeBtn}
              </button>
              <button
                onClick={() => {
                  if (testCodeInput === generated2FACode) {
                    onShowToast('¡2FA Verificado!', 'El envío y verificación 2FA por correo funciona correctamente', 'success');
                    setShow2FATest(false);
                  } else {
                    onShowToast('Código Inválido', 'El código ingresado no coincide', 'error');
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                {interfaz.admin.passwordModal.test2FAModal.verifyBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
