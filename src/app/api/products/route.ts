import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('brand', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("Error al leer desde Supabase:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
