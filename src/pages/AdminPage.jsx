import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const AdminDashboardModule = lazy(() => import('../components/admin/AdminDashboardModule'));

class CommandCenterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl dark:border-rose-900/50 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">Command Center recovered from an error</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{this.state.error.message || 'An unexpected dashboard error occurred.'}</p>
            <button type="button" onClick={() => this.setState((current) => ({ error: null, resetKey: current.resetKey + 1 }))} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Reload Command Center</button>
          </div>
        </div>
      );
    }

    return React.cloneElement(this.props.children, { key: this.state.resetKey });
  }
}

export default function AdminPage(props) {
  return (
    <CommandCenterErrorBoundary>
      <Suspense fallback={(
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-indigo-600 dark:bg-slate-950">
          <Loader2 className="animate-spin" size={32} aria-label="Loading admin dashboard" />
        </div>
      )}>
        <AdminDashboardModule {...props} />
      </Suspense>
    </CommandCenterErrorBoundary>
  );
}
