'use client';

import { useEffect, useState } from 'react';
import toast from '@/lib/utils/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState(toast.getAll());

  useEffect(() => {
    return toast.subscribe(() => {
      setToasts(toast.getAll());
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-slide-in ${
            t.type === 'success'
              ? 'bg-green-900/90 border-green-700 text-green-100'
              : t.type === 'error'
              ? 'bg-red-900/90 border-red-700 text-red-100'
              : t.type === 'warning'
              ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
              : 'bg-blue-900/90 border-blue-700 text-blue-100'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {t.title && (
                <div className="font-semibold mb-1">{t.title}</div>
              )}
              <div className="text-sm">{t.description}</div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
