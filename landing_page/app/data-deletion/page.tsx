import type { Metadata } from "next";
import { LegalPage, Section, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — loop",
  description: "How to delete the data Loop holds about you and your Instagram account.",
  robots: { index: true, follow: true },
};

export default function DataDeletion() {
  return (
    <LegalPage
      title="Data Deletion"
      updated="June 10, 2026"
      intro="You can have everything Loop stores about you and your Instagram account deleted at any time. Here is exactly how, what gets deleted, and how you'll know it's done."
    >
      <Section title="Option 1 — Delete from the Loop dashboard (instant)">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Log in to your Loop dashboard.</li>
          <li>Disconnect your Instagram account, or delete your Loop account entirely.</li>
          <li>
            Your stored Instagram data — access tokens, the post IDs your rules target,
            matched-comment records, sent-DM
            history, and automation rules — is deleted from our systems.
          </li>
        </ol>
      </Section>

      <Section title="Option 2 — Remove Loop inside Instagram">
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            In Instagram, go to <em>Settings → Security → Apps and websites</em> (or{" "}
            <em>Website permissions</em>).
          </li>
          <li>Find Loop and choose Remove.</li>
          <li>
            This immediately revokes Loop&apos;s access to your account. To also erase the data we
            already store, use Option 1 or Option 3 — both are available to everyone, including
            after you&apos;ve removed the app.
          </li>
        </ol>
      </Section>

      <Section title="Option 3 — Email us">
        <p>
          Send a request to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from any
          address, mentioning your Instagram username. We action deletion requests promptly and
          always within 30 days.
        </p>
      </Section>

      <Section title="What gets deleted">
        <ul className="list-disc space-y-2 pl-6">
          <li>Instagram access tokens and account identifiers</li>
          <li>The post IDs your automation rules target</li>
          <li>Matched-comment records (comment IDs and commenter user IDs)</li>
          <li>The DMs we sent for you (content and delivery status)</li>
          <li>Your automation rules and account profile</li>
        </ul>
        <p>
          Note: we never store your post content, captions, or images (your post list is fetched
          live from Instagram each time and shown in your browser only), and we never store the
          text of incoming comments — so there is nothing of that kind to delete.
        </p>
        <p>
          The only exception: minimal billing records we are legally required to keep for tax
          purposes, which contain no Instagram data.
        </p>
      </Section>

      <Section title="Confirmation and status">
        <p>
          For dashboard deletions, completion is immediate and confirmed on screen. For email
          requests, we reply with a written confirmation once deletion is complete. If we ever
          could not honour a request (for example, a legally required billing record), we will
          tell you exactly what was retained and why.
        </p>
      </Section>
    </LegalPage>
  );
}
