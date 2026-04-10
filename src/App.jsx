import React, { useState } from 'react';
import Scanner from './components/Scanner';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import GlobalProductModal from './components/GlobalProductModal';

import { Scan, Package, PlusCircle } from 'lucide-react';

function App() {
  const [view, setView] = useState('scan'); 
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isCashback, setIsCashback] = useState(false); // Додали стан для кешбеку
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState('');

  // ВИПРАВЛЕНО: Тепер функція приймає два аргументи
  const handleScanSuccess = (barcode, foundCashback) => {
    setScannedBarcode(barcode);
    setIsCashback(foundCashback); // Тепер помилки не буде
    setView('add'); 
  };

  const handleOpenGlobalModal = (barcode) => {
  setSelectedBarcode(barcode); // Запам'ятовуємо код
  setIsGlobalModalOpen(true);   // Відкриваємо модалку
};

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Шапка Авантаж 7 */}
      <header className="bg-av-blue p-8 rounded-b-[3rem] shadow-2xl mb-0.1">
        <h1 className="text-white text-3xl font-black italic tracking-tighter">
          AVANTAGE <span className="text-av-orange">7</span>
        </h1>
        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
          Control System v1.0
        </p>
      </header>

      <main className="px-4" >
        {view === 'scan' && (
          <Scanner 
            onScanSuccess={handleScanSuccess} 
            onCashbackFound={(found) => setIsCashback(found)}
          />
        )}
        
        {view === 'add' && (
          <AddProduct 
            initialBarcode={scannedBarcode} 
            initialCashback={isCashback} // Передаємо інфо про кешбек у форму
            onSave={() => {
              setScannedBarcode(''); 
              setIsCashback(false);
              setView('list'); 
            }} 
          />
        )}
        
        {view === 'list' && (
          <ProductList />
        )}
      </main>

      {/* Головне меню */}
      <nav className="fixed bottom-8 left-6 right-6 bg-av-dark/95 backdrop-blur-xl p-4 rounded-[2.5rem] flex justify-around shadow-2xl border border-white/10 z-50">
        <button 
          onClick={() => {
            setIsCashback(false);
            setView('scan');
          }}
          className={`flex flex-col items-center transition-all ${view === 'scan' ? 'text-av-orange scale-110' : 'text-slate-400'}`}
        >
          <Scan size={26} strokeWidth={2.5} />
          <span className="text-[9px] font-black uppercase mt-1">Сканер</span>
        </button>

        <button 
          onClick={() => { 
            setScannedBarcode(''); 
            setIsCashback(false); 
            setView('add'); 
          }}
          className={`flex flex-col items-center transition-all ${view === 'add' ? 'text-av-orange scale-110' : 'text-slate-400'}`}
        >
          <PlusCircle size={26} strokeWidth={2.5} />
          <span className="text-[9px] font-black uppercase mt-1">Вручну</span>
        </button>

        <button 
          onClick={() => setView('list')}
          className={`flex flex-col items-center transition-all ${view === 'list' ? 'text-av-orange scale-110' : 'text-slate-400'}`}
        >
          <Package size={26} strokeWidth={2.5} />
          <span className="text-[9px] font-black uppercase mt-1">Склад</span>
        </button>
      </nav>
    </div>
  );
}

export default App;