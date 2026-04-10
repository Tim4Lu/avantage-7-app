import os
import pandas as pd
from sqlalchemy import create_engine
import requests

# Отримуємо URL бази з секретів GitHub
DB_URL = os.getenv('DB_URL')
CSV_URL = "https://api.madeinukraine.gov.ua/storage/exports/products.csv"

def run_sync():
    if not DB_URL:
        print("❌ Помилка: DB_URL не знайдено в секретах!")
        return

    print("🚀 Починаю синхронізацію кешбеку...")

    try:
        # 1. Завантаження (152 МБ)
        print("⏳ Завантаження файлу...")
        # low_memory=False допомагає уникнути попереджень при читанні великих файлів
        df = pd.read_csv(CSV_URL, low_memory=False)

        # 2. Обробка даних
        # ПРИМІТКА: Якщо назва колонки інша, заміни 'barcode'
        column_name = 'barcode' 
        
        print(f"🧹 Обробка {len(df)} рядків...")
        df = df[[column_name]].dropna()
        df[column_name] = df[column_name].astype(str).str.strip()
        df = df.drop_duplicates(subset=[column_name])

        # 3. Заливка в Supabase
        engine = create_engine(DB_URL)
        
        print("🗑️ Очищення старої таблиці...")
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("TRUNCATE TABLE cashback_codes;"))
            conn.commit()

        print(f"📥 Заливка {len(df)} унікальних кодів у Supabase...")
        # chunksize=10000 пришвидшує процес для великих об'ємів
        df.to_sql('cashback_codes', engine, if_exists='append', index=False, chunksize=10000)
        
        print("✅ База АЗК оновлена успішно!")

    except Exception as e:
        print(f"❌ Критична помилка: {e}")

if __name__ == "__main__":
    run_sync()