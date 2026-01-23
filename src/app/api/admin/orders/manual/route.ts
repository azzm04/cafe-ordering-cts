import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

interface OrderItemPayload {
  menu_id: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface ManualOrderPayload {
  table_id: string;
  table_number: number;
  customer_name?: string;
  payment_method: "cash" | "midtrans";
  items: OrderItemPayload[];
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = nanoid(6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

async function createMidtransTransaction(orderNumber: string, amount: number, customerName: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY not configured");
  }

  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const authString = Buffer.from(serverKey + ":").toString("base64");

  const payload = {
    transaction_details: {
      order_id: orderNumber,
      gross_amount: amount,
    },
    customer_details: {
      first_name: customerName || "Customer",
    },
    enabled_payments: ["qris", "gopay", "shopeepay", "other_qris"],
    callbacks: {
      finish: `${baseUrl}/nota/${orderNumber}`,
      // Optional: tambahkan callback lain
      // error: `${baseUrl}/payment-error?order_id=${orderNumber}`,
      // pending: `${baseUrl}/nota/${orderNumber}`,
    },
  };

  const response = await fetch(snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midtrans API error: ${errorText}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Verify admin session
    const adminCookie = req.cookies.get("cts_admin")?.value;
    if (!adminCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bodyUnknown = await req.json();
    const body = bodyUnknown as ManualOrderPayload;
    
    if (!body.table_id || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { message: "Table dan items wajib diisi" },
        { status: 400 }
      );
    }

    // Check if table is available
    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("id, table_number, status")
      .eq("id", body.table_id)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        { message: "Meja tidak ditemukan" },
        { status: 404 }
      );
    }

    if (table.status !== "available") {
      return NextResponse.json(
        { message: "Meja sudah terisi, pilih meja lain" },
        { status: 400 }
      );
    }

    // Calculate total
    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Determine payment status
    // Cash = pending (tunggu konfirmasi kasir)
    // Midtrans = pending (tunggu payment dari customer)
    const paymentStatus = "pending";

    // Create order object
    const orderInsertData: Record<string, unknown> = {
      order_number: orderNumber,
      table_id: body.table_id,
      payment_method: body.payment_method,
      payment_status: paymentStatus,
      fulfillment_status: "received",
      order_status: "received",
      total_amount: totalAmount,
      customer_name: body.customer_name || `Meja ${body.table_number}`,
      is_manual_order: true,
    };

    // If Midtrans, generate payment link BEFORE creating order
    let midtransData: { token: string; redirect_url: string } | null = null;
    
    if (body.payment_method === "midtrans") {
      try {
        midtransData = await createMidtransTransaction(
          orderNumber,
          totalAmount,
          body.customer_name || `Meja ${body.table_number}`
        );

        // Add Midtrans data to order
        orderInsertData["midtrans_snap_token"] = midtransData.token;
        orderInsertData["midtrans_redirect_url"] = midtransData.redirect_url;
      } catch (midtransError) {
        console.error("Midtrans error:", midtransError);
        return NextResponse.json(
          { 
            message: "Gagal membuat payment link",
            error: midtransError instanceof Error ? midtransError.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { 
          message: "Gagal membuat order", 
          error: orderError.message,
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { message: "Order created but no data returned" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { 
          message: "Gagal menyimpan item order",
          error: itemsError.message 
        },
        { status: 500 }
      );
    }

    // Update table status to occupied
    await supabase
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", body.table_id);

    // Update stock for each menu item
    for (const item of body.items) {
      try {
        await supabase.rpc("decrement_stock", {
          menu_id: item.menu_id,
          qty: item.quantity,
        });
      } catch (stockError) {
        console.error("Stock update error:", stockError);
      }
    }

    // Return response based on payment method
    const response: Record<string, unknown> = {
      message: "Order berhasil dibuat",
      order_number: orderNumber,
      order_id: order.id,
      total_amount: totalAmount,
      payment_status: paymentStatus,
      payment_method: body.payment_method,
    };

    // If Midtrans, include payment link
    if (body.payment_method === "midtrans" && midtransData) {
      response.midtrans_token = midtransData.token;
      response.midtrans_redirect_url = midtransData.redirect_url;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Manual order error:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}