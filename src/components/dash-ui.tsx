import {
	type ErrorComponentProps,
	isRedirect,
	Link,
	useRouter,
} from "@tanstack/react-router";
import {
	type ButtonHTMLAttributes,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

// Dashboard design system: tokens live in styles.css (dash-* classes), primitives here.

export const errMsg = (e: unknown) =>
	e instanceof Error ? e.message : "Something went wrong";

/* ---------- Icons ---------- */

const PATHS = {
	home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
	key: "M14 10a4 4 0 1 0-3.9 3.1L8 15v2H6v2H3v-3l7.1-7.1M15.5 7.5h.01",
	hook: "M4 12h4l3-7 4 14 3-7h2",
	invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
	settings:
		"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
	docs: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6",
	logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
	copy: "M9 9h11v11H9zM5 15H4V4h11v1",
	check: "M5 12.5l4.5 4.5L19 7.5",
	x: "M6 6l12 12M18 6L6 18",
	menu: "M4 7h16M4 12h16M4 17h16",
	search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
	external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
	alert:
		"M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
	refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
	download: "M12 4v12M6 10l6 6 6-6M4 20h16",
	plus: "M12 5v14M5 12h14",
	arrow: "M5 12h14M13 6l6 6-6 6",
	send: "M21 3L10 14M21 3l-7 18-4-7-7-4z",
	eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
	eyeOff:
		"M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2",
	rotate:
		"M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.2 2.5M18.5 9A7 7 0 0 0 6.3 6.5",
	bank: "M3 10h18M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18M12 3l9 5H3z",
	card: "M3 6h18v12H3zM3 10h18M7 15h4",
	inbox: "M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v6H3v-6z",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({
	name,
	className = "size-4",
}: {
	name: IconName;
	className?: string;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={`shrink-0 ${className}`}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={PATHS[name]} />
		</svg>
	);
}

export function Spinner({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={`dash-spin shrink-0 ${className}`}
			fill="none"
			aria-hidden="true"
		>
			<circle
				cx="12"
				cy="12"
				r="9"
				stroke="currentColor"
				strokeOpacity="0.25"
				strokeWidth="2.5"
			/>
			<path
				d="M21 12a9 9 0 0 0-9-9"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-soft";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
	primary:
		"bg-lunas text-malam font-bold hover:bg-[#d3f584] [&:disabled:not([aria-busy])]:bg-white/[0.08] [&:disabled:not([aria-busy])]:text-kertas/70 [&:disabled:not([aria-busy])]:opacity-100",
	secondary:
		"border border-white/15 bg-white/[0.04] text-kertas font-medium hover:border-white/25 hover:bg-white/[0.08]",
	ghost: "text-kertas/75 font-medium hover:bg-white/[0.07] hover:text-kertas",
	danger: "bg-[#ff8a7a] text-malam font-bold hover:bg-[#ff9d8f]",
	"danger-soft":
		"border border-[#ff8a7a]/30 text-[#ffa597] font-medium hover:border-[#ff8a7a]/60 hover:bg-[#ff8a7a]/10",
};
const SIZES: Record<Size, string> = {
	sm: "h-8 gap-1.5 px-2.5 text-[13px]",
	md: "h-9 gap-2 px-3.5 text-sm",
	lg: "h-11 gap-2 px-5 text-sm",
	icon: "size-8 justify-center",
};

export const button = (variant: Variant = "secondary", size: Size = "md") =>
	`press dash-focus inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]}`;

export function Button({
	variant,
	size,
	pending,
	icon,
	children,
	className = "",
	type = "button",
	disabled,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	size?: Size;
	pending?: boolean;
	icon?: IconName;
}) {
	return (
		<button
			type={type}
			className={`${button(variant, size)} ${className}`}
			disabled={disabled || pending}
			aria-busy={pending || undefined}
			{...props}
		>
			{pending ? <Spinner /> : icon && <Icon name={icon} />}
			{children}
		</button>
	);
}

/* ---------- Form fields ---------- */

export const control =
	"w-full rounded-lg border border-white/[0.13] bg-[#171a36] px-3 text-sm text-kertas placeholder:text-kertas/35 transition-colors duration-150 hover:border-white/25 focus-visible:border-lunas/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-lunas/20 aria-[invalid=true]:border-[#ff8a7a]/70 disabled:opacity-60";

type FieldProps = {
	label: ReactNode;
	hint?: ReactNode;
	error?: string;
	id?: string;
	className?: string;
};

function FieldShell({
	label,
	hint,
	error,
	id,
	className,
	children,
}: FieldProps & { id: string; children: ReactNode }) {
	return (
		<div className={className}>
			<label htmlFor={id} className="mb-1.5 block text-sm font-medium">
				{label}
			</label>
			{children}
			{error ? (
				<p
					id={`${id}-err`}
					className="mt-1.5 flex items-center gap-1.5 text-xs text-[#ffa597]"
				>
					<Icon name="alert" className="size-3.5" />
					{error}
				</p>
			) : (
				hint && (
					<p id={`${id}-hint`} className="mt-1.5 text-xs text-kertas/60">
						{hint}
					</p>
				)
			)}
		</div>
	);
}

const describe = (id: string, p: FieldProps) =>
	p.error ? `${id}-err` : p.hint ? `${id}-hint` : undefined;

export function Input({
	label,
	hint,
	error,
	id,
	className,
	...props
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
	const auto = useId();
	const fid = id ?? auto;
	return (
		<FieldShell {...{ label, hint, error, className }} id={fid}>
			<input
				id={fid}
				name={id}
				className={`${control} h-9`}
				aria-invalid={!!error || undefined}
				aria-describedby={describe(fid, { label, hint, error })}
				{...props}
			/>
		</FieldShell>
	);
}

export function Textarea({
	label,
	hint,
	error,
	id,
	className,
	...props
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
	const auto = useId();
	const fid = id ?? auto;
	return (
		<FieldShell {...{ label, hint, error, className }} id={fid}>
			<textarea
				id={fid}
				name={id}
				className={`${control} py-2`}
				aria-invalid={!!error || undefined}
				aria-describedby={describe(fid, { label, hint, error })}
				{...props}
			/>
		</FieldShell>
	);
}

export function Select({
	label,
	hint,
	error,
	id,
	className,
	children,
	...props
}: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
	const auto = useId();
	const fid = id ?? auto;
	return (
		<FieldShell {...{ label, hint, error, className }} id={fid}>
			<select
				id={fid}
				name={id}
				className={`${control} dash-select h-9 pr-8`}
				aria-invalid={!!error || undefined}
				aria-describedby={describe(fid, { label, hint, error })}
				{...props}
			>
				{children}
			</select>
		</FieldShell>
	);
}

/** Form-level error banner, announced on change */
export function ErrorText({ error }: { error: string }) {
	return (
		<p
			role="alert"
			className={
				error
					? "flex items-start gap-2 rounded-lg border border-[#ff8a7a]/25 bg-[#ff8a7a]/[0.08] px-3 py-2 text-sm text-[#ffb3a8]"
					: "sr-only"
			}
		>
			{error && <Icon name="alert" className="mt-0.5 size-4" />}
			{error}
		</p>
	);
}

/* ---------- Surfaces ---------- */

export function Card({
	title,
	description,
	actions,
	children,
	footer,
	flush,
	className = "",
	id,
}: {
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
	flush?: boolean;
	className?: string;
	id?: string;
}) {
	const hid = useId();
	return (
		<section
			id={id}
			aria-labelledby={title ? hid : undefined}
			className={`dash-card ${className}`}
		>
			{(title || actions) && (
				<header
					className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 ${flush ? "pb-4" : ""}`}
				>
					<div className="min-w-0">
						{title && (
							<h2 id={hid} className="text-[15px] font-bold">
								{title}
							</h2>
						)}
						{description && (
							<p className="mt-1 text-sm text-kertas/65">{description}</p>
						)}
					</div>
					{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
				</header>
			)}
			{children &&
				(flush ? children : <div className="p-5 pt-4">{children}</div>)}
			{footer && (
				<footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-3 text-xs text-kertas/60">
					{footer}
				</footer>
			)}
		</section>
	);
}

export function PageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div className="min-w-0">
				<h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
				{description && (
					<div className="mt-1 min-h-5 text-sm text-kertas/65">
						{description}
					</div>
				)}
			</div>
			{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
		</div>
	);
}

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "muted";
const TONES: Record<Tone, string> = {
	success: "bg-lunas/[0.12] text-lunas ring-lunas/25",
	warning: "bg-[#ffb86b]/[0.12] text-[#ffc685] ring-[#ffb86b]/25",
	danger: "bg-[#ff8a7a]/[0.12] text-[#ffa597] ring-[#ff8a7a]/25",
	info: "bg-[#8fb8ff]/[0.12] text-[#a9c8ff] ring-[#8fb8ff]/25",
	neutral: "bg-white/[0.07] text-kertas/85 ring-white/15",
	muted: "bg-white/[0.03] text-kertas/55 ring-white/10",
};

export function Badge({
	tone = "neutral",
	dot,
	children,
}: {
	tone?: Tone;
	dot?: boolean;
	children: ReactNode;
}) {
	return (
		<span
			className={`inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
		>
			{dot && <span className="size-1.5 rounded-full bg-current" />}
			{children}
		</span>
	);
}

export function Skeleton({ className = "h-4 w-24" }: { className?: string }) {
	return <span className={`dash-skeleton block rounded-md ${className}`} />;
}

export function EmptyState({
	icon = "inbox",
	title,
	children,
	action,
}: {
	icon?: IconName;
	title: string;
	children?: ReactNode;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center px-6 py-12 text-center">
			<span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-kertas/70">
				<Icon name={icon} className="size-5" />
			</span>
			<p className="font-bold">{title}</p>
			{children && (
				<div className="mt-1 max-w-sm text-sm text-kertas/65">{children}</div>
			)}
			{action && <div className="mt-5">{action}</div>}
		</div>
	);
}

/** CSS tooltip on hover/focus; label is also exposed to assistive tech via aria-label on the trigger */
export function Tip({
	label,
	children,
	side = "top",
}: {
	label: string;
	children: ReactNode;
	side?: "top" | "bottom";
}) {
	return (
		<span className="dash-tip" data-tip={label} data-side={side}>
			{children}
		</span>
	);
}

/* ---------- Tables (stack into cards below sm) ---------- */

export const th =
	"h-10 px-4 text-left text-xs font-medium whitespace-nowrap text-kertas/55";
export const td = "px-4 py-3 align-middle whitespace-nowrap";

export function Table({
	caption,
	head,
	children,
}: {
	caption: string;
	head: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="dash-table-wrap">
			<table className="dash-table w-full text-sm">
				<caption className="sr-only">{caption}</caption>
				<thead>
					<tr>{head}</tr>
				</thead>
				<tbody>{children}</tbody>
			</table>
		</div>
	);
}

/* ---------- Dialog / sheet (native <dialog>: focus trap, Esc, top layer) ---------- */

export function Dialog({
	open,
	onClose,
	title,
	description,
	children,
	footer,
	variant = "modal",
	labelledBy,
	initialFocus,
}: {
	open: boolean;
	onClose: () => void;
	title?: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
	variant?: "modal" | "sheet" | "nav";
	labelledBy?: string;
	initialFocus?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const hid = useId();
	useEffect(() => {
		const d = ref.current;
		if (!d) return;
		if (open && !d.open) {
			d.showModal();
			// "self" parks focus on the dialog so Tab starts at its first control
			const el =
				initialFocus === "self"
					? d
					: initialFocus
						? d.querySelector<HTMLElement>(initialFocus)
						: null;
			el?.focus({ preventScroll: true });
		} else if (!open && d.open) d.close();
	}, [open, initialFocus]);
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is a pointer convenience; Esc closes for keyboards
		<dialog
			ref={ref}
			className={`dash-dialog dash-dialog-${variant}`}
			tabIndex={-1}
			aria-labelledby={labelledBy ?? (title ? hid : undefined)}
			onClose={onClose}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			{variant === "nav" ? (
				children
			) : (
				<div className="flex max-h-full min-h-0 flex-col">
					<header className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
						<div className="min-w-0">
							{title && (
								<h2 id={hid} className="text-base font-bold">
									{title}
								</h2>
							)}
							{description && (
								<div className="mt-1 text-sm text-kertas/65">{description}</div>
							)}
						</div>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className={`${button("ghost", "icon")} -mt-1 -mr-1.5`}
						>
							<Icon name="x" />
						</button>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
						{children}
					</div>
					{footer && (
						<footer className="flex flex-wrap justify-end gap-2 border-t border-white/[0.08] px-5 py-3.5">
							{footer}
						</footer>
					)}
				</div>
			)}
		</dialog>
	);
}

export function ConfirmDialog({
	open,
	onClose,
	title,
	children,
	confirmLabel,
	onConfirm,
	danger = true,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	confirmLabel: string;
	onConfirm: () => Promise<unknown>;
	danger?: boolean;
}) {
	const [busy, setBusy] = useState(false);
	return (
		<Dialog
			open={open}
			onClose={() => !busy && onClose()}
			title={title}
			description={children}
			initialFocus="[data-cancel]"
			footer={
				<>
					<Button data-cancel onClick={onClose} disabled={busy}>
						Cancel
					</Button>
					<Button
						variant={danger ? "danger" : "primary"}
						pending={busy}
						onClick={async () => {
							setBusy(true);
							try {
								await onConfirm();
								onClose();
							} finally {
								setBusy(false);
							}
						}}
					>
						{confirmLabel}
					</Button>
				</>
			}
		/>
	);
}

/* ---------- Toasts ---------- */

type ToastT = { id: number; msg: string; tone: "success" | "error" | "info" };
let toasts: ToastT[] = [];
const subs = new Set<() => void>();
const emit = () => {
	for (const f of subs) f();
};
const NONE: ToastT[] = [];
let seq = 0;

export function dismissToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
	emit();
}

export function toast(msg: string, tone: ToastT["tone"] = "success") {
	const id = ++seq;
	toasts = [...toasts, { id, msg, tone }].slice(-3);
	emit();
	setTimeout(() => dismissToast(id), tone === "error" ? 7000 : 3500);
}

export function Toaster() {
	const list = useSyncExternalStore(
		(f) => {
			subs.add(f);
			return () => subs.delete(f);
		},
		() => toasts,
		() => NONE,
	);
	return (
		<section
			aria-label="Notifications"
			aria-live="polite"
			className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto"
		>
			{list.map((t) => (
				<div
					key={t.id}
					role={t.tone === "error" ? "alert" : "status"}
					className="dash-toast pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-white/[0.12] bg-[#2b2f5c] py-3 pr-2 pl-3.5 text-sm shadow-[0_12px_32px_-8px_rgb(0_0_0/0.5)]"
				>
					<span
						className={`mt-px ${t.tone === "error" ? "text-[#ffa597]" : t.tone === "info" ? "text-kertas/70" : "text-lunas"}`}
					>
						<Icon name={t.tone === "error" ? "alert" : "check"} />
					</span>
					<p className="min-w-0 flex-1 break-words">{t.msg}</p>
					<button
						type="button"
						aria-label="Dismiss"
						onClick={() => dismissToast(t.id)}
						className="dash-focus -my-1 grid size-7 place-items-center rounded-md text-kertas/60 hover:bg-white/[0.07] hover:text-kertas"
					>
						<Icon name="x" className="size-3.5" />
					</button>
				</div>
			))}
		</section>
	);
}

/**
 * Run a server action with toasts. Session expiry (a redirect thrown by the
 * server function) navigates to sign-in instead of showing an error.
 */
export function useAction() {
	const router = useRouter();
	const [busy, setBusy] = useState<string | null>(null);
	async function run<T>(
		key: string,
		fn: () => Promise<T>,
		ok?: string | ((r: T) => string | [string, ToastT["tone"]]),
	): Promise<T | undefined> {
		setBusy(key);
		try {
			const r = await fn();
			const m = typeof ok === "function" ? ok(r) : ok;
			if (m) Array.isArray(m) ? toast(...m) : toast(m);
			return r;
		} catch (e) {
			if (isRedirect(e)) {
				await router.navigate(e.options);
				return;
			}
			toast(errMsg(e), "error");
		} finally {
			setBusy(null);
		}
	}
	return { run, busy };
}

/* ---------- Copy ---------- */

export async function copyText(text: string, what = "Copied to clipboard") {
	try {
		await navigator.clipboard.writeText(text);
		toast(what);
		return true;
	} catch {
		toast("Couldn't copy. Select the text and copy it manually.", "error");
		return false;
	}
}

export function CopyButton({
	text,
	label = "Copy",
	toastMsg,
	variant = "secondary",
	size = "md",
	iconOnly,
}: {
	text: string;
	label?: string;
	toastMsg?: string;
	variant?: Variant;
	size?: Size;
	iconOnly?: boolean;
}) {
	const [done, setDone] = useState(false);
	const onClick = async () => {
		if (await copyText(text, toastMsg)) {
			setDone(true);
			setTimeout(() => setDone(false), 1500);
		}
	};
	if (iconOnly)
		return (
			<button
				type="button"
				onClick={onClick}
				aria-label={label}
				className="dash-focus inline-grid size-6 shrink-0 place-items-center rounded-md text-kertas/60 transition-colors hover:bg-white/[0.08] hover:text-kertas"
			>
				<Icon name={done ? "check" : "copy"} className="size-3.5" />
			</button>
		);
	return (
		<Button
			variant={variant}
			size={size}
			icon={done ? "check" : "copy"}
			onClick={onClick}
		>
			{done ? "Copied" : label}
		</Button>
	);
}

/** Truncated mono value with a copy affordance */
export function Mono({
	value,
	head = 8,
	tail = 6,
	label = "Copy",
	full,
}: {
	value: string;
	head?: number;
	tail?: number;
	label?: string;
	full?: boolean;
}) {
	const short =
		full || value.length <= head + tail + 1
			? value
			: `${value.slice(0, head)}…${value.slice(-tail)}`;
	return (
		<span className="inline-flex min-w-0 max-w-full items-center gap-1">
			<span
				className={`font-mono text-[13px] ${full ? "break-all" : "truncate"}`}
				title={full ? undefined : value}
			>
				{short}
			</span>
			<CopyButton text={value} label={label} iconOnly />
		</span>
	);
}

/* ---------- Formatting ---------- */

export const zec = (z: number) =>
	z === 0 ? "0" : (z / 1e8).toFixed(8).replace(/\.?0+$/, "");

export function Amount({ zat, muted }: { zat: number; muted?: boolean }) {
	return (
		<span className={`tabular-nums ${muted ? "text-kertas/55" : ""}`}>
			{zec(zat)} <span className="text-kertas/55">ZEC</span>
		</span>
	);
}

const rtf =
	typeof Intl !== "undefined"
		? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
		: null;
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["minute", 60],
	["hour", 3600],
	["day", 86400],
	["month", 2592000],
	["year", 31536000],
];

export function ago(s: number) {
	const d = s - Date.now() / 1000;
	if (Math.abs(d) < 45) return d < 0 ? "just now" : "in a moment";
	let u = UNITS[0];
	for (const x of UNITS) if (Math.abs(d) >= x[1]) u = x;
	return rtf?.format(Math.round(d / u[1]), u[0]) ?? "";
}

export const absolute = (s: number) =>
	new Date(s * 1000).toLocaleString("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
	});

const noop = () => () => {};
/** false during SSR and hydration, true after; avoids server/client clock and timezone mismatches */
export const useHydrated = () =>
	useSyncExternalStore(
		noop,
		() => true,
		() => false,
	);

// Re-render relative times every 30s
let tick = 0;
const tickSubs = new Set<() => void>();
if (typeof window !== "undefined")
	setInterval(() => {
		tick++;
		for (const f of tickSubs) f();
	}, 30_000);
const useTick = () =>
	useSyncExternalStore(
		(f) => {
			tickSubs.add(f);
			return () => tickSubs.delete(f);
		},
		() => tick,
		() => 0,
	);

/** Relative time with the absolute local time in a tooltip */
export function Time({
	s,
	empty = "—",
	absoluteOnly,
}: {
	s: number | null;
	empty?: string;
	absoluteOnly?: boolean;
}) {
	const hydrated = useHydrated();
	useTick();
	if (!s) return <span className="text-kertas/55">{empty}</span>;
	const iso = new Date(s * 1000).toISOString();
	if (absoluteOnly)
		return (
			<time dateTime={iso} suppressHydrationWarning>
				{hydrated ? absolute(s) : iso.slice(0, 16).replace("T", " ")}
			</time>
		);
	return (
		<Tip label={hydrated ? absolute(s) : iso}>
			<time dateTime={iso} suppressHydrationWarning>
				{ago(s)}
			</time>
		</Tip>
	);
}

/* ---------- Auth layout ---------- */

const points = [
	[
		"Non-custodial",
		"Viewing keys only. Lunaz can see payments, never spend them.",
	],
	["Private by default", "A fresh shielded address for every invoice."],
	[
		"Signed webhooks",
		"HMAC-SHA256 on every delivery, verified with your secret.",
	],
];

const REQ = `POST /v1/invoices
Authorization: Bearer lz_...

{ "amount_zat": 10000 }`;
const HOOK = `X-Lunaz-Signature: t=1791914886,v1=8e13de7b...

{
  "id": "5dafb709-...",
  "type": "invoice.paid",
  "status": "paid",
  "received_zat": 10000
}`;

export function AuthCard({
	title,
	subtitle,
	notice,
	children,
}: {
	title: string;
	subtitle: string;
	notice?: ReactNode;
	children: ReactNode;
}) {
	useEffect(() => {
		document.getElementById("email")?.focus();
	}, []);
	return (
		<div className="grid min-h-dvh bg-malam lg:grid-cols-2">
			<main className="flex flex-col px-5 py-6 sm:px-12 sm:py-8">
				<div className="flex items-center justify-between">
					<a href="/" aria-label="Lunaz home" className="dash-focus rounded-md">
						<img
							src="/lunaz-horizontal-on-dark.svg"
							alt="Lunaz"
							width={118}
							height={32}
							className="h-7 w-auto sm:h-8"
						/>
					</a>
					<a href="/" className={button("ghost", "sm")}>
						Back to site
					</a>
				</div>
				<div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-14 pb-10 sm:justify-center sm:py-10">
					<h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
					<p className="mt-1.5 mb-7 text-sm text-kertas/65">{subtitle}</p>
					{notice}
					{children}
				</div>
			</main>
			<aside
				aria-hidden="true"
				className="relative hidden flex-col justify-center gap-8 overflow-hidden border-l border-white/10 bg-malam-2 p-12 lg:flex"
				style={{
					backgroundImage:
						"radial-gradient(rgb(246 242 233 / 0.12) 1px, transparent 1px)",
					backgroundSize: "22px 22px",
				}}
			>
				<div className="max-w-md space-y-3">
					{[REQ, HOOK].map((c) => (
						<pre
							key={c}
							className="overflow-hidden rounded-xl border border-white/10 bg-malam p-4 font-mono text-xs leading-relaxed text-kertas/90 shadow-xl"
						>
							{c}
						</pre>
					))}
				</div>
				<ul className="max-w-md space-y-4">
					{points.map(([h, b]) => (
						<li key={h} className="text-sm">
							<span className="font-bold text-lunas">{h}</span>
							<span className="text-kertas/70"> — {b}</span>
						</li>
					))}
				</ul>
			</aside>
		</div>
	);
}

/* ---------- Route states ---------- */

export function Centered({
	icon,
	title,
	children,
	actions,
}: {
	icon: IconName;
	title: string;
	children: React.ReactNode;
	actions: React.ReactNode;
}) {
	return (
		<div className="dash-card mx-auto mt-6 flex max-w-md flex-col items-center px-6 py-12 text-center">
			<span className="mb-4 grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-kertas/75">
				<Icon name={icon} className="size-5" />
			</span>
			<h1 className="text-lg font-bold">{title}</h1>
			<div className="mt-1.5 text-sm text-kertas/65">{children}</div>
			<div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
		</div>
	);
}

export function PageError({ error, reset }: ErrorComponentProps) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	return (
		<Centered
			icon="alert"
			title="Something went wrong"
			actions={
				<>
					<Button
						variant="primary"
						icon="refresh"
						pending={busy}
						onClick={async () => {
							setBusy(true);
							reset();
							await router.invalidate();
							setBusy(false);
						}}
					>
						Try again
					</Button>
					<a href="/dashboard" className={button()}>
						Go to overview
					</a>
				</>
			}
		>
			<p>
				{/fetch|network/i.test(errMsg(error))
					? "Couldn't reach the server. Check your connection."
					: errMsg(error)}
			</p>
			<p className="mt-1">
				If this keeps happening, the Lunaz API may be down.
			</p>
		</Centered>
	);
}

export function DashNotFound() {
	return (
		<Centered
			icon="search"
			title="Page not found"
			actions={
				<Link to="/dashboard" className={button("primary")}>
					Back to overview
				</Link>
			}
		>
			This dashboard page doesn't exist. Check the address or pick a section
			from the menu.
		</Centered>
	);
}
