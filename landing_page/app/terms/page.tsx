import type { Metadata } from "next";
import { LegalPage, Section, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — loop",
  description: "The terms that govern your use of Loop.",
  robots: { index: true, follow: true },
};

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 10, 2026"
      intro="These terms govern your use of Loop. They're short on purpose — please actually read them."
    >
      <Section title="What Loop is">
        <p>
          Loop is a web application that lets you create automations for your own Instagram
          professional account: when someone comments a keyword you chose on your post, Loop sends
          them the DM you wrote, on your behalf. Loop is an independent product and is not
          affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. or Instagram.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You need an Instagram professional (Business or Creator) account to use Loop, and you
          must be at least 18 and authorised to operate that account. You are responsible for
          activity that happens through your Loop account and for keeping your login secure.
        </p>
      </Section>

      <Section title="Acceptable use">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Automations may only message people who have taken an action toward you (commented on
            your post). Using Loop to send unsolicited or bulk messages is prohibited.
          </li>
          <li>
            You must comply with the{" "}
            <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer">
              Meta Platform Terms
            </a>{" "}
            and Instagram&apos;s Community Guidelines. Content you send through Loop is your
            responsibility.
          </li>
          <li>No unlawful, deceptive, or harmful content; no attempts to abuse, probe, or disrupt the service.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these rules.</p>
      </Section>

      <Section title="Subscription and billing">
        <p>
          Loop costs a flat ₹200 per month, billed in advance. Prices include applicable taxes
          unless stated otherwise. You can cancel anytime from the dashboard; your plan stays
          active until the end of the paid period. Refunds are handled per our{" "}
          <a href="/refunds">refund policy</a>. We may change pricing with at least 30 days&apos;
          notice.
        </p>
      </Section>

      <Section title="Service availability">
        <p>
          We aim for Loop to be fast and reliable, but it depends on Instagram&apos;s API, which we
          do not control. Loop is provided &quot;as is&quot; without warranties; we do not
          guarantee uninterrupted service, message delivery, or any particular outcome for your
          account or business.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the maximum extent permitted by law, Loop&apos;s total liability for any claim is
          limited to the amount you paid us in the three months before the claim arose. We are not
          liable for indirect or consequential losses, or for actions Instagram takes on your
          account.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          Loop&apos;s software, design, and brand are ours. Your content and your audience&apos;s
          data remain yours; you grant us only the limited rights needed to run your automations.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using Loop and delete your account at any time. On termination we delete
          your data as described in the <a href="/privacy">privacy policy</a>.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of India. Disputes are subject to the courts of
          India. Contact us first at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> — we
          resolve almost everything by email.
        </p>
      </Section>
    </LegalPage>
  );
}
