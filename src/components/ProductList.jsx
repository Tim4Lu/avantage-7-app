import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';
import { AlertCircle, Clock, BadgeCheck } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-4 pb-10">
      {products.map((product) => {
        const status = getStatus(product);
        return (
          <div key={product.id} className={`bg-white p-5 rounded-[2rem] shadow-av border-l-8 ${status.urgent ? 'border-av-orange' : 'border-av-blue'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-av-blue text-lg uppercase leading-tight">{product.name}</h3>
                  {/* ВИПРАВЛЕНО: Додано відображення значка кешбеку */}
                  {product.is_cashback && (
                    <BadgeCheck size={16} className="text-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-slate-400">
                  <Clock size={14} />
                  <span className="text-xs font-bold">До: {new Date(product.expiry_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={`text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 whitespace-nowrap ${status.color}`}>
                {status.label}
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
    </div>
  );
};

export default ProductList;