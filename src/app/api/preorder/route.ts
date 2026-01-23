import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const supabaseAnon = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const body = await request.json();
    const { fullName, phone, city, address, comment, items } = body;

    if (!fullName || !phone || !city || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Get user if authenticated (token optional)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let userId: string | null = null;

    if (token) {
      const { data, error } = await supabaseAnon.auth.getUser(token);
      if (!error) userId = data.user?.id ?? null;
    }

    // Fetch product prices
    const productIds = items.map((item: any) => item.productId)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price_estimated')
      .in('id', productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch product prices' }, { status: 500 })
    }

    // Calculate totals
    let totalEstimated = 0
    const orderItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      const subtotal = product.price_estimated * item.qty
      totalEstimated += subtotal
      return {
        productId: item.productId,
        name: product.name,
        qty: item.qty,
        price_estimated: product.price_estimated,
        subtotal
      }
    })

    const shippingCost = totalEstimated >= 220 ? 0 : 15

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        full_name: fullName,
        phone,
        city,
        address,
        comment: comment || null,
        items: orderItems,
        total_estimated: totalEstimated,
        shipping_cost: shippingCost,
        status: 'nuevo'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, orderId: order.id })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
