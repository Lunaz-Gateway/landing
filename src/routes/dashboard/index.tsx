import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { ApiKeys, Invoices, Webhooks } from "#/components/dash-sections";
import {
	btn,
	btn2,
	card,
	ErrorText,
	errMsg,
	input,
} from "#/components/dash-ui";
import { type Account, getAccount, logout, setUfvk } from "#/server/dash";

export const Route = createFileRoute("/dashboard/")({
	beforeLoad: async () => {
		const account = await getAccount();
		if (!account) throw redirect({ to: "/dashboard/login" });
		return { account };
	},
	loader: ({ context }) => context.account,
	head: () => ({ meta: [{ title: "Dashboard — Lunaz" }] }),
	component: Dashboard,
});

const TABS = ["API keys", "Webhooks", "Invoices"] as const;

function Dashboard() {
	const account = Route.useLoaderData();
	const navigate = useNavigate();
	const [tab, setTab] = useState<(typeof TABS)[number]>("API keys");
	return (
		<div className="min-h-screen bg-malam">
			<header className="border-b border-white/10">
				<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
					<a href="/" aria-label="Lunaz home">
						<img
							src="/lunaz-horizontal-on-dark.svg"
							alt="Lunaz"
							width={118}
							height={32}
							className="h-8 w-auto"
						/>
					</a>
					<div className="flex items-center gap-3 text-sm">
						<span className="rounded-full border border-white/20 px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider">
							{account.network === "main" ? "Mainnet" : "Testnet"}
						</span>
						<span className="hidden text-kertas/70 sm:inline">
							{account.email}
						</span>
						<button
							type="button"
							className={btn2}
							onClick={async () => {
								await logout();
								await navigate({ to: "/dashboard/login" });
							}}
						>
							Log out
						</button>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
				{account.ufvk_set ? (
					<>
						<div
							role="tablist"
							aria-label="Dashboard sections"
							className="mb-6 flex gap-1 border-b border-white/10"
						>
							{TABS.map((t) => (
								<button
									key={t}
									type="button"
									role="tab"
									id={`tab-${t}`}
									aria-selected={tab === t}
									aria-controls="panel"
									onClick={() => setTab(t)}
									className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium focus-visible:outline-lunas ${tab === t ? "border-lunas text-kertas" : "border-transparent text-kertas/60 hover:text-kertas"}`}
								>
									{t}
								</button>
							))}
						</div>
						<div role="tabpanel" id="panel" aria-labelledby={`tab-${tab}`}>
							{tab === "API keys" && <ApiKeys />}
							{tab === "Webhooks" && <Webhooks />}
							{tab === "Invoices" && (
								<Invoices goKeys={() => setTab("API keys")} />
							)}
						</div>
					</>
				) : (
					<Onboarding account={account} />
				)}
			</main>
		</div>
	);
}

function Onboarding({ account }: { account: Account }) {
	const router = useRouter();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<section className={`${card} mx-auto max-w-2xl`}>
			<p className="mb-1 font-mono text-xs uppercase tracking-widest text-kertas/60">
				Step 1 of 1 · {account.network === "main" ? "Mainnet" : "Testnet"}
			</p>
			<h1 className="mb-3 text-2xl font-extrabold">Connect your wallet</h1>
			<p className="mb-5 text-kertas/80">
				Paste your wallet's Unified Full Viewing Key. Lunaz can see incoming
				payments with it but can never spend your funds.
			</p>
			<form
				className="space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const ufvk = String(new FormData(e.currentTarget).get("ufvk"));
					setBusy(true);
					setError("");
					try {
						await setUfvk({ data: { ufvk } });
						await router.invalidate();
					} catch (err) {
						setError(errMsg(err));
						setBusy(false);
					}
				}}
			>
				<label htmlFor="ufvk" className="block text-sm font-medium">
					Unified Full Viewing Key
				</label>
				<textarea
					id="ufvk"
					name="ufvk"
					rows={5}
					required
					spellCheck={false}
					aria-describedby="ufvk-note"
					placeholder={account.network === "main" ? "uview1…" : "uviewtest1…"}
					className={`${input} font-mono break-all`}
				/>
				<p id="ufvk-note" className="text-sm text-kertas/70">
					This can only be set once. Check that it is the right wallet before
					you save.
				</p>
				<ErrorText error={error} />
				<button type="submit" className={btn} disabled={busy}>
					{busy ? "Saving…" : "Save key and continue"}
				</button>
			</form>
		</section>
	);
}
