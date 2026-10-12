import { createFileRoute } from "@tanstack/react-router";
import {
	PageSkeleton,
	TableSkeleton,
	Webhooks,
} from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { getWebhook, listDeliveries } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/webhooks")({
	loader: async () => {
		const [webhook, deliveries] = await Promise.all([
			getWebhook(),
			listDeliveries(),
		]);
		return { webhook, deliveries };
	},
	head: () => ({ meta: [{ title: "Webhooks · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Webhooks">
			<Skeleton className="h-[190px] w-full rounded-xl" />
			<Skeleton className="h-[130px] w-full rounded-xl" />
			<TableSkeleton rows={3} cols={5} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const data = Route.useLoaderData();
	// Remount the form when the saved URL changes so local edits reset
	return <Webhooks key={data.webhook.url ?? ""} {...data} />;
}
