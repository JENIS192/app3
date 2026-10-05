import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [cats, setCats] = useState([]);
  const [state, setState] = useState('loading');

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  useEffect(() => { api('/products/categories', { auth: false }).then(setCats).catch(() => {}); }, []);

  useEffect(() => {
    setState('loading');
    const qs = new URLSearchParams({ page, sort, ...(search && { search }), ...(category && { category }) });
    api(`/products?${qs}`, { auth: false })
      .then((d) => { setData(d); setState('ready'); })
      .catch((e) => setState(e.message));
  }, [search, category, sort, page]);

  return (
    <>
      <section className="hero">
        <h1>Everything you need, shipped fast.</h1>
        <div className="chips">
          <button className={!category ? 'chip active' : 'chip'} onClick={() => set({ category: '' })}>All</button>
          {cats.map((c) => (
            <button key={c.category} className={category === c.category ? 'chip active' : 'chip'} onClick={() => set({ category: c.category })}>
              {c.category} <span className="muted">{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="toolbar">
        <p className="muted">{search ? `${data.total} results for "${search}"` : `${data.total} products`}</p>
        <label>Sort by{' '}
          <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {state === 'loading' && <p className="empty">Loading products…</p>}
      {state !== 'loading' && state !== 'ready' && <p className="error">{state}</p>}
      {state === 'ready' && data.items.length === 0 && <p className="empty">No products match your search. Try a different word or clear the category.</p>}
      {state === 'ready' && (
        <div className="grid">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          <button className="btn ghost small" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</button>
          <span>Page {page} of {data.pages}</span>
          <button className="btn ghost small" disabled={page >= data.pages} onClick={() => set({ page: page + 1 })}>Next</button>
        </div>
      )}
    </>
  );
}
