import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Calculate totals using unit_price from cart (already correct for variants)
    let totalEstimated = 0;
    const orderItems = items.map((item: any) => {
      // Use unit_price from cart (already has correct variant price)
      const unitPrice = item.unit_price ?? 0;
      const lineTotal = item.line_total ?? (unitPrice * item.qty);
      totalEstimated += lineTotal;
      
      return {
        productId: item.productId,
        variant_id: item.variant_id,
        variant_label: item.variant_label,
        name: item.name || `Producto ${item.productId}`,
        qty: item.qty,
        unit_price: unitPrice,
        line_total: lineTotal
      };
    });

    const FREE_SHIPPING_THRESHOLD = 199;
    const shippingCost = totalEstimated >= FREE_SHIPPING_THRESHOLD ? 0 : 20

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
  } catch (err: any) {
    console.error("🔥 /api/preorder FAILED", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      cause: err?.cause,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "preorder_failed",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
