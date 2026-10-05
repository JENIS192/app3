import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password); else await register(f.name, f.email, f.password);
      nav(state?.from || '/', { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="form narrow">
      <h1>{isLogin ? 'Log in' : 'Create your account'}</h1>
      {!isLogin && <label>Full name<input value={f.name} onChange={on('name')} required /></label>}
      <label>Email<input type="email" value={f.email} onChange={on('email')} required /></label>
      <label>Password<input type="password" value={f.password} onChange={on('password')} minLength={isLogin ? undefined : 8} required />
        {!isLogin && <span className="muted small-text">At least 8 characters</span>}
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}</button>
      <p className="muted">{isLogin ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Log in</Link></>}</p>
    </form>
  );
}
