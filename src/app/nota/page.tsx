import { redirect } from "next/navigation";

type SearchParams = {
  order_id?: string;
  orderId?: string;
};

export default async function NotaRedirectPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order_id ?? sp.orderId;

  if (!orderNumber) redirect("/");

  redirect(`/nota/${orderNumber}`);
}
