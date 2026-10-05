'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) document.cookie = `comerza_token=${data.token}; path=/; max-age=86400`;
        router.push(data.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
      } else {
        setErrorMsg(data.message || 'El correo o la contraseña no son correctos.');
      }
    } catch {
      setErrorMsg('No pudimos conectarnos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Revisa tu correo — enviamos un enlace de acceso.');
        setTimeout(() => { setIsForgotPassword(false); setSuccessMsg(''); setPassword(''); }, 6000);
      } else {
        setErrorMsg(data.message || 'No encontramos esa cuenta.');
      }
    } catch {
      setErrorMsg('No pudimos conectarnos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* Left Panel: The Form */}
        <div className="login-left">
          <div className="login-logo-mark">
            <span className="login-logo-text">COMER<span>ZA</span></span>
          </div>

          <div className="login-card-header">
            <h1 className="login-card-title">
              {isForgotPassword ? 'Recuperar acceso' : 'LOGIN'}
            </h1>
            <p className="login-card-subtitle">
              {isForgotPassword
                ? 'Ingresa tu correo para recibir las instrucciones de recuperación.'
                : '¿Cómo empiezo? Ingresa tus credenciales aquí.'}
            </p>
          </div>

          {isForgotPassword ? (
            <form className="login-form" onSubmit={handleForgotPassword}>
              <div className="login-input-group">
                <label className="login-label" htmlFor="email-forgot">Correo electrónico</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    id="email-forgot"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && <div className="login-error">{errorMsg}</div>}
              {successMsg && <div className="login-success">{successMsg}</div>}

              <button className="login-btn" type="submit" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                  : 'Enviar enlace'}
              </button>

              <button type="button" className="login-back-btn"
                onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }}>
                ← Volver al login
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-input-group">
                <label className="login-label" htmlFor="email">Usuario / Correo</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    id="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Usuario"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="password">Contraseña</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Lock size={18} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="login-eye-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-forgot-row">
                <span />
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(''); }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {errorMsg && <div className="login-error">{errorMsg}</div>}

              <button className="login-btn" type="submit" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Cargando...</>
                  : 'Login Now'}
              </button>
            </form>
          )}
        </div>

        {/* Right Panel: The Illustration */}
        <div className="login-right">
          <div className="login-shape-1"></div>
          <div className="login-shape-2"></div>
          
          <div className="login-glass-panel">
            {/* The little yellow zap badge from the reference */}
            <div className="login-badge">
              <Zap size={24} fill="#fbbf24" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/login-illustration.jpg" 
              alt="Dashboard Illustration" 
              className="login-illustration"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
