import { supabase } from '../supabase';

/**
 * Допоміжна функція для розрахунку "дати алярму"
 * @param {string} productName - Назва (для пошуку Carlsberg)
 * @param {string} expiryDate - Дата прострочки з календаря
 */
export const prepareProductData = (productName, barcode, expiryDate) => {
  // Список брендів Carlsberg Ukraine для автоматичного фільтра
  const carlsbergKeywords = /carlsberg|львівське|1715|kronenbourg|somersby|arsenal|арсенал|garage|квас тарас/i;
  const isCarlsberg = carlsbergKeywords.test(productName);
  
  // Логіка Авантаж 7: 55 днів для Карлсберг, 2 дні для решти
  const daysBefore = isCarlsberg ? 55 : 2;
  
  const dateObj = new Date(expiryDate);
  const reminderDate = new Date(dateObj);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);

  return {
    name: productName,
    barcode: barcode || '00000000',
    expiry_date: expiryDate,
    reminder_date: reminderDate.toISOString().split('T')[0], // YYYY-MM-DD
    brand: isCarlsberg ? 'Carlsberg Ukraine' : 'Інше',
    is_carlsberg: isCarlsberg,
    status: 'active'
  };
};

/**
 * Збереження нового товару в базу
 */
export const saveProductToDb = async (productData) => {
  const finalData = prepareProductData(
    productData.name, 
    productData.barcode, 
    productData.expiry_date
  );

  const { data, error } = await supabase
    .from('products')
    .insert([finalData])
    .select();

  if (error) {
    console.error("Помилка Supabase при збереженні:", error.message);
    throw error;
  }
  return data;
};

/**
 * Отримання всього списку товарів для складу
 */
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('expiry_date', { ascending: true });

  if (error) {
    console.error("Помилка Supabase при читанні:", error.message);
    throw error;
  }
  return data;
};

/**
 * Видалення товару (якщо списали або продали)
 */
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const fetchGlobalProduct = async (barcode) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1) {
      return {
        name: data.product.product_name || data.product.product_name_uk || "Невідомий товар",
        image: data.product.image_front_url || data.product.image_url,
        brand: data.product.brands || ""
      };
    }
    return null;
  } catch (error) {
    console.error("Помилка пошуку в глобальній базі:", error);
    return null;
  }
};