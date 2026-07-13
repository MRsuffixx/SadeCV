import { Construction } from "lucide-react";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef1eb] p-6">
      <section className="w-full max-w-xl rounded-[2rem] border border-black/[0.08] bg-white p-8 text-center shadow-[0_30px_100px_rgba(18,63,53,0.12)] sm:p-12">
        <div className="flex justify-center">
          <Brand href="/" />
        </div>
        <div className="mx-auto mt-10 grid size-16 place-items-center rounded-2xl bg-[#e2f0e9] text-[#175442]">
          <Construction size={28} />
        </div>
        <p className="mt-7 text-xs font-extrabold tracking-[0.16em] text-[#277b67] uppercase">
          Scheduled care
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#173a31]">
          We’ll be right back.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#6d7772]">
          SadeCV is receiving a short systems upgrade. Your resumes remain safe
          and will be ready when maintenance is complete.
        </p>
        <Link href="/auth/login" className="button-secondary mt-8">
          Admin sign in
        </Link>
      </section>
    </main>
  );
}
