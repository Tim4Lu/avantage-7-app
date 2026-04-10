import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BadgeCheck, Save, XCircle, PlusCircle, Globe } from 'lucide-react';

// ВИПРАВЛЕНО: Додано initialCashback у пропси
const AddProduct = ({ initialBarcode, initialCashback, onSave }) => {
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [foundProduct, setFoundProduct] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  
  // ВИПРАВЛЕНО: Стейт ініціалізується даними зі сканера
  const [isCashback, setIsCashback] = useState(initialCashback || false);
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Якщо код прийшов зі сканера, не треба перевіряти його ще раз
    if (barcode && barcode.length >= 8) {
      if (barcode !== initialBarcode) {
         // Шукаємо тільки якщо це ручне введення (код відрізняється від початкового)
         checkBarcode(barcode);
      } else {
         // Якщо зі сканера, шукаємо тільки назву, бо кешбек вже перевірено
         findProductNameOnly(barcode);
      }
    } else {
      setFoundProduct(null);
      setIsCashback(false);
    }
  }, [barcode, initialBarcode]);

  // Спрощений пошук назви, коли кешбек вже відомий
  const findProductNameOnly = async (code) => {
    setSearching(true);
    const { data: pData } = await supabase.from('products').select('name, is_carlsberg').eq('barcode', code).limit(1).maybeSingle();
    
    if (pData) {
      setFoundProduct({ ...pData, source: 'local' });
    } else {
      await searchGlobalApi(code);
    }
    setSearching(false);
  };

  const checkBarcode = async (code) => {
    setSearching(true);
    
    // ВИПРАВЛЕНО: Повертаємо пошук через Supabase. Браузер заблокує запит на ubf.gov.ua
    const { data: cbData } = await supabase.from('cashback_codes').select('barcode').eq('barcode', code).maybeSingle();
    setIsCashback(!!cbData);

    const { data: pData } = await supabase.from('products').select('name, is_carlsberg').eq('barcode', code).limit(1).maybeSingle();

    if (pData) {
      setFoundProduct({ ...pData, source: 'local' });
    } else {
      await searchGlobalApi(code);
    }
    setSearching(false);
  };

  const searchGlobalApi = async (code) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const apiData = await response.json();
      if (apiData.status === 1) {
        setFoundProduct({
          name: apiData.product.product_name || apiData.product.generic_name || "Товар без назви",
          is_carlsberg: false,
          source: 'world'
        });
      } else {
        setFoundProduct(null);
      }
    } catch (err) {
      setFoundProduct(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!barcode || !expiryDate || !foundProduct) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert([{
        barcode,
        name: foundProduct.name,
        expiry_date: expiryDate,
        is_carlsberg: foundProduct.is_carlsberg,
        is_cashback: isCashback
      }]);

      if (error) throw error;
      onSave();
    } catch (err) {
      alert("Помилка при збереженні");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="w-full h-16 flex items-center justify-center text-center">
        {isCashback && (
          <div className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 animate-bounce">
            <BadgeCheck size={20} className="text-yellow-400" />
            <span className="font-black text-[12px] uppercase">Національний Кешбек 10%</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-av border border-slate-100 space-y-6">
        <div>
          <label className="block text-[10px] font-black text-av-blue uppercase tracking-widest mb-2 ml-2">Штрих-код</label>
          <div className="relative">
            <input
              type="number"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-av-blue outline-none focus:border-av-orange transition-all"
              placeholder="00000000"
            />
            {barcode && (
              <button type="button" onClick={() => {setBarcode(''); setIsCashback(false);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <XCircle size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-[90px] flex items-center justify-center p-4 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 transition-all">
          {searching ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-tighter text-center">
                Шукаю товар...
              </span>
            </div>
          ) : foundProduct ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {foundProduct.source === 'world' && <Globe size={12} className="text-blue-500" />}
                <h4 className="text-av-blue font-black uppercase text-sm leading-tight">
                  {foundProduct.name}
                </h4>
              </div>
              <span className="text-[8px] font-black opacity-40 uppercase">
                {foundProduct.source === 'world' ? 'Знайдено в мережі' : 'Твій товар'}
              </span>
            </div>
          ) : barcode.length >= 8 ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 uppercase">Товар не знайдено ніде</span>
              <button type="button" className="flex items-center gap-2 bg-av-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95">
                <PlusCircle size={14} /> Створити картку
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Чекаю код...</span>
          )}
        </div>

        <div className={!foundProduct ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}>
          <label className="block text-[10px] font-black text-av-blue uppercase tracking-widest mb-2 ml-2">Вжити до (Дата)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-av-blue outline-none focus:border-av-orange transition-all"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !foundProduct || !expiryDate}
          className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
            !foundProduct || !expiryDate 
            ? 'bg-slate-100 text-slate-300' 
            : 'bg-av-blue text-white shadow-xl shadow-blue-100 active:scale-95'
          }`}
        >
          {loading ? 'Записую...' : <><Save size={20} /> Записати термін</>}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;