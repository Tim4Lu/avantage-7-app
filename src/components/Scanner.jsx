import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

const Scanner = ({ onScanSuccess, onCashbackFound }) => {
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(''); 
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const config = { 
      fps: 20, 
      qrbox: { width: 280, height: 150 }, 
      aspectRatio: 1.0,
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

            const cleanBarcode = decodedText.trim();
            setStatus(`ЗЧИТАНО: ${cleanBarcode}`);

            try {
              if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
              }
              
              setStatus('ПОШУК ТОВАРУ ТА КЕШБЕКУ...');

              // ЛОГІКА ПАРАЛЕЛЬНОГО ПОШУКУ (Крок 1)
              const [globalResponse, cashbackResult] = await Promise.all([
                // 1. Запит до всесвітньої бази
                fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`),
                
                // 2. Запит до твоєї бази кешбеку
                supabase
                  .from('cashback_codes')
                  .select('barcode')
                  .eq('barcode', cleanBarcode)
                  .maybeSingle()
              ]);

              const globalData = await globalResponse.json();
              const hasCashback = !!cashbackResult.data;

              // Формуємо дані про товар
              let productData = null;
              
              if (globalData.status === 1) {
                // Товар знайдено у глобальній базі
                productData = {
                  name: globalData.product.product_name || "Назва невідома",
                  image: globalData.product.image_url || null,
                  volume: globalData.product.quantity || "Не вказано",
                  barcode: cleanBarcode,
                  hasCashback: hasCashback
                };
              } else {
                // Товар новий (немає в глобальній базі)
                productData = { 
                  barcode: cleanBarcode, 
                  hasCashback: hasCashback, 
                  isNew: true 
                };
              }

              // Повертаємо результат (Крок 2)
              if (onCashbackFound) onCashbackFound(hasCashback);
              
              // Тепер передаємо об'єкт productData замість простого штрихкоду
              onScanSuccess(productData);

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
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-100 aspect-square overflow-hidden rounded-[2.5rem] border-4 border-av-blue bg-slate-900 shadow-2xl">
        <div id="reader" className="w-full h-full"></div>
        
        {status && (
          <div className="absolute top-4 left-4 right-4 bg-av-orange/90 text-white p-2 rounded-xl text-[10px] font-black uppercase text-center z-50 animate-pulse">
            {status}
          </div>
        )}

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