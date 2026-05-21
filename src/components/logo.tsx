import { cn } from "@/lib/utils";

/**
 * DeleGate mark.
 *
 * The "D" is the principal's permission box; the green dot is the agent
 * operating inside the granted scope. The whole product in one glyph.
 */
export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-none", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#0A0E1A" />
      <path
        d="M9.5 8.5h6.75a7.5 7.5 0 0 1 0 15H9.5v-15z"
        stroke="#FAFAFA"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="20" cy="16" r="2.2" fill="#10B981" />
    </svg>
  );
}

export function LogoLockup({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-foreground",
        className,
      )}
    >
      <LogoMark size={size} className="text-foreground" />
      <span className="text-[15px] font-semibold tracking-tight">
        Dele<span className="text-muted-foreground">Gate</span>
      </span>
    </span>
  );
}
