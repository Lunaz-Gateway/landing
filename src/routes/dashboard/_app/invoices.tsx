import { createFileRoute } from "@tanstack/react-router";
import { Invoices } from "#/components/dash-sections";

export const Route = createFileRoute("/dashboard/_app/invoices")({
	head: () => ({ meta: [{ title: "Invoices — Lunaz" }] }),
	component: Invoices,
});
