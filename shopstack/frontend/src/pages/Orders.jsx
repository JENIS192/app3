import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api, money } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const { state } = useLocation();

  useEffect(() => { api('/orders').then(setOrders).catch((e) => setErr(e.message)); }, []);

  return (
    <>
      <h1>My orders</h1>
      {state?.placed && <p className="notice">Order #{state.placed} placed. Thank you!</p>}
      {err && <p className="error">{err}</p>}
      {!orders && !err && <p className="empty">Loading…</p>}
      {orders?.length === 0 && <p className="empty">No orders yet. <Link to="/">Start shopping</Link></p>}
      {orders?.map((o) => (
        <section className="order" key={o.id}>
          <header>
            <div><strong>Order #{o.id}</strong><div className="muted small-text">{new Date(o.created_at).toLocaleString()}</div></div>
            <span className={`status ${o.status}`}>{o.status}</span>
            <strong>{money(o.total)}</strong>
          </header>
          <ul>{o.items.map((i) => <li key={i.id}>{i.name} × {i.quantity}<span>{money(i.price * i.quantity)}</span></li>)}</ul>
          <p className="muted small-text">Ships to {o.shipping_name}, {o.shipping_address}</p>
        </section>
      ))}
    </>
  );
}
