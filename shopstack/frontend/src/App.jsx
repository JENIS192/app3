import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
          <Route path="/orders" element={<Protected><Orders /></Protected>} />
          <Route path="*" element={<p className="empty">That page doesn't exist. <a href="/">Back to the shop</a></p>} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Kart'}</footer>
    </>
  );
}
