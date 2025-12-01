import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Logger middleware
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Health check
app.get('/make-server-4ff5d3b8/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== PRODUCTS ====================

// Get all products
app.get('/make-server-4ff5d3b8/products', async (c) => {
  try {
    const products = await kv.get('products');
    return c.json({ success: true, data: products || [] });
  } catch (error) {
    console.log('Error fetching products:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add product
app.post('/make-server-4ff5d3b8/products', async (c) => {
  try {
    const product = await c.req.json();
    const products = (await kv.get('products')) || [];
    products.push(product);
    await kv.set('products', products);
    return c.json({ success: true, data: product });
  } catch (error) {
    console.log('Error adding product:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update product
app.put('/make-server-4ff5d3b8/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const products = (await kv.get('products')) || [];
    const index = products.findIndex((p: any) => p.id === id);
    
    if (index === -1) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    products[index] = { ...products[index], ...updates };
    await kv.set('products', products);
    return c.json({ success: true, data: products[index] });
  } catch (error) {
    console.log('Error updating product:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== RAW MATERIALS ====================

// Get all materials
app.get('/make-server-4ff5d3b8/materials', async (c) => {
  try {
    const materials = await kv.get('materials');
    return c.json({ success: true, data: materials || [] });
  } catch (error) {
    console.log('Error fetching materials:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add material
app.post('/make-server-4ff5d3b8/materials', async (c) => {
  try {
    const material = await c.req.json();
    const materials = (await kv.get('materials')) || [];
    materials.push(material);
    await kv.set('materials', materials);
    return c.json({ success: true, data: material });
  } catch (error) {
    console.log('Error adding material:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update material
app.put('/make-server-4ff5d3b8/materials/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const materials = (await kv.get('materials')) || [];
    const index = materials.findIndex((m: any) => m.id === id);
    
    if (index === -1) {
      return c.json({ success: false, error: 'Material not found' }, 404);
    }
    
    materials[index] = { ...materials[index], ...updates };
    await kv.set('materials', materials);
    return c.json({ success: true, data: materials[index] });
  } catch (error) {
    console.log('Error updating material:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== SALES ====================

// Get sales
app.get('/make-server-4ff5d3b8/sales', async (c) => {
  try {
    const date = c.req.query('date');
    const sales = (await kv.get('sales')) || [];
    
    if (date) {
      const filtered = sales.filter((s: any) => {
        const saleDate = s.timestamp ? new Date(s.timestamp).toISOString().split('T')[0] : s.date;
        return saleDate === date;
      });
      return c.json({ success: true, data: filtered });
    }
    
    return c.json({ success: true, data: sales });
  } catch (error) {
    console.log('Error fetching sales:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add sale
app.post('/make-server-4ff5d3b8/sales', async (c) => {
  try {
    const sale = await c.req.json();
    console.log('Received sale:', JSON.stringify(sale, null, 2));
    
    // Save sale first
    const sales = (await kv.get('sales')) || [];
    sales.push(sale);
    await kv.set('sales', sales);
    console.log('Sale saved successfully');
    
    // Deduct from stock
    const materials = (await kv.get('materials')) || [];
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item: any) => {
        if (item.product && item.product.recipe && Array.isArray(item.product.recipe)) {
          item.product.recipe.forEach((recipeItem: any) => {
            const material = materials.find((m: any) => m.id === recipeItem.materialId);
            if (material) {
              const deductAmount = recipeItem.quantity * item.quantity;
              material.currentStock -= deductAmount;
              console.log(`Deducted ${deductAmount} ${material.unit} of ${material.name}. New stock: ${material.currentStock}`);
            }
          });
        }
      });
      await kv.set('materials', materials);
      console.log('Stock updated successfully');
    }
    
    return c.json({ success: true, data: sale });
  } catch (error) {
    console.log('Error adding sale:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ATTENDANCE ====================

// Get attendance
app.get('/make-server-4ff5d3b8/attendance', async (c) => {
  try {
    const date = c.req.query('date');
    const userId = c.req.query('userId');
    const attendance = (await kv.get('attendance')) || [];
    
    let filtered = attendance;
    if (date) {
      filtered = filtered.filter((a: any) => a.date === date);
    }
    if (userId) {
      filtered = filtered.filter((a: any) => a.userId === userId);
    }
    
    return c.json({ success: true, data: filtered });
  } catch (error) {
    console.log('Error fetching attendance:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Check in
app.post('/make-server-4ff5d3b8/attendance/checkin', async (c) => {
  try {
    const { userId, userName } = await c.req.json();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const attendance = (await kv.get('attendance')) || [];
    
    // Check if already checked in today
    const existing = attendance.find((a: any) => a.userId === userId && a.date === date);
    if (existing) {
      return c.json({ success: false, error: 'Already checked in today' }, 400);
    }
    
    const record = {
      id: `att-${Date.now()}`,
      userId,
      userName,
      checkIn: now.toISOString(),
      date,
      status: 'present',
    };
    
    attendance.push(record);
    await kv.set('attendance', attendance);
    
    return c.json({ success: true, data: record });
  } catch (error) {
    console.log('Error checking in:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Check out
app.post('/make-server-4ff5d3b8/attendance/checkout', async (c) => {
  try {
    const { userId } = await c.req.json();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const attendance = (await kv.get('attendance')) || [];
    const record = attendance.find((a: any) => a.userId === userId && a.date === date);
    
    if (!record) {
      return c.json({ success: false, error: 'No check-in found for today' }, 404);
    }
    
    if (record.checkOut) {
      return c.json({ success: false, error: 'Already checked out' }, 400);
    }
    
    record.checkOut = now.toISOString();
    const checkInTime = new Date(record.checkIn);
    const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    record.workHours = Math.round(workHours * 100) / 100;
    
    await kv.set('attendance', attendance);
    
    return c.json({ success: true, data: record });
  } catch (error) {
    console.log('Error checking out:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== WASTE ====================

// Get waste records
app.get('/make-server-4ff5d3b8/waste', async (c) => {
  try {
    const date = c.req.query('date');
    const waste = (await kv.get('waste')) || [];
    
    if (date) {
      const filtered = waste.filter((w: any) => {
        const wasteDate = w.date ? (w.date.includes('T') ? w.date.split('T')[0] : w.date) : '';
        return wasteDate === date;
      });
      return c.json({ success: true, data: filtered });
    }
    
    return c.json({ success: true, data: waste });
  } catch (error) {
    console.log('Error fetching waste:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add waste record
app.post('/make-server-4ff5d3b8/waste', async (c) => {
  try {
    const wasteRecord = await c.req.json();
    const waste = (await kv.get('waste')) || [];
    waste.push(wasteRecord);
    await kv.set('waste', waste);
    
    // Deduct from stock
    const materials = (await kv.get('materials')) || [];
    const material = materials.find((m: any) => m.id === wasteRecord.materialId);
    if (material) {
      material.currentStock -= wasteRecord.quantity;
      await kv.set('materials', materials);
    }
    
    return c.json({ success: true, data: wasteRecord });
  } catch (error) {
    console.log('Error adding waste:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== USERS ====================

// Get users
app.get('/make-server-4ff5d3b8/users', async (c) => {
  try {
    const users = await kv.get('users');
    return c.json({ success: true, data: users || [] });
  } catch (error) {
    console.log('Error fetching users:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add user
app.post('/make-server-4ff5d3b8/users', async (c) => {
  try {
    const user = await c.req.json();
    const users = (await kv.get('users')) || [];
    users.push(user);
    await kv.set('users', users);
    return c.json({ success: true, data: user });
  } catch (error) {
    console.log('Error adding user:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user
app.put('/make-server-4ff5d3b8/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const users = (await kv.get('users')) || [];
    const index = users.findIndex((u: any) => u.id === id);
    
    if (index === -1) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    users[index] = { ...users[index], ...updates };
    await kv.set('users', users);
    return c.json({ success: true, data: users[index] });
  } catch (error) {
    console.log('Error updating user:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== INITIALIZE DATA ====================

// Initialize default data
app.post('/make-server-4ff5d3b8/init', async (c) => {
  try {
    const { products, materials, users, settings } = await c.req.json();
    
    await kv.set('products', products);
    await kv.set('materials', materials);
    await kv.set('users', users);
    await kv.set('settings', settings);
    await kv.set('sales', []);
    await kv.set('attendance', []);
    await kv.set('waste', []);
    
    return c.json({ success: true, message: 'Data initialized' });
  } catch (error) {
    console.log('Error initializing data:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all data (reset system)
app.post('/make-server-4ff5d3b8/clear-data', async (c) => {
  try {
    await kv.set('sales', []);
    await kv.set('attendance', []);
    await kv.set('waste', []);
    
    console.log('All sales, attendance, and waste data cleared');
    return c.json({ success: true, message: 'Data cleared successfully' });
  } catch (error) {
    console.log('Error clearing data:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
