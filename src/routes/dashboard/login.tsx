import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import {
	AuthCard,
	Button,
	ErrorText,
	errMsg,
	Icon,
	Input,
	PasswordField,
} from "#/components/dash-ui";
import { getAccount, login } from "#/server/dash";

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

function Login() {
	const navigate = useNavigate();
	const { expired } = Route.useSearch();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<AuthCard
			title="Sign in to Lunaz"
			subtitle="Welcome back. Enter your details to continue."
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
					const f = new FormData(e.currentTarget);
					setBusy(true);
					setError("");
					try {
						await login({
							data: { email: f.get("email"), password: f.get("password") },
						});
						await navigate({ to: "/dashboard" });
					} catch (err) {
						setError(errMsg(err));
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
				<PasswordField
					label="Password"
					autoComplete="current-password"
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
					{busy ? "Signing in…" : "Sign in"}
				</Button>
			</form>
			<p className="mt-6 text-sm text-kertas/65">
				No account?{" "}
				<Link
					to="/dashboard/signup"
					className="dash-focus rounded-sm font-bold text-kertas underline underline-offset-2"
				>
					Create one
				</Link>
			</p>
		</AuthCard>
	);
}
