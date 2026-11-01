import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { PageTracker } from "./storefront/components/PageTracker";
import { StoreProvider } from "./storefront/StoreContext";

const AdminApp = lazy(() => import("./admin/AdminApp"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const CartaPage = lazy(() => import("./pages/CartaPage"));

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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <StoreProvider>
            <PageTracker />
            <Toaster />
            <Router />
          </StoreProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
