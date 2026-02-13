export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Get Started in Three Simple Steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">
            Our streamlined onboarding gets you up and running in minutes, not days.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
          {/* Connecting Line (desktop) */}
          <div className="absolute top-16 right-[16.6%] left-[16.6%] hidden h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 lg:block" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Number Circle */}
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/25">
                {step.number}
              </div>
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    number: '1',
    title: 'Connect Your CRM',
    description:
      'Integrate your existing CRM in one click. We support Salesforce, HubSpot, Pipedrive, and more.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    number: '2',
    title: 'AI Analyzes Your Data',
    description:
      'Our AI scans your pipeline, scores leads, and identifies the highest-value opportunities automatically.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: '3',
    title: 'Close More Deals',
    description:
      'Follow AI-powered recommendations, automate outreach, and watch your conversion rates soar.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];
