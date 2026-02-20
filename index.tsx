import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch React render errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          fontFamily: 'system-ui, sans-serif', 
          maxWidth: '600px', 
          margin: '2rem auto', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c',
          borderRadius: '0.5rem',
          border: '1px solid #f87171'
        }}>
          <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.25rem' }}>Something went wrong.</h2>
          <p style={{ marginBottom: '1rem' }}>The application encountered an error while rendering.</p>
          <pre style={{ 
            backgroundColor: 'rgba(255,255,255,0.5)', 
            padding: '1rem', 
            borderRadius: '0.25rem', 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration.scope);
      })
      .catch(err => {
        console.log('SW registration failed: ', err);
      });
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL ERROR: Could not find 'root' element in index.html");
  document.body.innerHTML = '<div style="color:red; padding:20px;">CRITICAL ERROR: Root element not found.</div>';
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Error mounting React application:", error);
  rootElement.innerHTML = `
    <div style="padding: 2rem; font-family: sans-serif; color: #ef4444; max-width: 600px; margin: 0 auto; text-align: center;">
      <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Startup Error</h2>
      <p style="color: #374151; margin-bottom: 1rem;">The application failed to start properly.</p>
      <pre style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; text-align: left; font-size: 0.875rem;">${error instanceof Error ? error.message : String(error)}</pre>
      <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">Check the browser console (F12) for more details.</p>
    </div>
  `;
}