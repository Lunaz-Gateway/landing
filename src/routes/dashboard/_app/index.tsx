import { createFileRoute } from "@tanstack/react-router";
import { Overview } from "#/components/dash-overview";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
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
	head: () => ({ meta: [{ title: "Overview · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Overview">
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} className="h-[118px] w-full rounded-xl" />
				))}
			</div>
			<TableSkeleton rows={5} cols={4} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const { account } = Route.useRouteContext();
	return <Overview {...Route.useLoaderData()} account={account} />;
}
