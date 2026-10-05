import { Link } from 'react-router-dom';
import { money } from '../api';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ p }) {
  const { add } = useCart();
  return (
    <article className="card">
      <Link to={`/product/${p.id}`} className="card-img"><img src={p.image_url} alt={p.name} loading="lazy" /></Link>
      <div className="card-body">
        <span className="muted small-text">{p.category}</span>
        <Link to={`/product/${p.id}`} className="card-title">{p.name}</Link>
        <div className="card-foot">
          <strong>{money(p.price)}</strong>
          {p.stock > 0
            ? <button className="btn small" onClick={() => add(p)}>Add to cart</button>
            : <span className="out">Out of stock</span>}
        </div>
      </div>
    </article>
  );
}
