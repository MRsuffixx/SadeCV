import Link from "next/link";

export function Brand({
  href = "/",
  inverse = false,
}: {
  href?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="SadeCV home"
      className="inline-flex items-center gap-2.5 font-bold tracking-[-0.03em]"
    >
      <span
        aria-hidden="true"
        className={`grid size-8 place-items-center rounded-[0.65rem] text-sm font-black ${
          inverse ? "bg-[#b8e3d2] text-[#123f35]" : "bg-[#123f35] text-white"
        }`}
      >
        S
      </span>
      <span className={inverse ? "text-white" : "text-[#171a18]"}>
        Sade
        <span className={inverse ? "text-[#b8e3d2]" : "text-[#277b67]"}>
          CV
        </span>
      </span>
    </Link>
  );
}
