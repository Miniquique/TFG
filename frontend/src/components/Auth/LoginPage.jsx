import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', password: '' });

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('¡Bienvenido de vuelta!');
        navigate('/');
      } else {
        if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
        await register(form.name, form.email, form.password);
        toast.success('¡Cuenta creada con éxito!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Panel izquierdo decorativo */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoMark}>
            <Leaf size={28} />
          </div>
          <h1 className={styles.heroTitle}>SmartFoodAI</h1>
          <p className={styles.heroSubtitle}>
            Gestiona tu despensa, controla tus macros y genera menús semanales con inteligencia artificial.
          </p>
          <div className={styles.features}>
            {['📸 Escanea tu lista de la compra', '🥗 Genera menús con IA', '📊 Controla tus calorías diarias', '🥦 Gestiona tu despensa'].map((f) => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
        <div className={styles.heroDecor} />
      </div>

      {/* Formulario */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.logoSmall}><Leaf size={20} /></div>
            <h2 className={styles.formTitle}>
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === 'login' ? 'Accede a tu panel SmartFoodAI' : 'Únete a SmartFoodAI gratis'}
            </p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label className="label">Nombre</label>
                <input className="input" name="name" placeholder="Tu nombre" value={form.name} onChange={handle} required />
              </div>
            )}
            <div className={styles.field}>
              <label className="label">Email</label>
              <input className="input" name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label className="label">Contraseña</label>
              <div className={styles.pwWrap}>
                <input
                  className="input"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  required
                  minLength={6}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <span className="spinner" /> : mode === 'login' ? <><LogIn size={16} /> Entrar</> : <><UserPlus size={16} /> Registrarse</>}
            </button>
          </form>

          <div className={styles.switchMode}>
            {mode === 'login' ? (
              <p>¿No tienes cuenta? <button onClick={() => setMode('register')}>Regístrate gratis</button></p>
            ) : (
              <p>¿Ya tienes cuenta? <button onClick={() => setMode('login')}>Iniciar sesión</button></p>
            )}
          </div>

          {mode === 'login' && (
            <div className={styles.demoHint}>
              <strong>Demo admin:</strong> admin@smartfoodai.com / 123456
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
