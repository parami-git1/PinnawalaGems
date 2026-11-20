import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';
import WhatsAppWidget from './WhatsAppWidget';
import NotFound from './NotFound';
import { useRemoteResource } from './hooks/useRemoteResource';
import { warmPageHero } from './pageHeroWarmup';
import { AdminBoundary, AdminProtectedRoute } from './AdminAccess';
import { ADMIN_LOGIN_PATH, ADMIN_PORTAL_PATH } from './adminPaths';

const AdminInventory = lazy(() => import('./AdminInventory'));
const Home = lazy(() => import('./Home'));
const CategoryView = lazy(() => import('./CategoryView'));
const Contact = lazy(() => { warmPageHero('/contact', 'high'); return import('./Contact'); });
const Feedback = lazy(() => { warmPageHero('/feedback', 'high'); return import('./Feedback'); });
const GemDetails = lazy(() => import('./GemDetails'));
const Login = lazy(() => import('./Login'));
const Workshop = lazy(() => import('./Workshop'));

const Catalog = CategoryView;

export function PublicLayout() {
  const { pathname } = useLocation();
  const home = useRemoteResource('home');
  const categoriesResource = useRemoteResource('inventory/categories');
  return (
    <>
      <Navbar categories={categoriesResource.data} />
      <Suspense fallback={<main className="route-loading" role="status">Opening Pinnawala Gems…</main>}>
        <Outlet context={{ home, categoriesResource }} />
      </Suspense>
      {pathname === '/' && <WhatsAppWidget contactData={home.data || {}} />}
      <Footer contactData={home.data || {}} />
    </>
  );
}

function RouteScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <>
      <RouteScroll />
      <Suspense fallback={<main className="route-loading" role="status">Opening Pinnawala Gems…</main>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/collection" element={<Catalog />} />
          <Route path="/collections/:categorySlug" element={<Catalog />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/category/:categoryId" element={<CategoryView />} />
          <Route path="/gem/:stoneId" element={<GemDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<AdminBoundary />}>
          <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path={`${ADMIN_PORTAL_PATH}/*`} element={<AdminInventory />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
