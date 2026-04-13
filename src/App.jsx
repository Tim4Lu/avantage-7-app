import React, { useState } from 'react';
import Scanner from './components/Scanner';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import GlobalProductModal from './components/GlobalProductModal';
import { Scan, Package, PlusCircle } from 'lucide-react';

function App() {
  const [view, setView] = useState('scan'); 
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isCashback, setIsCashback] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState('');

  const handleScanSuccess = (data) => {
    // data — це об'єкт { barcode, hasCashback, name... }
    setScannedBarcode(data);
    setIsCashback(data.hasCashback); 
    setView('add'); 
  };

  const handleOpenGlobalModal = (barcode) => {
    setSelectedBarcode(barcode);
    setIsGlobalModalOpen(true);
  };

  const handleGlobalUploadSuccess = (newData) => {
    setScannedBarcode({
      barcode: selectedBarcode,
      name: newData.name,
      volume: newData.volume,
      image: newData.image,
      hasCashback: isCashback,
      source: 'world'
    });
    setIsGlobalModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-av-blue p-8 rounded-b-[3rem] shadow-2xl mb-2">
        <h1 className="text-white text-3xl font-black italic tracking-tighter">
          AVANTAGE <span className="text-av-orange">7</span>
        </h1>
      </header>

      <main className="px-4">
        {view === 'scan' && (
          <Scanner 
            onScanSuccess={handleScanSuccess} 
            onCashbackFound={(found) => setIsCashback(found)}
          />
        )}
        
        {view === 'add' && (
          <AddProduct 
            initialBarcode={scannedBarcode} 
            onOpenGlobalModal={handleOpenGlobalModal} 
            onSave={() => {
              setScannedBarcode(''); 
              setIsCashback(false);
              setView('list'); 
            }} 
          />
        )}
        
        {view === 'list' && <ProductList />}
      </main>

      <GlobalProductModal 
        isOpen={isGlobalModalOpen}
        barcode={selectedBarcode}
        onClose={() => setIsGlobalModalOpen(false)}
        onUploadSuccess={handleGlobalUploadSuccess}
      />

      <nav className="fixed bottom-8 left-6 right-6 bg-av-dark/95 backdrop-blur-xl p-4 rounded-[2.5rem] flex justify-around shadow-2xl z-50">
        <button onClick={() => setView('scan')} className={`flex flex-col items-center ${view === 'scan' ? 'text-av-orange' : 'text-slate-400'}`}>
          <Scan size={26} />
          <span className="text-[9px] font-black uppercase mt-1">Сканер</span>
        </button>
        <button onClick={() => { setScannedBarcode(''); setView('add'); }} className={`flex flex-col items-center ${view === 'add' ? 'text-av-orange' : 'text-slate-400'}`}>
          <PlusCircle size={26} />
          <span className="text-[9px] font-black uppercase mt-1">Вручну</span>
        </button>
        <button onClick={() => setView('list')} className={`flex flex-col items-center ${view === 'list' ? 'text-av-orange' : 'text-slate-400'}`}>
          <Package size={26} />
          <span className="text-[9px] font-black uppercase mt-1">Склад</span>
        </button>
      </nav>
    </div>
  );
}

export default App;