import TicketDettaglio from "@/components/TicketDettaglio";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDettaglio id={id} />;
}
