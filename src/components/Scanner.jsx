import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'; // Додали формати
import { AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

const Scanner = ({ onScanSuccess, onCashbackFound }) => {
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(''); 
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    // Налаштовуємо конфіг для штрих-кодів
    const config = { 
      fps: 20, 
      qrbox: { width: 280, height: 150 }, // Прямокутник краще для штрих-кодів
      aspectRatio: 1.0,
      // Вказуємо конкретно формати, які використовуються на товарах
      formatsToSupport: [ 
        Html5QrcodeSupportedFormats.EAN_13, 
        Html5QrcodeSupportedFormats.EAN_8, 
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128
      ]
    };

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          async (decodedText) => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            // Очищаємо код від зайвих символів
            const cleanBarcode = decodedText.trim();
            setStatus(`ЗЧИТАНО: ${cleanBarcode}`);

            try {
              // Зупиняємо камеру, щоб не було повторних спрацювань
              if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
              }
              
              setStatus('ПЕРЕВІРКА КЕШБЕКУ...');

              // ПЕРЕВІРКА: додаємо .trim() і в запит
              const { data, error: sbError } = await supabase
                .from('cashback_codes')
                .select('barcode')
                .eq('barcode', cleanBarcode)
                .maybeSingle();

              if (sbError) console.error("Supabase Error:", sbError);

              const hasCashback = !!data;

              // Повертаємо результат
              if (onCashbackFound) onCashbackFound(hasCashback);
              onScanSuccess(cleanBarcode, hasCashback);

            } catch (err) {
              console.error("Scanner process error:", err);
              setStatus(`ПОМИЛКА: ${err.message}`);
              isProcessing.current = false;
            }
          }
        );
      } catch (err) {
        setError("Камера недоступна або зайнята");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Stop error:", e));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустий масив, щоб не перестворювати камеру щосекунди

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-100 aspect-square overflow-hidden rounded-[2.5rem] border-4 border-av-blue bg-slate-900 shadow-2xl">
        <div id="reader" className="w-full h-full"></div>
        
        {status && (
          <div className="absolute top-4 left-4 right-4 bg-av-orange/90 text-white p-2 rounded-xl text-[10px] font-black uppercase text-center z-50 animate-pulse">
            {status}
          </div>
        )}

        {/* Лінія сканування */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[2px] bg-av-orange shadow-[0_0_15px_#ff7900] animate-pulse z-10"></div>
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center z-20">
            <AlertCircle size={40} className="text-av-orange mb-3" />
            <p className="text-[10px] font-black uppercase">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;