import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { type Account, getAccount, logout } from "#/server/dash";

export const Route = createFileRoute("/dashboard/_app")({
	beforeLoad: async () => {
		const account = await getAccount();
		if (!account) throw redirect({ to: "/dashboard/login" });
		return { account };
	},
	component: Shell,
});

const DEMO = import.meta.env.VITE_DEMO_URL ?? "http://localhost:3000";

const icon = (d: string) => (
	<svg
		viewBox="0 0 24 24"
		className="size-4 shrink-0"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d={d} />
	</svg>
);

const NAV = [
	{
		to: "/dashboard",
		label: "Overview",
		d: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
	},
	{
		to: "/dashboard/keys",
		label: "API keys",
		d: "M14 10a4 4 0 1 0-3.9 3.1L8 15v2H6v2H3v-3l7.1-7.1M15.5 7.5h.01",
	},
	{
		to: "/dashboard/webhooks",
		label: "Webhooks",
		d: "M4 12h4l3-7 4 14 3-7h2",
	},
	{
		to: "/dashboard/invoices",
		label: "Invoices",
		d: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
	},
] as const;

const TITLES: Record<string, string> = Object.fromEntries(
	NAV.map((n) => [n.to, n.label]),
);

const navItem =
	"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-kertas/70 hover:bg-white/5 hover:text-kertas focus-visible:outline-lunas";

function Sidebar({ account }: { account: Account }) {
	const navigate = useNavigate();
	return (
		<div className="flex h-full flex-col gap-6 p-3">
			<div className="px-2.5 pt-2">
				<Link to="/dashboard" aria-label="Lunaz dashboard home">
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={89}
						height={24}
						className="h-6 w-auto"
					/>
				</Link>
			</div>
			<div className="rounded-lg border border-white/10 bg-malam-2/60 px-3 py-2.5">
				<p className="truncate text-sm font-bold">{account.name}</p>
				<span
					className={`mt-1 inline-block rounded border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider ${account.network === "main" ? "border-lunas/50 text-lunas" : "border-white/25 text-kertas/70"}`}
				>
					{account.network === "main" ? "Mainnet" : "Testnet"}
				</span>
			</div>
			<nav aria-label="Dashboard" className="flex-1">
				<ul className="space-y-0.5">
					{NAV.map((n) => (
						<li key={n.to}>
							<Link
								to={n.to}
								activeOptions={{ exact: true }}
								className={navItem}
								activeProps={{
									className: "bg-white/[0.07] font-medium !text-kertas",
								}}
							>
								{icon(n.d)}
								{n.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
			<div className="space-y-1 border-t border-white/10 pt-3">
				<a href="/#developers" className={navItem}>
					{icon("M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6")}
					Docs
				</a>
				<div className="flex items-center justify-between gap-2 px-2.5 py-2">
					<span className="truncate text-xs text-kertas/60">
						{account.email}
					</span>
					<button
						type="button"
						className="shrink-0 rounded text-xs font-medium text-kertas/80 underline-offset-2 hover:text-kertas hover:underline focus-visible:outline-lunas"
						onClick={async () => {
							await logout();
							await navigate({ to: "/dashboard/login" });
						}}
					>
						Log out
					</button>
				</div>
			</div>
		</div>
	);
}

function Shell() {
	const { account } = Route.useRouteContext();
	const path = useRouterState({
		select: (s) => s.location.pathname.replace(/\/$/, "") || "/",
	});
	const title = TITLES[path] ?? "Dashboard";
	const [open, setOpen] = useState(false);
	const menuBtn = useRef<HTMLButtonElement>(null);
	const drawer = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close the drawer on navigation
	useEffect(() => setOpen(false), [path]);
	useEffect(() => {
		if (!open) return;
		drawer.current?.querySelector<HTMLElement>("a,button")?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
				menuBtn.current?.focus();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<div className="min-h-screen bg-malam md:pl-60">
			<aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/10 bg-[#181a35] md:block">
				<Sidebar account={account} />
			</aside>
			{open && (
				<div className="fixed inset-0 z-40 md:hidden">
					<button
						type="button"
						aria-label="Close menu"
						tabIndex={-1}
						className="drawer-fade absolute inset-0 bg-black/50"
						onClick={() => setOpen(false)}
					/>
					<div
						ref={drawer}
						id="drawer"
						role="dialog"
						aria-modal="true"
						aria-label="Menu"
						className="drawer-in absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-[#181a35] shadow-2xl"
					>
						<Sidebar account={account} />
					</div>
				</div>
			)}
			<div className="flex min-h-screen flex-col">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-malam/90 px-4 backdrop-blur sm:px-6">
					<button
						ref={menuBtn}
						type="button"
						className="-ml-1 rounded-lg p-1.5 text-kertas/80 hover:bg-white/5 focus-visible:outline-lunas md:hidden"
						aria-label="Open menu"
						aria-expanded={open}
						aria-controls="drawer"
						onClick={() => setOpen(true)}
					>
						{icon("M4 7h16M4 12h16M4 17h16")}
					</button>
					<nav aria-label="Breadcrumb" className="min-w-0 flex-1">
						<ol className="flex items-center gap-1.5 text-sm">
							<li className="hidden truncate text-kertas/60 sm:block">
								{account.name}
							</li>
							<li aria-hidden="true" className="hidden text-kertas/30 sm:block">
								/
							</li>
							<li aria-current="page" className="truncate font-medium">
								{title}
							</li>
						</ol>
					</nav>
					<span className="hidden items-center gap-1.5 text-xs text-kertas/70 sm:flex">
						<span className="size-1.5 rounded-full bg-lunas" />
						Gateway online
					</span>
					<a
						href={DEMO}
						className="rounded-lg px-2.5 py-1.5 text-sm text-kertas/80 hover:bg-white/5 hover:text-kertas focus-visible:outline-lunas"
					>
						Try the demo
					</a>
				</header>
				<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
					<h1 className="mb-6 text-2xl font-extrabold">{title}</h1>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
