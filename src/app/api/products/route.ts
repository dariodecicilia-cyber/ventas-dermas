import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('brand', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("Error al leer desde Supabase:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const brand = searchParams.get('brand');

    if (id) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Producto eliminado' });
    }

    if (brand) {
      const { error } = await supabase.from('products').delete().eq('brand', brand);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Marca ${brand} vaciada` });
    }

    return NextResponse.json({ error: 'Falta ID o Marca' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
