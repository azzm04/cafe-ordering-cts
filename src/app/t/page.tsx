import { redirect } from "next/navigation";
import { verifyTableSignature } from "@/lib/table-signature";

type Props = {
  searchParams: {
    meja?: string;
    sig?: string;
  };
};

export default function TableGatePage({ searchParams }: Props) {
  const mejaRaw = searchParams.meja;
  const sig = searchParams.sig;

  const meja = Number(mejaRaw);

  if (!mejaRaw || !sig || !Number.isInteger(meja) || meja <= 0) {
    return redirect("/menu?error=invalid_table");
  }

  const valid = verifyTableSignature(meja, sig);

  if (!valid) {
    return redirect("/menu?error=invalid_signature");
  }

  redirect(`/menu?meja=${meja}`);
}
