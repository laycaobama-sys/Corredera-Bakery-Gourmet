import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          role="alert"
          className="flex items-center justify-center min-h-screen p-8 bg-[#f5f2ed] text-[#26221e]"
        >
          <div className="flex flex-col items-center w-full max-w-xl p-8 border border-[#d8d1c7] bg-[#faf8f4] text-center">
            <AlertTriangle
              size={40}
              className="text-[#b8774c] mb-5 flex-shrink-0"
              aria-hidden="true"
            />

            <h1 className="text-2xl font-serif mb-2">
              Ha ocurrido un error inesperado · Something went wrong
            </h1>

            <p className="text-sm text-[#7d766d] mb-6 max-w-md leading-relaxed">
              No hemos podido cargar esta vista correctamente. Por favor, vuelve a intentarlo o recarga la página.
            </p>

            {isDev && this.state.error?.stack && (
              <div className="p-4 w-full rounded bg-[#2d241e] text-[#f5f2ed] overflow-auto mb-6 text-left max-h-60">
                <pre className="text-xs whitespace-break-spaces">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="cg-btn cg-btn--outline"
              >
                Reintentar · Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cg-btn cg-btn--primary"
              >
                <RotateCcw size={15} />
                Recargar · Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
