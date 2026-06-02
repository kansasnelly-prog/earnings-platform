import React, { Component, ReactNode, ErrorInfo } from "react";

/**
 * Global error boundary that catches rendering errors in production.
 * Displays a friendly fallback UI and logs error details.
 */
export interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
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