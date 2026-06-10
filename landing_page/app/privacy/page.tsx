import type { Metadata } from "next";
import { LegalPage, Section, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — loop",
  description: "How Loop collects, uses, stores, and deletes your data.",
  robots: { index: true, follow: true },
};

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 10, 2026"
      intro="Loop turns comments on your Instagram posts into automatic DMs. To do that we need access to some of your Instagram data. This policy explains exactly what we collect, why, who we share it with, and how you can have it deleted — in plain language."
    >
      <Section title="Who we are">
        <p>
          Loop (&quot;Loop&quot;, &quot;we&quot;, &quot;us&quot;) operates the website and web
          application that provide comment-to-DM automation for Instagram professional accounts.
          For any privacy matter, contact us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Section>

      <Section title="Data we collect and process">
        <p>When you connect your Instagram professional account, we process via Meta&apos;s Instagram API:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account basics</strong> — your Instagram account ID and username, and the
            access token Meta issues so we can act on your behalf.
          </li>
          <li>
            <strong>Your media</strong> — the list of your posts and reels (IDs, captions,
            thumbnails) so you can choose which post an automation applies to.
          </li>
          <li>
            <strong>Comments on your posts</strong> — the comment text, comment ID, and the
            commenter&apos;s ID/username, delivered to us by Meta&apos;s webhooks, so we can match
            them against your keywords.
          </li>
          <li>
            <strong>Messages we send</strong> — the content and delivery status of the DMs your
            automations send.
          </li>
        </ul>
        <p>Directly from you, we collect:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Automation settings</strong> — keywords, reply messages, and links you configure.
          </li>
          <li>
            <strong>Billing details</strong> — handled by our payment processor; we never see or
            store your full card or UPI credentials.
          </li>
          <li>
            <strong>Technical logs</strong> — IP address, browser type, and timestamps, kept
            briefly for security and debugging.
          </li>
        </ul>
      </Section>

      <Section title="How and why we use it">
        <p>
          We use this data for exactly one purpose: to run the automations you configure —
          watching comments on your posts for your keywords and sending the DM you wrote to the
          person who commented. We also use account data to show you your own dashboard and
          activity, and logs to keep the service secure and reliable.
        </p>
        <p>
          We do <strong>not</strong> sell or license your data to anyone, use it for advertising,
          build profiles of commenters, or use it for any purpose not described here. We process
          Instagram data strictly in accordance with the{" "}
          <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer">
            Meta Platform Terms
          </a>
          .
        </p>
      </Section>

      <Section title="Who we share it with">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Meta Platforms</strong> — we exchange data with Instagram&apos;s API to operate
            the service (that is how the product works).
          </li>
          <li>
            <strong>Service providers</strong> — our hosting and infrastructure providers store
            data on our behalf under contractual confidentiality.
          </li>
          <li>
            <strong>Payment processor</strong> — to handle your subscription.
          </li>
          <li>
            <strong>Legal requirements</strong> — if a law or valid legal process requires it.
          </li>
        </ul>
        <p>No one else. We never sell data.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Only as long as needed to run your automations. Comment events are processed and then
          retained only as activity history for your dashboard. If you disconnect your Instagram
          account or delete your Loop account, we promptly delete your Instagram data, including
          stored tokens, media metadata, comment history, and message history. We may retain
          minimal billing records where tax law requires it.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>Every Loop user can have their data deleted, at any time, in any of these ways:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Self-service</strong> — disconnect your Instagram account or delete your Loop
            account from the dashboard.
          </li>
          <li>
            <strong>Email</strong> — send a deletion request to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; we confirm completion within
            30 days.
          </li>
          <li>
            <strong>Via Instagram</strong> — remove Loop from your Instagram account&apos;s
            connected apps; Meta notifies us and we delete your data.
          </li>
        </ul>
        <p>
          Full instructions live at <a href="/data-deletion">loop&apos;s data deletion page</a>.
          You can also ask us to correct any data we hold about you.
        </p>
      </Section>

      <Section title="Security">
        <p>
          All traffic is encrypted in transit (HTTPS). Access tokens are stored encrypted, access
          to production systems is restricted, and webhook payloads are verified against
          Meta&apos;s signatures before we process them.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live (including under India&apos;s DPDP Act and the EU/UK GDPR),
          you may have rights to access, correct, delete, or export your data, and to withdraw
          consent. Email us and we will honour them. If you are in the EU/UK you may also lodge a
          complaint with your supervisory authority.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Loop is for Instagram professional accounts and is not directed at children. We do not
          knowingly collect data from anyone under 18.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we will update this page and the date at the top, and notify
          you in the app for material changes. The current version always lives at this URL.
        </p>
      </Section>
    </LegalPage>
  );
}
