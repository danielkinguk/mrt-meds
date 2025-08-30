import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: any; iconColor: string; borderColor: string }> = {
  success: {
    bg: 'bg-green-50',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  error: {
    bg: 'bg-red-50',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  info: {
    bg: 'bg-blue-50',
    icon: Info,
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  }
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const style = toastStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.borderColor} border rounded-lg shadow-lg p-4 mb-2 animate-slide-in-right flex items-start space-x-3 max-w-md`}
      role="alert"
    >
      <Icon className={`${style.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}