import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(err) {
    console.error('UI crash:', err);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="card mx-auto mt-16 max-w-md p-8 text-center">
          <p className="text-lg font-bold text-ink-950">Something went wrong</p>
          <p className="mt-1 text-sm text-slate-500">The page hit an unexpected error. Your data is safe.</p>
          <button onClick={() => window.location.assign('/')} className="btn-primary mt-5">
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
