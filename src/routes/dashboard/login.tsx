import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, btn, ErrorText, errMsg, Field } from "#/components/dash-ui";
import { getAccount, login } from "#/server/dash";

export const Route = createFileRoute("/dashboard/login")({
	beforeLoad: async () => {
		if (await getAccount()) throw redirect({ to: "/dashboard" });
	},
	head: () => ({ meta: [{ title: "Sign in — Lunaz" }] }),
	component: Login,
});

function Login() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<AuthCard title="Sign in">
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
				<Field
					label="Email"
					id="email"
					type="email"
					autoComplete="email"
					required
				/>
				<Field
					label="Password"
					id="password"
					type="password"
					autoComplete="current-password"
					required
				/>
				<ErrorText error={error} />
				<button type="submit" className={`${btn} w-full`} disabled={busy}>
					{busy ? "Signing in…" : "Sign in"}
				</button>
			</form>
			<p className="mt-5 text-sm text-kertas/70">
				No account?{" "}
				<Link
					to="/dashboard/signup"
					className="font-bold text-kertas underline"
				>
					Create one
				</Link>
			</p>
		</AuthCard>
	);
}
