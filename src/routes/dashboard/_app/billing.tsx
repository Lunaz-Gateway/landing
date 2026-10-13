import { createFileRoute } from "@tanstack/react-router";
import { Billing, type Paid } from "#/components/dash-billing";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { getPlan, listBilling, listPlans } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/billing")({
	validateSearch: (s: Record<string, unknown>): { upgrade?: Paid | true } => ({
		upgrade:
			s.upgrade === "pro" || s.upgrade === "platform"
				? s.upgrade
				: s.upgrade
					? true
					: undefined,
	}),
	loader: async () => {
		const [plan, plans, history] = await Promise.all([
			getPlan(),
			listPlans(),
			listBilling(),
		]);
		return { plan, plans, history };
	},
	head: () => ({ meta: [{ title: "Plan & billing · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Plan & billing">
			<Skeleton className="h-[240px] w-full rounded-xl" />
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-[300px] w-full rounded-xl" />
				))}
			</div>
			<TableSkeleton rows={3} cols={6} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const navigate = Route.useNavigate();
	return (
		<Billing
			{...Route.useLoaderData()}
			upgrade={Route.useSearch().upgrade}
			setUpgrade={(p) =>
				navigate({ search: { upgrade: p }, replace: true, resetScroll: false })
			}
		/>
	);
}
