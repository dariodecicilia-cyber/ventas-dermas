import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { brand, products } = await req.json();
    
    if (!brand || !products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Faltan datos de marca o lista de productos' }, { status: 400 });
    }

    // INTELIGENCIA DE NEGOCIO: Borramos los productos antiguos de ESTA marca específica
    // para sobreescribirlos con la nueva lista actualizada, evitando duplicados.
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('brand', brand);

    if (deleteError) throw deleteError;
    
    // Inyectamos los nuevos productos. Quitamos el ID local para que Supabase use el suyo si es necesario,
    // o mantenemos el ID si lo deseamos. En este caso, el ID es generado por la IA, así que es seguro.
    const { error: insertError } = await supabase
      .from('products')
      .insert(products.map(p => ({
         name: p.name,
         presentation: p.presentation,
         brand: p.brand,
         description: p.description || "",
         price: p.price,
         category: p.category || "Varios",
         order_index: p.order_index ?? 0
      })));

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: products.length });
  } catch (err: any) {
    console.error("Error al guardar en Supabase:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
