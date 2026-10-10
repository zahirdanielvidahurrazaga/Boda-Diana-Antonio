import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AdminPage from './components/AdminPage'

const esAdmin = () => window.location.hash === '#admin';

// Escucha el cambio de #admin: los enlaces "← Galería" solo cambian el hash, no recargan.
function Raiz() {
  const [admin, setAdmin] = useState(esAdmin);
  useEffect(() => {
    const alCambiar = () => { setAdmin(esAdmin()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);
  return admin ? <AdminPage /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
