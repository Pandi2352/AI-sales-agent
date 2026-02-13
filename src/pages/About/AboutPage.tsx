export function AboutPage() {
  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold text-gray-900">About</h1>
      <p className="mt-4 max-w-3xl text-gray-600">
        AI Sales Agent leverages cutting-edge artificial intelligence to help sales teams
        automate repetitive tasks, identify high-value prospects, and close deals faster
        than ever before.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 text-3xl">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: '\u{1F916}',
    title: 'Smart Automation',
    description: 'Automate follow-ups, scheduling, and outreach with AI-powered workflows.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Analytics Dashboard',
    description: 'Real-time insights into your pipeline, conversion rates, and team performance.',
  },
  {
    icon: '\u{1F680}',
    title: 'Lead Scoring',
    description: 'Prioritize the right prospects with intelligent lead scoring algorithms.',
  },
];
