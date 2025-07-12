import { useState, useEffect, useCallback } from 'react';
import { api } from '../config/api';

interface PaymentStatusData {
  payment_id: string;
  status: string;
  paid_at?: string;
  qr_code?: string;
  pix_code?: string;
  amount: number;
  expires_at: string;
}

interface UsePaymentStatusReturn {
  paymentData: PaymentStatusData | null;
  isLoading: boolean;
  error: string | null;
  checkPaymentStatus: (paymentId: string) => Promise<void>;
  startPolling: (paymentId: string, interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export const usePaymentStatus = (): UsePaymentStatusReturn => {
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.subscription.getPaymentStatus(paymentId);
      
      if (response.success) {
        setPaymentData(response.data);
        
        // Se o pagamento foi aprovado, parar o polling
        if (response.data.status === 'approved') {
          stopPolling();
        }
      } else {
        throw new Error('Failed to fetch payment status');
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err.response?.data?.message || 'Erro ao verificar status do pagamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback((paymentId: string, interval: number = 5000) => {
    // Parar polling anterior se existir
    stopPolling();
    
    setIsPolling(true);
    
    // Primeira verificação imediata
    checkPaymentStatus(paymentId);
    
    // Configurar polling
    const intervalId = setInterval(() => {
      checkPaymentStatus(paymentId);
    }, interval);
    
    setPollingInterval(intervalId);
  }, [checkPaymentStatus]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
  }, [pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    paymentData,
    isLoading,
    error,
    checkPaymentStatus,
    startPolling,
    stopPolling,
    isPolling
  };
}; 