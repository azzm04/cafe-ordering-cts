type CreateTransactionPayload = {
  tableNumber: number;
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
};

type CreateTransactionResponse = {
  orderNumber: string;
  snapToken: string;
};

export function useOrder() {
  const createTransaction = async (payload: CreateTransactionPayload): Promise<CreateTransactionResponse> => {
    const res = await fetch("/api/midtrans/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json: unknown = await res.json();

    if (!res.ok) {
      const msg =
        typeof json === "object" && json !== null && "message" in json
          ? String((json as Record<string, unknown>).message)
          : "Failed create transaction";
      throw new Error(msg);
    }

    // validate shape
    if (
      typeof json !== "object" ||
      json === null ||
      !("orderNumber" in json) ||
      !("snapToken" in json)
    ) {
      throw new Error("Invalid response from server");
    }

    const orderNumber = (json as Record<string, unknown>).orderNumber;
    const snapToken = (json as Record<string, unknown>).snapToken;

    if (typeof orderNumber !== "string" || typeof snapToken !== "string") {
      throw new Error("Invalid response types from server");
    }

    return { orderNumber, snapToken };
  };

  return { createTransaction };
}
