import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	AuthCard,
	Button,
	ErrorText,
	errMsg,
	Icon,
	Input,
} from "#/components/dash-ui";
import { getMagic, magicKey } from "#/lib/magic";
import { getAccount, signInWithMagic } from "#/server/dash";

export const Route = createFileRoute("/dashboard/login")({
	validateSearch: (s: Record<string, unknown>): { expired?: boolean } => ({
		expired: s.expired === true || s.expired === "true" ? true : undefined,
	}),
	beforeLoad: async () => {
		if (await getAccount()) throw redirect({ to: "/dashboard" });
	},
	head: () => ({ meta: [{ title: "Sign in · Lunaz Dashboard" }] }),
	component: Login,
});

const NOT_CONFIGURED = "Sign-in is not configured. Contact support.";

// Magic RPC codes: -10002 rate limited, -10003 already logged in, -10005 modal closed
function magicError(e: unknown): string {
	const code = (e as { code?: number })?.code;
	if (code === -10005) return "";
	if (code === -10002) return "Too many attempts. Wait a minute and try again.";
	if (code === -10000 || code === -32602) return "Enter a valid email address.";
	return errMsg(e);
}

function Login() {
	const navigate = useNavigate();
	const { expired } = Route.useSearch();
	const [error, setError] = useState(magicKey() ? "" : NOT_CONFIGURED);
	const [busy, setBusy] = useState(false);
	return (
		<AuthCard
			title="Sign in or create an account"
			subtitle="Sign in with your email. We'll send you a one-time code."
			notice={
				expired &&
				!error && (
					<output className="mb-5 flex items-start gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2.5 text-sm">
						<Icon name="alert" className="mt-0.5 size-4 text-[#ffc685]" />
						Your session expired. Sign in again to continue.
					</output>
				)
			}
		>
			<form
				className="space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!magicKey()) return setError(NOT_CONFIGURED);
					const email = String(
						new FormData(e.currentTarget).get("email") ?? "",
					).trim();
					setBusy(true);
					setError("");
					try {
						const magic = await getMagic();
						let didToken: string | null;
						try {
							didToken = await magic.auth.loginWithEmailOTP({ email });
						} catch (err) {
							if ((err as { code?: number })?.code !== -10003) throw err;
							didToken = await magic.user.getIdToken();
						}
						await signInWithMagic({ data: { didToken } });
						await magic.user.logout().catch(() => {});
						await navigate({ to: "/dashboard" });
					} catch (err) {
						setError(magicError(err));
						setBusy(false);
					}
				}}
			>
				<Input
					label="Email"
					id="email"
					type="email"
					autoComplete="email"
					required
				/>
				<ErrorText error={error} />
				<Button
					type="submit"
					variant="primary"
					size="lg"
					className="w-full"
					pending={busy}
				>
					{busy ? "Waiting for code…" : "Continue with email"}
				</Button>
			</form>
			<p className="mt-6 text-xs text-kertas/60">
				Sign-in is handled by Magic. Lunaz only stores your email.
			</p>
		</AuthCard>
	);
}
