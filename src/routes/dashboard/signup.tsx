import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, btn, ErrorText, errMsg, Field } from "#/components/dash-ui";
import { getAccount, signup } from "#/server/dash";

export const Route = createFileRoute("/dashboard/signup")({
	beforeLoad: async () => {
		if (await getAccount()) throw redirect({ to: "/dashboard" });
	},
	head: () => ({ meta: [{ title: "Create account — Lunaz" }] }),
	component: Signup,
});

function Signup() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<AuthCard title="Create your account">
			<form
				className="space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const f = new FormData(e.currentTarget);
					setBusy(true);
					setError("");
					try {
						await signup({
							data: {
								name: f.get("name"),
								email: f.get("email"),
								password: f.get("password"),
							},
						});
						await navigate({ to: "/dashboard" });
					} catch (err) {
						setError(errMsg(err));
						setBusy(false);
					}
				}}
			>
				<Field label="Name" id="name" autoComplete="name" required />
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
					autoComplete="new-password"
					minLength={8}
					required
				/>
				<ErrorText error={error} />
				<button type="submit" className={`${btn} w-full`} disabled={busy}>
					{busy ? "Creating…" : "Create account"}
				</button>
			</form>
			<p className="mt-5 text-sm text-kertas/70">
				Already registered?{" "}
				<Link to="/dashboard/login" className="font-bold text-kertas underline">
					Sign in
				</Link>
			</p>
		</AuthCard>
	);
}
