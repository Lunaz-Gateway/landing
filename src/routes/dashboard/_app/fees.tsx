import { createFileRoute } from "@tanstack/react-router";
import { FeesPage } from "#/components/dash-fees";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { getFees } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/fees")({
	loader: async () => ({ fees: await getFees() }),
	head: () => ({ meta: [{ title: "Fees · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Fees">
			<Skeleton className="h-[200px] w-full rounded-xl" />
			<Skeleton className="h-[160px] w-full rounded-xl" />
			<TableSkeleton rows={3} cols={5} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	return <FeesPage {...Route.useLoaderData()} />;
}
