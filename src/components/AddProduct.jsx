import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BadgeCheck, Save, Globe, CheckSquare, Square, Beaker, ShieldCheck, XCircle, PlusCircle, Image as ImageIcon } from 'lucide-react';

const AddProduct = ({ initialBarcode, onSave, onOpenGlobalModal }) => {
  // Розпаковка даних від сканера
  const isObj = typeof initialBarcode === 'object' && initialBarcode !== null;
  const barcodeStr = isObj ? initialBarcode.barcode : (initialBarcode || '');
  const initialName = isObj ? initialBarcode.name : '';
  const initialImg = isObj ? initialBarcode.image : '';
  const initialVol = isObj ? initialBarcode.volume : '';
  const initialCB = isObj ? initialBarcode.hasCashback : false;

  const [barcode] = useState(barcodeStr);
  const [isCashback] = useState(initialCB);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isCarlsberg, setIsCarlsberg] = useState(false);

  const [foundProduct, setFoundProduct] = useState(initialName ? {
    name: initialName,
    image: initialImg,
    volume: initialVol,
    source: 'scanner'
  } : null);

  useEffect(() => {
    if (barcode && !initialName) {
      findProductDetails(barcode);
    }
  }, [barcode, initialName]);

  const findProductDetails = async (code) => {
    setSearching(true);
    try {
      const { data: pData } = await supabase.from('products').select('*').eq('barcode', code).limit(1).maybeSingle();
      if (pData) {
        setFoundProduct({ ...pData, source: 'local' });
        setIsCarlsberg(!!pData.is_carlsberg);
      } else {
        await searchGlobalApi(code);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setSearching(false);
    }
  };

  const searchGlobalApi = async (code) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const apiData = await response.json();
      if (apiData.status === 1) {
        setFoundProduct({
          name: apiData.product.product_name || "Товар без назви",
          image: apiData.product.image_url,
          volume: apiData.product.quantity || "Не вказано",
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
    if (e) e.preventDefault();
    if (!barcode || !foundProduct?.name || !expiryDate) return alert("Заповніть дату!");

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          barcode: String(barcode),
          name: foundProduct.name,
          expiry_date: expiryDate,
          is_carlsberg: isCarlsberg,
          is_cashback: Boolean(isCashback)
        }]);

      if (error) throw error;
      alert("✅ Термін успішно записано!");
      if (onSave) onSave();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-2 pt-1 pb-4 px-4">
      
      <div className="w-full h-8 flex items-center justify-center">
        {isCashback && (
          <div className="flex items-center gap-1.5 bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full border border-blue-100 animate-pulse">
            <BadgeCheck size={12} />
            <span className="font-black text-[8px] uppercase">Національний кешбек</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-av border border-slate-50 space-y-4">
        
        {/* Фото товару */}
        <div className="w-full h-36 bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 flex items-center justify-center relative">
          {foundProduct?.image ? (
            <img src={foundProduct.image} alt="Product" className="w-full h-full object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-300">
              <ImageIcon size={28} />
              <span className="text-[7px] font-black uppercase tracking-tighter">Немає фото</span>
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[7px] font-black text-av-blue border border-slate-100 shadow-sm">
            {String(barcode)}
          </div>
        </div>

        {/* Опис товару */}
        <div className="space-y-1.5">
          <h3 className="font-black text-av-blue text-sm uppercase leading-tight line-clamp-2 text-center">
            {searching ? "АНАЛІЗ..." : (foundProduct?.name || "НЕВІДОМИЙ ТОВАР")}
          </h3>
          
          {/* ПЛЮСИК: З'являється ТІЛЬКИ якщо товар не знайдено і пошук завершено */}
          {!foundProduct && !searching && (
             <div className="flex flex-col items-center gap-2 mt-2">
               <span className="text-[8px] font-bold text-slate-400 uppercase">Товар відсутній у базах</span>
               <button 
                 onClick={() => onOpenGlobalModal(barcode)}
                 className="flex items-center gap-2 px-4 py-2 bg-av-orange text-white rounded-xl shadow-lg active:scale-95 transition-all animate-bounce"
               >
                 <PlusCircle size={20} />
                 <span className="text-[10px] font-black uppercase">Додати товар</span>
               </button>
             </div>
          )}
          
          <div className="flex items-center justify-center gap-3">
            {foundProduct?.volume && (
              <div className="flex items-center gap-1 text-av-orange font-black text-[8px] uppercase">
                <Beaker size={10} /> {foundProduct.volume}
              </div>
            )}
            {foundProduct && (
              <div className="flex items-center gap-1 text-slate-400 font-black text-[8px] uppercase">
                <Globe size={10} className="text-blue-400" /> {foundProduct?.source === 'world' ? 'Global' : 'My DB'}
              </div>
            )}
          </div>

          <div className={`mt-2 py-2 rounded-xl flex items-center justify-center gap-2 border ${isCashback ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
            {isCashback ? (
              <>
                <ShieldCheck size={14} />
                <span className="font-black text-[9px] uppercase tracking-wider">Кешбек підтверджено</span>
              </>
            ) : (
              <>
                <XCircle size={14} className="opacity-30" />
                <span className="font-black text-[9px] uppercase tracking-wider opacity-60">Без кешбеку</span>
              </>
            )}
          </div>
        </div>

        {/* Carlsberg */}
        <button 
          type="button"
          onClick={() => setIsCarlsberg(!isCarlsberg)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isCarlsberg ? 'border-av-orange bg-orange-50' : 'border-slate-50 bg-white'}`}
        >
          <div className="flex items-center gap-2">
            {isCarlsberg ? <CheckSquare className="text-av-orange" size={16} /> : <Square className="text-slate-200" size={16} />}
            <span className={`text-[8px] font-black uppercase ${isCarlsberg ? 'text-av-orange' : 'text-slate-400'}`}>Продукція Carlsberg (55д)</span>
          </div>
        </button>

        {/* Дата */}
        <div className="space-y-1">
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-av-blue outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !foundProduct || !expiryDate}
          className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${
            !foundProduct || !expiryDate 
            ? 'bg-slate-100 text-slate-300' 
            : 'bg-av-blue text-white shadow-lg active:scale-95'
          }`}
        >
          {loading ? 'ЗАПИС...' : <><Save size={14} /> ЗАПИСАТИ ТЕРМІН</>}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;