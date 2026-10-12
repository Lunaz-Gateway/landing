import { createFileRoute } from "@tanstack/react-router";
import { Overview } from "#/components/dash-overview";
import { getWebhook, listInvoices, listKeys } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/")({
	loader: async () => {
		const [keys, invoices, webhook] = await Promise.all([
			listKeys(),
			listInvoices(),
			getWebhook(),
		]);
		return { keys, invoices, webhook };
	},
	head: () => ({ meta: [{ title: "Dashboard — Lunaz" }] }),
	component: Page,
});

function Page() {
	const { account } = Route.useRouteContext();
	return <Overview {...Route.useLoaderData()} account={account} />;
}
