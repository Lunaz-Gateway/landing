import { createFileRoute } from "@tanstack/react-router";
import {
	ApiKeys,
	PageSkeleton,
	TableSkeleton,
} from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { listKeys } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/keys")({
	loader: () => listKeys(),
	head: () => ({ meta: [{ title: "API keys · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="API keys">
			<Skeleton className="h-[178px] w-full rounded-xl" />
			<TableSkeleton rows={3} cols={5} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: () => <ApiKeys keys={Route.useLoaderData()} />,
});
