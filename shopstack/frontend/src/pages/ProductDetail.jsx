import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');

  useEffect(() => { api(`/products/${id}`, { auth: false }).then(setP).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <p className="error">{err}</p>;
  if (!p) return <p className="empty">Loading…</p>;

  return (
    <div className="detail">
      <img src={p.image_url} alt={p.name} />
      <div>
        <span className="muted">{p.category}</span>
        <h1>{p.name}</h1>
        <p className="price">{money(p.price)}</p>
        <p>{p.description}</p>
        <p className={p.stock > 0 ? 'ok' : 'out'}>{p.stock > 0 ? (p.stock <= 10 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</p>
        {p.stock > 0 && (
          <div className="row">
            <input type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(p.stock, Number(e.target.value) || 1)))} aria-label="Quantity" className="qty" />
            <button className="btn" onClick={() => add(p, qty)}>Add to cart</button>
            <button className="btn ghost" onClick={() => { add(p, qty); nav('/cart'); }}>Buy now</button>
          </div>
        )}
      </div>
    </div>
  );
}
