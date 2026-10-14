import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Overview } from "#/components/dash-overview";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import {
	getFees,
	getOfframp,
	getWebhookUrl,
	listInvoices,
	listKeys,
} from "#/server/dash";

const useAccount = () => getRouteApi("/dashboard/_app").useLoaderData();

export const Route = createFileRoute("/dashboard/_app/")({
	loader: async () => {
		const [keys, invoices, webhook, fees, offramp] = await Promise.all([
			listKeys(),
			listInvoices(),
			getWebhookUrl(),
			getFees().catch(() => null),
			// Only for the USD estimate; the page works without it
			getOfframp().catch(() => null),
		]);
		return { keys, invoices, webhook, fees, zecUsd: offramp?.zec_usd ?? null };
	},
	head: () => ({ meta: [{ title: "Overview · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Overview">
			<Skeleton className="h-[188px] w-full rounded-[14px]" />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<TableSkeleton rows={5} cols={4} />
				</div>
				<Skeleton className="h-[300px] w-full rounded-[14px]" />
			</div>
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const account = useAccount();
	return <Overview {...Route.useLoaderData()} account={account} />;
}
