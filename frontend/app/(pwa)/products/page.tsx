// FILE: precci/frontend/app/(pwa)/products/page.tsx
// Nova's product display page.
// Products appear automatically as Nova speaks them.
// Client says "buy that" or "add to my list" — voice only.

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  description: string;
  key_ingredients: string[];
  commission_pct: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  useEffect(() => {
    function onVoiceMessage(e: CustomEvent) {
      const msg = e.detail;

      // Nova sends products-ready event when products are found
      if (msg?.type === 'products-ready' && msg?.products) {
        setProducts(msg.products);
        if (msg.products.length > 0) {
          setActiveProduct(msg.products[0]);
        }
      }

      // Nova speaks a specific product — highlight it
      if (msg?.type === 'product-speaking' && msg?.productId) {
        const product = products.find(p => p.id === msg.productId);
        if (product) setActiveProduct(product);
      }
    }

    window.addEventListener('precci:voice-message', onVoiceMessage as EventListener);
    return () =>
      window.removeEventListener('precci:voice-message', onVoiceMessage as EventListener);
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#1A0A0F' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.3)' }}
          >
            <span className="text-3xl font-display font-bold" style={{ color: '#D4A853' }}>N</span>
          </div>
          <p className="font-display text-xl font-bold mb-2" style={{ color: '#FAF0E8' }}>Nova is ready</p>
          <p className="text-sm" style={{ color: 'rgba(250,240,232,0.4)' }}>
            Products will appear here as your specialist makes recommendations.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: '#1A0A0F' }}>
      {/* Active product highlight */}
      <AnimatePresence mode="wait">
        {activeProduct && (
          <motion.div
            key={activeProduct.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 border-b"
            style={{ borderColor: 'rgba(201,132,122,0.12)' }}
          >
            <div className="flex gap-4">
              {activeProduct.image_url && (
                <img
                  src={activeProduct.image_url}
                  alt={activeProduct.name}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#D4A853' }}>
                  Nova Recommends
                </p>
                <p className="font-display font-bold text-lg mb-0.5" style={{ color: '#FAF0E8' }}>
                  {activeProduct.name}
                </p>
                <p className="text-xs mb-2" style={{ color: 'rgba(250,240,232,0.5)' }}>
                  {activeProduct.brand}
                </p>
                <p className="text-sm font-bold" style={{ color: '#C9847A' }}>
                  {activeProduct.currency} {activeProduct.price}
                </p>
              </div>
            </div>
            {activeProduct.description && (
              <p className="text-xs mt-3" style={{ color: 'rgba(250,240,232,0.5)' }}>
                {activeProduct.description}
              </p>
            )}
            {activeProduct.key_ingredients?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {activeProduct.key_ingredients.slice(0, 4).map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,132,122,0.1)', color: 'rgba(201,132,122,0.8)', border: '1px solid rgba(201,132,122,0.2)' }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All products grid */}
      <div className="p-6">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(250,240,232,0.4)' }}>
          All Recommendations — {products.length} products
        </p>
        <div className="flex flex-col gap-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`precci-card p-3 flex items-center gap-3 cursor-pointer ${activeProduct?.id === product.id ? 'border-rose-gold/50' : ''}`}
              onClick={() => setActiveProduct(product)}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#FAF0E8' }}>
                  {product.name}
                </p>
                <p className="text-xs" style={{ color: 'rgba(250,240,232,0.4)' }}>
                  {product.brand}
                </p>
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: '#C9847A' }}>
                {product.currency} {product.price}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}