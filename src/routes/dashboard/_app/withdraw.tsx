import { createFileRoute } from "@tanstack/react-router";
import { PageSkeleton, TableSkeleton } from "#/components/dash-sections";
import { PageError, Skeleton } from "#/components/dash-ui";
import { Withdraw } from "#/components/dash-withdraw";
import { getOfframp, listWithdrawals } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app/withdraw")({
	validateSearch: (s: Record<string, unknown>): { id?: string } => ({
		id: typeof s.id === "string" && s.id ? s.id : undefined,
	}),
	loader: async () => {
		const [offramp, withdrawals] = await Promise.all([
			getOfframp(),
			listWithdrawals(),
		]);
		return { offramp, withdrawals };
	},
	head: () => ({ meta: [{ title: "Withdraw · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => (
		<PageSkeleton title="Withdraw to bank">
			<div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
				<Skeleton className="h-[360px] w-full rounded-xl" />
				<Skeleton className="h-[220px] w-full rounded-xl" />
			</div>
			<TableSkeleton rows={3} cols={5} />
		</PageSkeleton>
	),
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const navigate = Route.useNavigate();
	return (
		<Withdraw
			{...Route.useLoaderData()}
			openId={Route.useSearch().id}
			setOpenId={(id) => navigate({ search: { id }, replace: true })}
		/>
	);
}
