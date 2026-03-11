import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createMayarPayment } from "@/lib/mayar";

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
  payment_method: "cash" | "online";
  items: OrderItemPayload[];
}

function generateOrderNumber(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CTS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rand}`;
}

// async function createMidtransTransaction(orderNumber: string, amount: number, customerName: string) {
//   const serverKey = process.env.MIDTRANS_SERVER_KEY;
//   const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
//
//   if (!serverKey) {
//     throw new Error("MIDTRANS_SERVER_KEY not configured");
//   }
//
//   const snapUrl = isProduction
//     ? "https://app.midtrans.com/snap/v1/transactions"
//     : "https://app.sandbox.midtrans.com/snap/v1/transactions";
//
//   const authString = Buffer.from(serverKey + ":").toString("base64");
//
//   const payload = {
//     transaction_details: {
//       order_id: orderNumber,
//       gross_amount: amount,
//     },
//     customer_details: {
//       first_name: customerName || "Customer",
//     },
//     enabled_payments: ["qris", "gopay", "shopeepay", "other_qris"],
//     callbacks: {
//       finish: `${baseUrl}/nota/${orderNumber}`,
//     },
//   };
//
//   const response = await fetch(snapUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Basic ${authString}`,
//     },
//     body: JSON.stringify(payload),
//   });
//
//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`Midtrans API error: ${errorText}`);
//   }
//
//   const data = await response.json();
//   return {
//     token: data.token,
//     redirect_url: data.redirect_url,
//   };
// }

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

    const isTableAvailable = table.status === "tersedia" || table.status === "available";
    if (!isTableAvailable) {
      return NextResponse.json(
        { message: `Meja ${table.table_number} sudah terisi/dipesan, pilih meja lain` },
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

    // Create base order object
    const orderInsertData: Record<string, unknown> = {
      order_number: orderNumber,
      table_id: body.table_id,
      payment_method: body.payment_method,
      payment_status: "pending",
      fulfillment_status: "received",
      order_status: "received",
      total_amount: totalAmount,
      customer_name: body.customer_name || `Meja ${body.table_number}`,
      is_manual_order: true,
    };

    let mayarPaymentUrl: string | null = null;

    if (body.payment_method === "online") {
      try {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

        const mayar = await createMayarPayment({
          orderNumber,
          amount: totalAmount,
          buyerName: body.customer_name || `Meja ${body.table_number}`,
          buyerEmail: "customer@order.local",
          redirectUrl: `${appUrl}/nota/${orderNumber}`,
        });

        mayarPaymentUrl = mayar.paymentUrl;
        orderInsertData["mayar_payment_id"]    = mayar.paymentId;
        orderInsertData["mayar_transaction_id"] = mayar.transactionId;
        orderInsertData["mayar_payment_url"]    = mayar.paymentUrl;

        console.log(`[manual-order] Mayar payment created for ${orderNumber} | paymentId: ${mayar.paymentId}`);
      } catch (mayarErr) {
        console.error("[manual-order] Mayar error:", mayarErr);
        return NextResponse.json(
          {
            message: "Gagal membuat payment link Mayar",
            error: mayarErr instanceof Error ? mayarErr.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // if (body.payment_method === "midtrans") {
    //   try {
    //     midtransData = await createMidtransTransaction(
    //       orderNumber,
    //       totalAmount,
    //       body.customer_name || `Meja ${body.table_number}`
    //     );
    //     orderInsertData["midtrans_snap_token"]    = midtransData.token;
    //     orderInsertData["midtrans_redirect_url"]  = midtransData.redirect_url;
    //   } catch (midtransError) {
    //     console.error("Midtrans error:", midtransError);
    //     return NextResponse.json(
    //       {
    //         message: "Gagal membuat payment link",
    //         error: midtransError instanceof Error ? midtransError.message : "Unknown error",
    //       },
    //       { status: 500 }
    //     );
    //   }
    // }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError || !order) {
      console.error("[manual-order] Order creation error:", orderError);
      return NextResponse.json(
        { message: "Gagal membuat order", error: orderError?.message },
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
      console.error("[manual-order] Order items error:", itemsError);
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { message: "Gagal menyimpan item order", error: itemsError.message },
        { status: 500 }
      );
    }

    // Lock meja
    await supabase
      .from("tables")
      .update({ status: "terisi" })
      .eq("id", body.table_id);

    // Update stock for each menu item
    for (const item of body.items) {
      try {
        await supabase.rpc("decrement_stock", {
          menu_id: item.menu_id,
          qty: item.quantity,
        });
      } catch (stockError) {
        console.error("[manual-order] Stock update error:", stockError);
      }
    }

    // Return response
    const response: Record<string, unknown> = {
      message: "Order berhasil dibuat",
      order_number: orderNumber,
      order_id: order.id,
      total_amount: totalAmount,
      payment_status: "pending",
      payment_method: body.payment_method,
    };

    if (body.payment_method === "online" && mayarPaymentUrl) {
      response.payment_url = mayarPaymentUrl;
    }

    // if (body.payment_method === "midtrans" && midtransData) {
    //   response.midtrans_token        = midtransData.token;
    //   response.midtrans_redirect_url = midtransData.redirect_url;
    // }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[manual-order] Error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}