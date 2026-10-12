import { createFileRoute } from "@tanstack/react-router";
import {
	type InvoiceSearch,
	Invoices,
	PageSkeleton,
} from "#/components/dash-sections";
import { PageError } from "#/components/dash-ui";
import { listInvoices } from "#/server/dash";

const STATUSES = ["paid", "pending", "detected", "underpaid", "expired"];

export const Route = createFileRoute("/dashboard/_app/invoices")({
	validateSearch: (s: Record<string, unknown>): InvoiceSearch => ({
		status: STATUSES.includes(String(s.status))
			? (s.status as InvoiceSearch["status"])
			: undefined,
		q: typeof s.q === "string" && s.q ? s.q : undefined,
		id: typeof s.id === "string" && s.id ? s.id : undefined,
		export: s.export === true || s.export === "true" ? true : undefined,
	}),
	loader: () => listInvoices(),
	head: () => ({ meta: [{ title: "Invoices · Lunaz Dashboard" }] }),
	pendingMs: 150,
	pendingComponent: () => <PageSkeleton title="Invoices" />,
	errorComponent: PageError,
	component: Page,
});

function Page() {
	const navigate = Route.useNavigate();
	const { account } = Route.useRouteContext();
	return (
		<Invoices
			invoices={Route.useLoaderData()}
			network={account.network}
			search={Route.useSearch()}
			setSearch={(search) => navigate({ search, replace: true })}
		/>
	);
}
