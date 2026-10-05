import { Link, useNavigate } from 'react-router-dom';
import { money } from '../api';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { items, setQty, remove, total } = useCart();
  const nav = useNavigate();

  if (!items.length) return <p className="empty">Your cart is empty. <Link to="/">Browse products</Link></p>;

  return (
    <div className="two-col">
      <section>
        <h1>Your cart</h1>
        {items.map((i) => (
          <div className="line" key={i.id}>
            <img src={i.image_url} alt="" />
            <div className="grow">
              <Link to={`/product/${i.id}`}>{i.name}</Link>
              <div className="muted">{money(i.price)} each</div>
              <button className="link-btn" onClick={() => remove(i.id)}>Remove</button>
            </div>
            <div className="stepper">
              <button onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Decrease">−</button>
              <span>{i.quantity}</span>
              <button onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Increase">+</button>
            </div>
            <strong className="line-total">{money(i.price * i.quantity)}</strong>
          </div>
        ))}
      </section>
      <aside className="summary">
        <h2>Order summary</h2>
        <div className="sum-row"><span>Subtotal</span><span>{money(total)}</span></div>
        <div className="sum-row"><span>Shipping</span><span>Free</span></div>
        <div className="sum-row total"><span>Total</span><span>{money(total)}</span></div>
        <button className="btn block" onClick={() => nav('/checkout')}>Go to checkout</button>
      </aside>
    </div>
  );
}
