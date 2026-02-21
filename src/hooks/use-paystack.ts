"use client";

import { useEffect, useState } from 'react';

type PaystackConfig = {
  publicKey: string;
  email: string;
  amount: number;
  reference: string;
};

const usePaystack = (config: PaystackConfig, onSuccess: (reference: any) => void, onClose: () => void) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  const initializePayment = () => {
    if (!scriptLoaded) {
      console.error("Paystack script not yet loaded.");
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      ...config,
      onClose: onClose,
      callback: onSuccess,
    });
    handler.openIframe();
  };

  return initializePayment;
};

export default usePaystack;
