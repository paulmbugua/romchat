export default function Page() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] px-6 py-16 text-[#0b1c30]">
      <section className="mx-auto max-w-3xl rounded-xl border border-[#c5c6cd] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9d4300]">
          Grogon SACCO Support
        </p>
        <h1 className="font-mont mt-3 text-4xl font-bold">Member messages and support desk</h1>
        <p className="mt-4 leading-7 text-[#44474d]">
          Use the main member portal to open support tickets for KYC, savings, loan repayments,
          dividend payout settings, or credit committee follow-up.
        </p>
        <a
          href="/#support"
          className="mt-6 inline-flex rounded-lg bg-[#fd761a] px-5 py-3 font-bold text-[#341100]"
        >
          Open support desk
        </a>
      </section>
    </main>
  );
}
