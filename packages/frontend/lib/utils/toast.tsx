import { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string | ReactNode;
  duration?: number;
  type?: ToastType;
}

class ToastManager {
  private toasts: Map<string, ToastOptions & { id: string }> = new Map();
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  show(options: ToastOptions) {
    const id = Math.random().toString(36).slice(2);
    const toast = { ...options, id };
    this.toasts.set(id, toast);
    this.notify();

    // Auto-dismiss after duration
    const duration = options.duration || 5000;
    setTimeout(() => this.dismiss(id), duration);

    return id;
  }

  dismiss(id: string) {
    this.toasts.delete(id);
    this.notify();
  }

  getAll() {
    return Array.from(this.toasts.values());
  }

  success(description: string | ReactNode, title?: string) {
    return this.show({ type: 'success', title, description });
  }

  error(description: string | ReactNode, title?: string) {
    return this.show({ type: 'error', title, description });
  }

  info(description: string | ReactNode, title?: string) {
    return this.show({ type: 'info', title, description });
  }

  warning(description: string | ReactNode, title?: string) {
    return this.show({ type: 'warning', title, description });
  }
}

export const toast = new ToastManager();
export default toast;
