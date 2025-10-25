
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastMessage } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';

type ToastContextType = (message: string, type: ToastMessage['type']) => void;

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const typeStyles = {
    success: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-300',
        icon: <CheckCircleIcon className="text-green-400" />,
    },
    error: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-300',
        icon: <ExclamationCircleIcon className="text-red-400" />,
    },
    info: {
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/50',
        text: 'text-cyan-300',
        icon: <InformationCircleIcon className="text-cyan-400" />,
    },
};

const Toast: React.FC<{ toast: ToastMessage, onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
        }, 3000); // 3-second duration

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    const styles = typeStyles[toast.type];
    const animationClasses = isExiting
        ? 'opacity-0 translate-x-full'
        : 'opacity-100 translate-x-0';

    return (
        <div 
            role="alert"
            aria-live="assertive"
            className={`w-80 max-w-sm p-4 rounded-lg shadow-2xl flex items-start gap-3 border transition-all duration-300 ease-in-out backdrop-blur-md ${styles.bg} ${styles.border} ${animationClasses}`}
        >
            <div className="flex-shrink-0 w-6 h-6">{styles.icon}</div>
            <p className={`flex-1 text-sm font-semibold ${styles.text}`}>{toast.message}</p>
            <button 
                onClick={handleDismiss} 
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
            >
                <XMarkIcon />
            </button>
        </div>
    );
};


export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
        const id = Date.now().toString() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);
    
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {isMounted && createPortal(
                <div className="fixed top-6 right-6 z-[9999] space-y-3">
                    {toasts.map(toast => (
                        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
