import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastConfig = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          duration: 3000,
          style: {
            background: '#059669',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#059669',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
          },
        },
      }}
    />
  );
};

export default ToastConfig;
