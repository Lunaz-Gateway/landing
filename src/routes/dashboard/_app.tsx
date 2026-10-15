import {
	createFileRoute,
	type ErrorComponentProps,
	Link,
	Outlet,
	redirect,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	button,
	DashNotFound,
	Dialog,
	Icon,
	type IconName,
	PageError,
	Toaster,
	useAction,
} from "#/components/dash-ui";
import { signOutMagic } from "#/lib/magic";
import { type Account, getAccount, logout } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app")({
	// A loader (not beforeLoad) so it runs in parallel with the page loaders
	loader: async () => {
		const account = await getAccount();
		if (!account) throw redirect({ to: "/dashboard/login" });
		return account;
	},
	component: Shell,
	errorComponent: DashError,
	notFoundComponent: DashNotFound,
});

const DEMO = import.meta.env.VITE_DEMO_URL ?? "http://localhost:3000";

type NavItem = { to: string; label: string; icon: IconName };
const NAV: { group: string; items: NavItem[] }[] = [
	{
		group: "Payments",
		items: [
			{ to: "/dashboard", label: "Overview", icon: "home" },
			{ to: "/dashboard/invoices", label: "Invoices", icon: "invoice" },
			{ to: "/dashboard/withdraw", label: "Withdraw", icon: "bank" },
		],
	},
	{
		group: "Developers",
		items: [
			{ to: "/dashboard/keys", label: "API keys", icon: "key" },
			{ to: "/dashboard/webhooks", label: "Webhooks", icon: "hook" },
		],
	},
	{
		group: "Account",
		items: [
			{ to: "/dashboard/fees", label: "Fees", icon: "card" },
			{ to: "/dashboard/settings", label: "Settings", icon: "settings" },
		],
	},
];
const ITEMS = NAV.flatMap((g) => g.items);

const navItem =
	"dash-focus relative flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-kertas/65 transition-colors duration-150 hover:bg-white/[0.05] hover:text-kertas md:h-9 [&>svg]:text-kertas/50 hover:[&>svg]:text-kertas/80";

const initials = (a: Account) =>
	(a.name || a.email)
		.split(/[\s@.]+/)
		.filter(Boolean)
		.slice(0, a.name ? 2 : 1)
		.map((w) => w[0])
		.join("")
		.toUpperCase();

function Sidebar({ account }: { account: Account }) {
	const navigate = useNavigate();
	const { run, busy } = useAction();
	const main = account.network === "main";
	return (
		<div className="flex h-full flex-col gap-5 p-3">
			<div className="flex h-9 items-center px-2.5 pt-1">
				<Link
					to="/dashboard"
					aria-label="Lunaz dashboard home"
					className="dash-focus rounded-md"
				>
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={89}
						height={24}
						className="h-6 w-auto"
					/>
				</Link>
			</div>
			<div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5">
				<span
					aria-hidden="true"
					className="grid size-9 shrink-0 place-items-center rounded-lg bg-lunas/[0.14] text-[13px] font-bold text-lunas ring-1 ring-lunas/25 ring-inset"
				>
					{initials(account)}
				</span>
				<div className="min-w-0">
					<p className="truncate text-sm font-bold">
						{account.name || account.email}
					</p>
					<p className="mt-0.5 flex items-center gap-1.5 text-xs text-kertas/60">
						<span
							className={`size-1.5 rounded-full ${main ? "bg-lunas" : "bg-[#ffb86b]"}`}
						/>
						{main ? "Mainnet" : "Testnet"}
					</p>
				</div>
			</div>
			<nav
				aria-label="Dashboard"
				className="scrollbar-none -mx-1 flex-1 space-y-5 overflow-y-auto px-1"
			>
				{NAV.map((g) => (
					<div key={g.group}>
						<p className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-[0.08em] text-kertas/40 uppercase">
							{g.group}
						</p>
						<ul className="space-y-0.5">
							{g.items.map((n) => (
								<li key={n.to}>
									<Link
										to={n.to}
										activeOptions={{ exact: true }}
										className={navItem}
										activeProps={{
											className:
												"bg-white/[0.08] font-medium !text-kertas [&>svg]:!text-lunas before:absolute before:inset-y-2 before:-left-1 before:w-[3px] before:rounded-r-full before:bg-lunas",
											"aria-current": "page",
										}}
									>
										<Icon name={n.icon} />
										{n.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</nav>
			<div className="space-y-0.5 border-t border-white/[0.07] pt-3">
				<a href="/#developers" className={navItem}>
					<Icon name="docs" />
					Docs
				</a>
				<button
					type="button"
					className={`${navItem} w-full`}
					disabled={busy === "out"}
					onClick={() =>
						run("out", async () => {
							await signOutMagic();
							await logout();
							await navigate({ to: "/dashboard/login" });
						})
					}
				>
					<Icon name="logout" />
					Sign out
				</button>
				<p
					className="truncate px-2.5 pt-1 text-xs text-kertas/60"
					title={account.email}
				>
					{account.email}
				</p>
			</div>
		</div>
	);
}

function Shell() {
	const account = Route.useLoaderData();
	const path = useRouterState({
		select: (s) => s.location.pathname.replace(/\/$/, "") || "/",
	});
	const title = ITEMS.find((n) => n.to === path)?.label ?? "Dashboard";
	const [open, setOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close the drawer on navigation
	useEffect(() => setOpen(false), [path]);

	return (
		<div className="min-h-dvh bg-malam md:pl-60">
			<a
				href="#main"
				className="dash-focus fixed top-2 left-2 z-[70] -translate-y-16 rounded-lg bg-lunas px-3 py-2 text-sm font-bold text-malam focus:translate-y-0"
			>
				Skip to content
			</a>
			<aside className="fixed top-[var(--tb,0px)] bottom-0 left-0 hidden w-60 border-r border-white/[0.08] bg-[#181a35] md:block">
				<Sidebar account={account} />
			</aside>
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				variant="nav"
				labelledBy="nav-label"
				initialFocus="nav [aria-current=page]"
			>
				<span id="nav-label" className="sr-only">
					Menu
				</span>
				<Sidebar account={account} />
			</Dialog>
			<div className="flex min-h-dvh min-w-0 flex-col">
				<header className="sticky top-[var(--tb,0px)] z-30 flex h-14 items-center gap-2 border-b border-white/[0.07] bg-malam/80 px-4 backdrop-blur-md backdrop-saturate-150 sm:px-6">
					<button
						type="button"
						className={`${button("ghost", "icon")} -ml-1.5 md:hidden`}
						aria-label="Open menu"
						aria-expanded={open}
						onClick={() => setOpen(true)}
					>
						<Icon name="menu" className="size-5" />
					</button>
					<nav aria-label="Breadcrumb" className="min-w-0 flex-1">
						<ol className="flex items-center gap-1.5 text-sm">
							<li className="hidden truncate text-kertas/55 sm:block">
								{account.name || account.email}
							</li>
							<li aria-hidden="true" className="hidden text-kertas/25 sm:block">
								/
							</li>
							<li aria-current="page" className="truncate font-medium">
								{title}
							</li>
						</ol>
					</nav>
					<a href={DEMO} className={button("ghost", "sm")}>
						Try the demo
						<Icon name="external" className="size-3.5" />
					</a>
				</header>
				<main
					id="main"
					tabIndex={-1}
					className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 outline-none sm:px-8 sm:pt-10"
				>
					<div key={path} className="dash-enter">
						<Outlet />
					</div>
				</main>
			</div>
			<Toaster />
		</div>
	);
}

// Full-screen variant for when the shell itself fails to load
function DashError(props: ErrorComponentProps) {
	return (
		<div className="min-h-dvh bg-malam px-4 py-16">
			<PageError {...props} />
		</div>
	);
}
