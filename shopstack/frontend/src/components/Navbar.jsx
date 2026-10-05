import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const [q, setQ] = useState('');

  const search = (e) => {
    e.preventDefault();
    nav(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : '/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">{import.meta.env.VITE_APP_NAME || 'Kart'}</Link>
        <form onSubmit={search} className="search" role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
          <button type="submit">Search</button>
        </form>
        <nav className="links">
          <NavLink to="/cart">Cart{count > 0 && <span className="badge">{count}</span>}</NavLink>
          {user ? (
            <>
              <NavLink to="/orders">My orders</NavLink>
              <button className="link-btn" onClick={() => { logout(); nav('/'); }}>Log out ({user.name.split(' ')[0]})</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn small">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
