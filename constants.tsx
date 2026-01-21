
import React from 'react';
import { MenuItem } from './types';

// Default Indian breakfast image for items without images
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&q=80&w=400';

export const INITIAL_MENU: MenuItem[] = [
  // Breakfast
  { id: '1', name: 'Steamed Idli (2pcs)', price: 40, costPrice: 15, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '2', name: 'Medu Vada (2pcs)', price: 50, costPrice: 20, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '3', name: 'Classic Masala Dosa', price: 75, costPrice: 30, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '4', name: 'Ghee Podi Dosa', price: 85, costPrice: 35, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1630406144797-821be1f35d65?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '5', name: 'Chole Bhature', price: 120, costPrice: 50, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1626132646529-547b69a4ce13?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '6', name: 'Puri Sabji (3pcs)', price: 90, costPrice: 40, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '7', name: 'Aloo Paratha with Curd', price: 80, costPrice: 35, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '8', name: 'Indori Poha', price: 45, costPrice: 20, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb27097?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '9', name: 'Ven Pongal & Sambhar', price: 65, costPrice: 25, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '10', name: 'Onion Uttapam', price: 70, costPrice: 28, category: 'Breakfast', imageUrl: 'https://images.unsplash.com/photo-1630383249899-231a47738f6b?auto=format&fit=crop&q=80&w=400', active: true },
  
  // Lunch
  { id: '11', name: 'North Indian Thali', price: 150, costPrice: 70, category: 'Lunch', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '12', name: 'Dal Khichdi Tadka', price: 110, costPrice: 45, category: 'Lunch', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb27097?auto=format&fit=crop&q=80&w=400', active: true },
  
  // Beverages
  { id: '13', name: 'Filter Coffee', price: 25, costPrice: 10, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1595434066389-99c31652476a?auto=format&fit=crop&q=80&w=400', active: true },
  { id: '14', name: 'Masala Chai', price: 20, costPrice: 8, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1544787210-2213d242403b?auto=format&fit=crop&q=80&w=400', active: true },
];

export const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Beverages'] as const;
