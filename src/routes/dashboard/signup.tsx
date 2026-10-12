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
	Input,
	PasswordField,
} from "#/components/dash-ui";
import { getAccount, signup } from "#/server/dash";

export const Route = createFileRoute("/dashboard/signup")({
	beforeLoad: async () => {
		if (await getAccount()) throw redirect({ to: "/dashboard" });
	},
	head: () => ({ meta: [{ title: "Create account · Lunaz Dashboard" }] }),
	component: Signup,
});

function Signup() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<AuthCard
			title="Create your account"
			subtitle="Add your wallet viewing key next."
		>
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
				<Input
					label="Name"
					id="name"
					autoComplete="name"
					hint="Your business or project name."
					required
				/>
				<Input
					label="Email"
					id="email"
					type="email"
					autoComplete="email"
					required
				/>
				<PasswordField
					label="Password"
					hint="At least 8 characters."
					autoComplete="new-password"
					minLength={8}
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
					{busy ? "Creating account…" : "Create account"}
				</Button>
			</form>
			<p className="mt-6 text-sm text-kertas/65">
				Already registered?{" "}
				<Link
					to="/dashboard/login"
					className="dash-focus rounded-sm font-bold text-kertas underline underline-offset-2"
				>
					Sign in
				</Link>
			</p>
		</AuthCard>
	);
}
