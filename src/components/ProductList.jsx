import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';
import { AlertCircle, Clock, BadgeCheck, Trash2, X, CheckCircle2 } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetId, setTargetId] = useState(null);

  useEffect(() => {
    fetchData();
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const fetchData = async () => {
    try {
      const data = await getProducts();
      
      // ОНОВЛЕНЕ СОРТУВАННЯ: Пріоритет для критичних термінів
      const sorted = data.sort((a, b) => {
        const today = new Date();
        
        // Функція для визначення "терміновості"
        const isUrgent = (p) => {
          const diff = Math.ceil((new Date(p.expiry_date) - today) / (1000 * 60 * 60 * 24));
          return p.is_carlsberg ? diff <= 55 : diff <= 2;
        };

        const urgentA = isUrgent(a);
        const urgentB = isUrgent(b);

        // Якщо один терміновий, а інший ні — терміновий іде вгору
        if (urgentA && !urgentB) return -1;
        if (!urgentA && urgentB) return 1;

        // Якщо обидва однакові за пріоритетом — сортуємо за датою
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });

      setProducts(sorted);
      checkCriticalItems(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrigger = (id) => {
    setTargetId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setProducts(products.filter(p => p.id !== targetId));
    setShowConfirm(false);
    setTargetId(null);
  };

  const checkCriticalItems = (items) => {
    items.forEach(product => {
      const today = new Date();
      const expiry = new Date(product.expiry_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      if (!product.is_carlsberg && diffDays <= 2 && diffDays > 0) {
        if (Notification.permission === 'granted') {
          new Notification("КРИТИЧНИЙ ТЕРМІН", {
            body: `Товар ${product.name} треба зняти через 2 дні!`,
            icon: '/logo192.png'
          });
        }
      }
    });
  };

  const getStatus = (product) => {
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (product.is_carlsberg && diffDays <= 55) return { color: 'text-av-orange', label: 'ОБМІН (55д)', urgent: true };
    if (!product.is_carlsberg && diffDays <= 2) return { color: 'text-red-500', label: 'ЗНЯТТЯ (2д)', urgent: true };
    
    return { color: 'text-green-500', label: 'В НОРМІ', urgent: false };
  };

  if (loading) return <div className="p-10 text-center font-bold text-av-blue animate-pulse">ЗАВАНТАЖЕННЯ СКЛАДУ...</div>;

  return (
    <div className="space-y-4 pb-10 relative">
      {products.map((product) => {
        const status = getStatus(product);
        return (
          <div key={product.id} className={`bg-white p-5 rounded-[2rem] shadow-av border-l-8 ${status.urgent ? 'border-av-orange' : 'border-av-blue'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-av-blue text-lg uppercase leading-tight">{product.name}</h3>
                  {product.is_cashback && <BadgeCheck size={16} className="text-blue-600" />}
                </div>
                <div className="flex items-center gap-2 mt-1 text-slate-400">
                  <Clock size={14} />
                  <span className="text-xs font-bold">До: {new Date(product.expiry_date).toLocaleDateString()}</span>
                  {product.quantity && <span className="ml-2 text-av-blue font-black">| {product.quantity} шт</span>}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className={`text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 whitespace-nowrap ${status.color}`}>
                  {status.label}
                </div>
                <button 
                  onClick={() => handleDeleteTrigger(product.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {product.is_carlsberg && (
              <div className="mt-3 p-2 bg-orange-50 rounded-xl border border-orange-100 text-[10px] text-av-orange font-bold flex items-center gap-2">
                <AlertCircle size={12} /> СПЕЦІАЛЬНИЙ ТЕРМІН (CARLSBERG UKRAINE)
              </div>
            )}
          </div>
        );
      })}

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-av-blue/40 backdrop-blur-md" 
            onClick={() => setShowConfirm(false)}
          />
          
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl scale-in-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-av-orange" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-av-orange">
                <AlertCircle size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-av-blue uppercase tracking-tight">Приховати товар?</h2>
                <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
                  Ви впевнені, що цей товар вже прибрано з полиці або термін перевірено?
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  Назад
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl bg-av-blue text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Прибрати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;