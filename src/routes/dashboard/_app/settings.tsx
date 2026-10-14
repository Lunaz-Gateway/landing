import {
	createFileRoute,
	getRouteApi,
	useNavigate,
} from "@tanstack/react-router";
import { NameForm } from "#/components/dash-sections";
import {
	Badge,
	Button,
	Card,
	PageHeader,
	useAction,
} from "#/components/dash-ui";
import { signOutMagic } from "#/lib/magic";
import { logout } from "#/server/dash";

const useAccount = () => getRouteApi("/dashboard/_app").useLoaderData();

export const Route = createFileRoute("/dashboard/_app/settings")({
	head: () => ({ meta: [{ title: "Settings · Lunaz Dashboard" }] }),
	component: Settings,
});

function Item({
	label,
	field,
	children,
}: {
	label: string;
	/** Row holds a form control: align the label with the control's text */
	field?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-1.5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
			<dt className={`text-sm text-kertas/60 ${field ? "sm:pt-2" : ""}`}>
				{label}
			</dt>
			<dd className="min-w-0 text-sm break-words">{children}</dd>
		</div>
	);
}

function Settings() {
	const account = useAccount();
	const navigate = useNavigate();
	const { run, busy } = useAction();
	return (
		<>
			<PageHeader title="Settings" description="Your Lunaz account." />
			<div className="space-y-6">
				<Card title="Account" flush>
					<dl className="divide-y divide-white/[0.06] border-t border-white/[0.07] px-4 sm:px-5">
						<Item label="Name" field>
							<NameForm key={account.name} initial={account.name} hideLabel />
						</Item>
						<Item label="Email">{account.email}</Item>
						<Item label="Network">
							<Badge tone={account.network === "main" ? "success" : "neutral"}>
								{account.network === "main" ? "Mainnet" : "Testnet"}
							</Badge>
						</Item>
						<Item label="Viewing key">
							{account.viewing_key_set ? (
								<span className="flex flex-wrap items-center gap-2">
									<Badge tone="success" dot>
										Connected (incoming only)
									</Badge>
									<span className="text-kertas/55">
										Set once at onboarding; it can't be changed here.
									</span>
								</span>
							) : (
								<span className="flex flex-wrap items-center gap-2">
									<Badge tone="warning" dot>
										Not connected
									</Badge>
									<a
										href="/dashboard"
										className="dash-focus rounded-sm underline underline-offset-2"
									>
										Connect your wallet
									</a>
								</span>
							)}
						</Item>
					</dl>
				</Card>
				<Card
					title="Session"
					description="Sign out of the dashboard on this device."
				>
					<Button
						icon="logout"
						pending={busy === "out"}
						onClick={() =>
							run("out", async () => {
								await signOutMagic();
								await logout();
								await navigate({ to: "/dashboard/login" });
							})
						}
					>
						Sign out
					</Button>
				</Card>
			</div>
		</>
	);
}
