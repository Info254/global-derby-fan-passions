import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Global Derby" },
      {
        name: "description",
        content:
          "How Global Derby collects, uses, and protects your data. Written for the Google Play listing and end users.",
      },
      { property: "og:title", content: "Privacy Policy — Global Derby" },
      { property: "og:description", content: "How Global Derby handles your data." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const updated = "July 6, 2026";
  return (
    <div className="min-h-screen bg-navy text-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
            ← Global Derby
          </Link>
          <h1 className="font-display font-extrabold text-4xl uppercase tracking-tighter italic">
            Privacy Policy
          </h1>
          <p className="text-xs text-white/50">Last updated: {updated}</p>
        </header>

        <section className="space-y-3 text-sm text-white/80 leading-relaxed">
          <p>
            Global Derby ("we", "us") is a fan-loyalty companion for the FIFA World Cup. This policy
            explains what we collect, why we collect it, and the choices you have. It is intended for
            end users of the mobile web app and the Android build listed on Google Play.
          </p>
        </section>

        <Section title="Data we collect">
          <ul className="list-disc list-inside space-y-1">
            <li><b>Account</b>: email address and a display name you choose when you sign in.</li>
            <li><b>Loyalty data</b>: nations you stamp, roles (primary / secondary / rival), and the history of switches.</li>
            <li><b>Activity</b>: match predictions, points, and circle memberships you create.</li>
            <li><b>Technical</b>: basic device info (browser, OS) and error logs used to keep the app working.</li>
          </ul>
          <p>We do <b>not</b> collect precise location, contacts, photos, microphone, or SMS data.</p>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc list-inside space-y-1">
            <li>Sign you in and keep your session secure.</li>
            <li>Show your fandom passport, points, and standings.</li>
            <li>Sync live scores and update your progress across devices.</li>
            <li>Debug crashes and improve the product.</li>
          </ul>
        </Section>

        <Section title="Sharing">
          <p>
            We do not sell personal data. Data is processed by our backend host (Lovable Cloud /
            Supabase) and analytics/error tooling strictly to operate the app. We may disclose data
            if required by law.
          </p>
        </Section>

        <Section title="Retention & deletion">
          <p>
            Your account and loyalty history are kept while your account is active. You can request
            deletion at any time by emailing <a className="text-gold underline" href="mailto:privacy@globalderby.app">privacy@globalderby.app</a>.
            We will remove your profile, stamps, points, and circle memberships within 30 days.
          </p>
        </Section>

        <Section title="Children">
          <p>Global Derby is not directed at children under 13. Do not use the app if you are under 13.</p>
        </Section>

        <Section title="Security">
          <p>
            Traffic is encrypted in transit (HTTPS). Access to your data is protected by row-level
            security rules on our database and standard authentication.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on your region (EEA, UK, California), you may have rights to access, correct,
            export, or delete your data, and to object to processing. Contact us using the address
            below to exercise any of these rights.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy. Material changes will be announced in-app. Continued use after
            an update means you accept the revised policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Global Derby — <a className="text-gold underline" href="mailto:privacy@globalderby.app">privacy@globalderby.app</a>
          </p>
        </Section>

        <footer className="pt-8 border-t border-white/10 text-xs text-white/40">
          <Link to="/" className="text-gold uppercase tracking-widest font-bold">← Back to app</Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display font-extrabold text-lg uppercase tracking-tight text-gold">{title}</h2>
      <div className="text-sm text-white/80 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
