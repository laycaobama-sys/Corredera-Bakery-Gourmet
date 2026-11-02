import NotFound from "@/pages/NotFound";
import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import CartaPage from "./pages/CartaPage";
import CategoryPage from "./pages/CategoryPage";
import Home from "./pages/Home";
import ProductDetailPage from "./pages/ProductDetailPage";
import ShopPage from "./pages/ShopPage";
import { PageTracker } from "./storefront/components/PageTracker";
import { StoreProvider } from "./storefront/StoreContext";

// Shop pages are a few KB each and ship with the main bundle, so every page opens without waiting for
// another download. Only the owner panel (charts, forms) is loaded on demand.
const AdminApp = lazy(() => import("./admin/AdminApp"));

function PageFallback() {
  return (
    <div className="cg-loading" role="status">
      <img src="/assets/brand/corredera-emblem.png" alt="" width={74} height={88} />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tienda" component={ShopPage} />
        <Route path="/gourmet/:slug">{(params) => <CategoryPage slug={params.slug} />}</Route>
        <Route path="/bakery-cafe" component={CartaPage} />
        <Route path="/producto/:id">{(params) => <ProductDetailPage productId={params.id} />}</Route>
        <Route path="/admin">{() => <AdminApp />}</Route>
        <Route path="/admin/:section">{(params) => <AdminApp section={params.section} />}</Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <PageTracker />
        <Router />
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
