import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Overview } from "#/components/dash-overview";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { getFees, getWebhookUrl, listInvoices, listKeys } from "#/server/dash";

const useAccount = () => getRouteApi("/dashboard/_app").useLoaderData();

export const Route = createFileRoute("/dashboard/_app/")({
	loader: async () => {
		const [keys, invoices, webhook, fees] = await Promise.all([
			listKeys(),
			listInvoices(),
			getWebhookUrl(),
			getFees().catch(() => null),
		]);
		return { keys, invoices, webhook, fees };
	},
	head: () => ({ meta: [{ title: "Overview · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Overview">
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
				{[0, 1, 2].map((i) => (
					<Skeleton
						key={i}
						className={`h-[118px] w-full rounded-xl ${i === 2 ? "col-span-2 lg:col-span-1" : ""}`}
					/>
				))}
			</div>
			<TableSkeleton rows={5} cols={4} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const account = useAccount();
	return <Overview {...Route.useLoaderData()} account={account} />;
}
