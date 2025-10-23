const { client } = require('./db/connection');

const sampleProducts = [
  {
    itemname: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    inventory: 25,
    price: 79.99,
    category: 'Electronics'
  },
  {
    itemname: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt',
    inventory: 50,
    price: 24.99,
    category: 'Clothing'
  },
  {
    itemname: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle that keeps drinks cold for 24 hours',
    inventory: 30,
    price: 19.99,
    category: 'Home & Garden'
  },
  {
    itemname: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand for better ergonomics',
    inventory: 15,
    price: 45.99,
    category: 'Electronics'
  },
  {
    itemname: 'Yoga Mat',
    description: 'Non-slip yoga mat perfect for home workouts',
    inventory: 40,
    price: 29.99,
    category: 'Sports & Fitness'
  },
  {
    itemname: 'Coffee Mug Set',
    description: 'Set of 4 ceramic coffee mugs with beautiful designs',
    inventory: 20,
    price: 34.99,
    category: 'Home & Garden'
  }
];

async function addSampleProducts() {
  try {
    console.log('🚀 Adding sample products to database...');
    
    for (const product of sampleProducts) {
      const query = `
        INSERT INTO items(itemname, description, inventory, price, category, createdby, createddate) 
        VALUES($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (itemname) DO NOTHING
      `;
      
      await client.query(query, [
        product.itemname,
        product.description,
        product.inventory,
        product.price,
        product.category,
        'system'
      ]);
      
      console.log(`✅ Added: ${product.itemname}`);
    }
    
    console.log('🎉 Sample products added successfully!');
    
    // Verify products were added
    const result = await client.query('SELECT COUNT(*) as count FROM items');
    console.log(`📦 Total products in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  }
}

addSampleProducts();

