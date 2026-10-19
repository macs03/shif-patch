type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconClose({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M6 6l12 12" />
      <path {...stroke} d="M18 6L6 18" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path {...stroke} d="M21 3v6h-6" />
    </svg>
  );
}

export function IconSignOut({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path {...stroke} d="M16 17l5-5-5-5" />
      <path {...stroke} d="M21 12H9" />
    </svg>
  );
}

export function IconEye({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle {...stroke} cx={12} cy={12} r={3} />
    </svg>
  );
}

export function IconEyeOff({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path {...stroke} d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path {...stroke} d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path {...stroke} d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path {...stroke} d="M2 2l20 20" />
    </svg>
  );
}
