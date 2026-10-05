import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, money } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const nav = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!items.length) return <p className="empty">Nothing to check out. <Link to="/">Browse products</Link></p>;

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await api('/orders', {
        method: 'POST',
        body: { items: items.map(({ id, quantity }) => ({ id, quantity })), shipping_name: name, shipping_address: address },
      });
      clear();
      nav('/orders', { state: { placed: r.id } });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="two-col">
      <form onSubmit={submit} className="form">
        <h1>Shipping details</h1>
        <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Delivery address<textarea rows="4" value={address} onChange={(e) => setAddress(e.target.value)} required /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Placing order…' : `Place order · ${money(total)}`}</button>
        <p className="muted small-text">Payment is collected on delivery.</p>
      </form>
      <aside className="summary">
        <h2>Items</h2>
        {items.map((i) => <div className="sum-row" key={i.id}><span>{i.name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>)}
        <div className="sum-row total"><span>Total</span><span>{money(total)}</span></div>
      </aside>
    </div>
  );
}
