import React, { useState, useEffect } from 'react';
import { X, Camera, Globe, Save, Loader2, Beaker } from 'lucide-react';
import { supabase } from '../supabase';

const GlobalProductModal = ({ isOpen, onClose, barcode, onUploadSuccess }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(''); // Тут quantity — це об'єм (напр. 0.5 л)
  const [photo, setPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Створення прев'ю для обраного фото
  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    // 1. Валідація
    if (!name) return alert("Введіть назву товару!");
    if (!quantity) return alert("Вкажіть об'єм (напр. 0.5 л чи 200 г)!");
    if (!photo) return alert("Зробіть фото товару!");
    
    setIsUploading(true);
    
    // Очищення штрих-коду
    const cleanBarcode = typeof barcode === 'object' ? barcode.barcode : String(barcode);
    const fileName = `${cleanBarcode.trim()}_${Date.now()}.jpg`;

    try {
      // 2. Завантаження фото у твій Storage (бакет 'products')
      const { error: uploadError } = await supabase.storage
        .from('products') 
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      // 3. Відправка у світову базу (Open Food Facts) — "тихий" режим
      const worldData = new FormData();
      worldData.append('code', cleanBarcode.trim());
      worldData.append('product_name', name);
      worldData.append('quantity', quantity);
      worldData.append('user_id', 'off');
      worldData.append('password', 'off');
      worldData.append('image_front', photo);

      fetch('https://world.openfoodfacts.org/cgi/product_jqm2.pl', {
        method: 'POST',
        body: worldData,
        mode: 'no-cors'
      });

      // 4. Запис у твою базу даних Supabase
      const { error: dbError } = await supabase
        .from('products')
        .upsert({
          barcode: cleanBarcode.trim(),
          name: name,
          volume: quantity, 
          image: publicUrl, // Посилання на твоє сховище
        }, { onConflict: 'barcode' });

      if (dbError) throw dbError;

      alert("✅ Товар успішно зареєстровано!");
      
      if (onUploadSuccess) {
        onUploadSuccess({
          name: name,
          volume: quantity,
          image: publicUrl,
          source: 'local'
        });
      }
      onClose();
      // Скидаємо стейти після закриття
      setName('');
      setQuantity('');
      setPhoto(null);

    } catch (e) {
      console.error(e);
      alert(`❌ Помилка: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        
        {/* Шапка */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 text-blue-500 font-black uppercase text-[10px] tracking-widest">
            <Globe size={18} /> Реєстрація товару
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 active:text-av-orange"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-5">
          {/* Прев'ю фото */}
          <div className="aspect-video bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
            {preview ? (
              <img src={preview} className="w-full h-full object-contain" alt="preview" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <Camera size={40} />
                <span className="text-[8px] font-black uppercase">Потрібне фото</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Поле назви */}
            <div>
              <label className="block text-[9px] font-black text-av-blue uppercase ml-3 mb-1">Назва продукту</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Напр. Pepsi Lime"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-av-blue outline-none focus:border-blue-400"
              />
            </div>

            {/* Поле об'єму */}
            <div>
              <label className="block text-[9px] font-black text-av-blue uppercase ml-3 mb-1">Об'єм / Вага</label>
              <div className="relative">
                <input 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Напр. 0.5 л або 250 г"
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-av-blue outline-none focus:border-blue-400"
                />
                <Beaker className="absolute left-4 top-1/2 -translate-y-1/2 text-av-orange" size={20} />
              </div>
            </div>
            
            {/* Кнопка камери */}
            <label className="flex items-center justify-center gap-3 w-full p-4 bg-av-blue text-white rounded-2xl font-black uppercase text-[10px] cursor-pointer active:scale-95 transition-transform shadow-lg">
              <Camera size={18} /> {photo ? 'Змінити фото' : 'Зробити фото товару'}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} />
            </label>
          </div>

          {/* Кнопка збереження */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${
              isUploading ? 'bg-slate-100 text-slate-400' : 'bg-green-500 text-white active:bg-green-600'
            }`}
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={20} /> <span>Відправка...</span></>
            ) : (
              <><Save size={20} /> <span>Підтвердити та зберегти</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalProductModal;