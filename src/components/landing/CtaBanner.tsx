import { Link } from 'react-router-dom';

export function CtaBanner() {
  return (
    <section className="bg-[#0B1120] py-24">
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[300px] w-[500px] rounded-full bg-blue-600/15 blur-[100px]" />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform Your Sales?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Join hundreds of high-performing sales teams already using AI Sales Agent
            to close more deals and grow faster.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/setup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
            >
              Start Free Trial
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#"
              className="text-sm font-semibold text-gray-400 transition-colors hover:text-white"
            >
              Schedule a demo &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
