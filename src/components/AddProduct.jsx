import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BadgeCheck, Save, Globe, CheckSquare, Square, Beaker, ShieldCheck, XCircle, PlusCircle, Image as ImageIcon, Camera } from 'lucide-react';

const AddProduct = ({ initialBarcode, onSave, onOpenGlobalModal }) => {
  const isObj = typeof initialBarcode === 'object' && initialBarcode !== null;
  const barcodeStr = isObj ? initialBarcode.barcode : (initialBarcode || '');
  const initialName = isObj ? initialBarcode.name : '';
  const initialImg = isObj ? initialBarcode.image : '';
  const initialVol = isObj ? initialBarcode.volume : '';
  const initialCB = isObj ? initialBarcode.hasCashback : false;

  const [quantity, setQuantityUnits] = useState('1'); 
  const [barcode] = useState(barcodeStr);
  const [isCashback, setIsCashback] = useState(initialCB);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isCarlsberg, setIsCarlsberg] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [foundProduct, setFoundProduct] = useState(initialName ? {
    name: initialName, image: initialImg, volume: initialVol, source: 'scanner'
  } : null);

  useEffect(() => {
    if (barcode && !initialName) findProductDetails(barcode);
  }, [barcode, initialName]);

  useEffect(() => {
    if (isObj && initialBarcode.hasCashback !== undefined) {
      setIsCashback(initialBarcode.hasCashback);
    }
  }, [initialBarcode]);

  const findProductDetails = async (code) => {
    setSearching(true);
    const searchCode = String(code).trim();
    try {
      const [localRes, cashbackRes] = await Promise.all([
        supabase.from('products').select('*').eq('barcode', searchCode).maybeSingle(),
        supabase.from('cashback_codes').select('*').eq('barcode', searchCode)
      ]);
      
      const hasCB = !!(cashbackRes.data && cashbackRes.data.length > 0);
      setIsCashback(hasCB);

      if (localRes.data) {
        setFoundProduct({ ...localRes.data, source: 'local' });
        setIsCarlsberg(!!localRes.data.is_carlsberg);
      } else {
        await searchGlobalApi(searchCode);
      }
    } catch (err) { console.error(err); } finally { setSearching(false); }
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
      }
    } catch (err) { setFoundProduct(null); }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const fileName = `${Date.now()}_prod.jpg`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) { return null; }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!barcode || !foundProduct?.name || !expiryDate) return alert("Заповніть дату!");
    setLoading(true);
    try {
      let finalImageUrl = foundProduct.image;
      if (photo) {
        const uploadedUrl = await uploadImage(photo);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }
      const { error } = await supabase.from('products').upsert({
        barcode: String(barcode),
        name: foundProduct.name,
        expiry_date: expiryDate,
        quantity: Number(quantity) || 1,
        image: finalImageUrl, 
        volume: foundProduct.volume,
        is_carlsberg: isCarlsberg,
        is_cashback: isCashback
      }, { onConflict: 'barcode' });
      if (error) throw error;
      onSave();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto space-y-2 pt-1 pb-4 px-4">
      <div className="bg-white rounded-[2rem] p-6 shadow-av border border-slate-50 space-y-4 font-sans">
        <div className="w-full h-36 bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 flex items-center justify-center relative">
          {foundProduct?.image || photo ? (
            <img src={photo ? URL.createObjectURL(photo) : foundProduct.image} className="w-full h-full object-contain p-2" alt="Product" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-300"><ImageIcon size={28} /><span className="text-[7px] font-black uppercase">Немає фото</span></div>
          )}
          <label className="absolute top-2 right-2 bg-white/90 p-2 rounded-full border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform"><Camera size={16} className="text-av-blue" /><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} /></label>
          <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-0.5 rounded-md text-[7px] font-black text-av-blue border border-slate-100 shadow-sm">{barcode}</div>
        </div>
        <div className="space-y-1.5 text-center">
          <h3 className="font-black text-av-blue text-sm uppercase leading-tight line-clamp-2">{searching ? "АНАЛІЗ..." : (foundProduct?.name || "НЕВІДОМИЙ ТОВАР")}</h3>
          {foundProduct?.source !== 'local' && !searching && (
            <button onClick={() => onOpenGlobalModal(barcode)} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-av-orange text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-orange-200">
              <PlusCircle size={20} /><span className="text-[10px] font-black uppercase">Редагувати</span>
            </button>
          )}
          <div className={`mt-2 py-2 rounded-xl flex items-center justify-center gap-2 border font-black text-[9px] uppercase tracking-wider ${isCashback ? 'bg-green-50 border-green-100 text-green-600 shadow-sm shadow-green-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
            {isCashback ? <><ShieldCheck size={14} /> Кешбек підтверджено</> : <><XCircle size={14} className="opacity-30" /> Без кешбеку</>}
          </div>
        </div>
        <button onClick={() => setIsCarlsberg(!isCarlsberg)} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isCarlsberg ? 'border-av-orange bg-orange-50' : 'border-slate-50 bg-white'}`}>
          <div className="flex items-center gap-2">{isCarlsberg ? <CheckSquare className="text-av-orange" size={16} /> : <Square className="text-slate-200" size={16} />}<span className={`text-[8px] font-black uppercase tracking-tight ${isCarlsberg ? 'text-av-orange' : 'text-slate-400'}`}>Carlsberg (55д)</span></div>
        </button>
        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-av-blue outline-none" />
        <div className="relative"><input type="number" value={quantity} onChange={(e) => setQuantityUnits(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-av-blue outline-none" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">ШТ</span></div>
        <button onClick={handleSave} disabled={loading || !foundProduct || !expiryDate} className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${!foundProduct || !expiryDate ? 'bg-slate-100 text-slate-300' : 'bg-av-blue text-white shadow-lg active:scale-95'}`}>
          {loading ? 'ЗАПИС...' : <><Save size={14} /> ЗАПИСАТИ ТЕРМІН</>}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;