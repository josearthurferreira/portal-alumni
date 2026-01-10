import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './ErrorBanner.module.css';

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <AlertCircle size={20} className={styles.icon} />
        <span className={styles.message}>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar erro">
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
