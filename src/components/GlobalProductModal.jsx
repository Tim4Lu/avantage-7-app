import React, { useState } from 'react';
import { X, Camera, Globe, Save, Loader2 } from 'lucide-react';

const GlobalProductModal = ({ isOpen, onClose, barcode, onUploadSuccess }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!name) return alert("Введіть назву товару!");
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('code', String(barcode));
    formData.append('product_name', name);
    formData.append('user_id', 'Avantage7_App');
    formData.append('password', 'off');
    if (photo) formData.append('image_front', photo);

    try {
      await fetch('https://world.openfoodfacts.org/cgi/product_jqm2.pl', {
        method: 'POST',
        body: formData
      });
      alert("✅ Товар надіслано у всесвітню базу!");
      onUploadSuccess(name); // Передаємо назву назад в AddProduct
      onClose();
    } catch (e) {
      alert("❌ Помилка завантаження");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-500 font-black uppercase text-xs">
            <Globe size={18} /> Додати у світову базу
          </div>
          <button onClick={onClose} className="p-2 text-slate-400"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="aspect-video bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <Camera size={40} className="text-slate-300" />
            )}
          </div>

          <div className="space-y-4">
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Назва товару (напр. Вода Моршинська)"
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-av-blue outline-none focus:border-blue-400"
            />
            
            <label className="flex items-center justify-center gap-3 w-full p-4 bg-av-blue text-white rounded-2xl font-black uppercase text-[10px] cursor-pointer">
              <Camera size={18} /> {photo ? 'Змінити фото' : 'Зробити фото'}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} />
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-6 bg-green-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Підтвердити у світі
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalProductModal;