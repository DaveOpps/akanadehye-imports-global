type Props = { className?: string; mark?: "navy" | "gold" | "white" };

export default function Logo({ className = "", mark = "navy" }: Props) {
  const color =
    mark === "gold" ? "#d4a951" : mark === "white" ? "#ffffff" : "#0a1628";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="19" stroke={color} strokeWidth="2" />
        <path
          d="M8 20 H32 M20 8 V32 M11 11 L29 29 M29 11 L11 29"
          stroke={color}
          strokeWidth="1.2"
          opacity="0.45"
        />
        <path
          d="M14 22 L20 12 L26 22 Z"
          fill="#d4a951"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="26" r="2" fill={color} />
      </svg>
      <div className="leading-tight">
        <div
          className="font-bold text-[15px] tracking-tight"
          style={{ color }}
        >
          AKANADEHYE
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.18em] opacity-70"
          style={{ color }}
        >
          Imports Global
        </div>
      </div>
    </div>
  );
}
