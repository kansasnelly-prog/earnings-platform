import React, { Component, ErrorInfo, ReactNode } from "react";

/**
 * Global error boundary that catches rendering errors in production.
 * It displays a friendly fallback UI and logs the error details to the console.
 * This aligns with the requirement to surface real error messages instead of a blank screen.
 */
export class ErrorBoundary extends Component<
  { fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an external service here.
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state as any;
    if (hasError) {
      // Use the provided fallback or a default UI.
      return (
        this.props.fallback || (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#ef4444",
            fontFamily: "Arial, sans-serif",
          }}>
            <h2>Something went wrong.</h2>
            {error && <pre>{error.message}</pre>}
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;