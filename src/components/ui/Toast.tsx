import { useToastStore } from '../../stores/toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />
  };

  const colors = {
    success: 'border-success/30 text-success',
    error: 'border-destructive/30 text-destructive',
    info: 'border-primary/30 text-primary'
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${colors[toast.type]} flex min-w-[280px] items-center gap-3 rounded-md border bg-surface px-3 py-2 text-[13px] animate-fadeIn`}
        >
          {icons[toast.type]}
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
