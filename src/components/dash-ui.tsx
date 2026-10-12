import type { ReactNode } from "react";

export const errMsg = (e: unknown) =>
	e instanceof Error ? e.message : "Something went wrong";

export const btn =
	"press inline-flex items-center justify-center rounded-full bg-lunas px-5 py-2.5 text-sm font-bold text-malam focus-visible:outline-lunas disabled:opacity-50";
export const btn2 =
	"press inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-kertas hover:border-white/40 focus-visible:outline-lunas disabled:opacity-50";
export const input =
	"w-full rounded-lg border border-white/15 bg-malam px-3 py-2.5 text-sm text-kertas placeholder:text-kertas/40 focus-visible:outline-lunas";
export const card = "rounded-xl border border-white/10 bg-malam-2 p-5 sm:p-6";

export function Field({
	label,
	id,
	...props
}: {
	label: string;
	id: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<div>
			<label htmlFor={id} className="mb-1.5 block text-sm font-medium">
				{label}
			</label>
			<input id={id} name={id} className={input} {...props} />
		</div>
	);
}

export function ErrorText({ error }: { error: string }) {
	return (
		<p
			role="alert"
			className={error ? "text-sm text-[#ff9b8a]" : "sr-only"}
			aria-live="assertive"
		>
			{error}
		</p>
	);
}

export function AuthCard({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<main className="grid min-h-screen place-items-center bg-malam px-5 py-10">
			<div className="w-full max-w-sm">
				<a href="/" aria-label="Lunaz home" className="mb-8 block w-fit">
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={118}
						height={32}
						className="h-8 w-auto"
					/>
				</a>
				<div className={card}>
					<h1 className="mb-5 text-xl font-extrabold">{title}</h1>
					{children}
				</div>
			</div>
		</main>
	);
}
