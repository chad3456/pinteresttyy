type Props = {
  searchParams: Promise<{ from?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { from = "/", error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <form
        action="/api/login"
        method="POST"
        className="w-full max-w-xs flex flex-col gap-5"
      >
        <div className="text-center mb-2">
          <h1 className="text-sm tracking-[0.3em] uppercase text-neutral-400">
            Gallery
          </h1>
        </div>
        <input type="hidden" name="from" value={from} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="bg-transparent border-b border-neutral-700 focus:border-neutral-300 outline-none py-2 text-center text-sm tracking-wide text-neutral-100 placeholder:text-neutral-600 transition-colors"
        />
        {error && (
          <p className="text-center text-xs text-neutral-500">
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          className="mt-2 text-xs tracking-[0.2em] uppercase border border-neutral-700 hover:border-neutral-300 hover:text-white text-neutral-300 py-2 transition-colors"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
