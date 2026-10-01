'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
    setSuccessMsg('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirigir según el rol
        if (data.user?.role === 'SUPERADMIN') {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setErrorMsg(data.message || 'El correo o la contraseña no son correctos.');
      }
    } catch (error) {
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
        setSuccessMsg(data.message || 'Te hemos enviado instrucciones a tu correo.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccessMsg('');
          setPassword('');
        }, 5000);
      } else {
        setErrorMsg(data.message || 'Error al restablecer la contraseña.');
      }
    } catch (error) {
      setErrorMsg('No pudimos conectarnos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      
      <div className="login-brand-panel">
        <div>
          <div className="login-logo">COMERZA</div>
        </div>
        <div className="login-brand-text">
          Tu negocio,<br />
          en un solo lugar.
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-container">
          
          <h1 className="login-title">
            {isForgotPassword ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h1>
          
          {isForgotPassword ? (
            <form className="login-form" onSubmit={handleForgotPassword}>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '-1rem' }}>
                Ingresa tu correo electrónico y te enviaremos instrucciones para acceder.
              </p>

              <div className="input-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="login-input-wrapper">
                  <input 
                    type="email" 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com" 
                    required 
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="form-message error">{errorMsg}</div>
              )}
              
              {successMsg && (
                <div className="form-message success">{successMsg}</div>
              )}

              <button className="login-submit-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                ) : (
                  'Enviar instrucciones'
                )}
              </button>

              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#111827', fontSize: '0.875rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleLogin}>
              
              <div className="input-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="login-input-wrapper">
                  <input 
                    type="email" 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com" 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label htmlFor="password">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="forgot-password-link"
                    tabIndex={-1}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="login-input-wrapper">
                  <input 
                    className="has-icon"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="form-message error">{errorMsg}</div>
              )}

              <button className="login-submit-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Iniciando sesión...</>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
