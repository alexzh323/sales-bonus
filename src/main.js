/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount =   1 - (purchase.discount / 100);
  return  (purchase.sale_price*purchase.quantity*discount);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
      return seller.profit*15/100;
    } else if (index === 1 || index === 2) {
      return seller.profit*10/100;
    } else if (index ===  (total - 1)) {
      return 0;
    } else { // Для всех остальных
      return seller.profit*5/100;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {


    // @TODO: Проверка входных данных
    if (!data
    || !Array.isArray(data.sellers)
    || data.sellers.length === 0

    || !Array.isArray(data.products)
    || data.products.length === 0

    || !Array.isArray(data.customers)
    || data.customers.length === 0

    || !Array.isArray(data.purchase_records)
    || data.purchase_records.length === 0

    ) {
      throw new Error('Некорректные входные данные');
    }


    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
      throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
   // Заполним начальными данными
    }));
    

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex =  Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
        seller.sales_count++;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;

        // @TODO: Расчет выручки и прибыли для каждого продавца
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            let cost = (product.purchase_price*item.quantity);
            let revenue = calculateRevenue(item);
            let profit = revenue - cost;
            seller.profit += profit;
            if (!seller.products_sold[item.sku]) {
              seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
            // Увеличить число всех проданных товаров у продавца на количество проданных товаров в конкретном чеке
        }); 
    });

    // @TODO: Сортировка продавцов по прибыли
    let profitResult = sellerStats.sort((a, b) => (b.profit - a.profit));

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller); // Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
          .map(([sku, quantity]) => ({
           sku: sku,
           quantity: quantity
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0,10);// Формируем топ-10 товаров
    }); 

    // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
  }));

}


