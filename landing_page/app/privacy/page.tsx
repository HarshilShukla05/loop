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

      <Section title="What we store">
        <p>When you connect your Instagram account and use Loop, we keep:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Your account name</strong> — your Instagram username and account ID, so we
            know which account is yours.
          </li>
          <li>
            <strong>A secure access key</strong> — Instagram gives us a key to act on your behalf.
            We store it encrypted. We never see or store your password.
          </li>
          <li>
            <strong>Your automations</strong> — the keywords, reply messages, and links you set
            up, and the ID of the post each one is attached to.
          </li>
          <li>
            <strong>A record of each reply</strong> — when a comment triggers your automation, we
            note which comment it was and who commented, so the same person is never messaged
            twice for the same comment. We also keep the DM we sent and whether it was delivered,
            so you can see it worked.
          </li>
          <li>
            <strong>The basics every service keeps</strong> — billing records (your card or UPI
            details stay with our payment provider, not us) and short-lived technical logs that
            help us keep Loop secure.
          </li>
        </ul>
      </Section>

      <Section title="What we never store">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Your password</strong> — you log in on Instagram itself, never on Loop.
          </li>
          <li>
            <strong>Your posts and photos</strong> — when you pick a post for an automation, your
            post list is shown live from Instagram. We don&apos;t keep a copy of any caption,
            image, or video.
          </li>
          <li>
            <strong>What people write in comments</strong> — we check each comment for your
            keyword and then let it go. The words themselves are never saved.
          </li>
          <li>
            <strong>Anyone&apos;s private messages</strong> — Loop only sends the reply you wrote.
            We cannot read your inbox or anyone else&apos;s messages.
          </li>
        </ul>
        <p>And we never sell your data. To anyone. Ever.</p>
      </Section>

      <Section title="What you give us permission to do">
        <p>
          When you connect, Instagram shows you a consent screen asking you to approve three
          things. Here is what each one means in plain words:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>See your basic account info and post list</strong> — so we can show which
            account is connected and let you pick a post.{" "}
            <span className="text-muted">(instagram_business_basic)</span>
          </li>
          <li>
            <strong>Read comments on your posts</strong> — so we can spot your keyword the moment
            someone comments it.{" "}
            <span className="text-muted">(instagram_business_manage_comments)</span>
          </li>
          <li>
            <strong>Send DMs on your behalf</strong> — so your reply reaches the person who
            commented. <span className="text-muted">(instagram_business_manage_messages)</span>
          </li>
        </ul>
        <p>
          That&apos;s the whole list. We can&apos;t post for you, change your profile, follow
          anyone, or read your messages.
        </p>
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
          Only as long as you use Loop. Your reply history — which comments we answered and the
          DMs we sent — stays so you can see what Loop did for you. If you disconnect your
          Instagram account or delete your Loop account, all of it is deleted promptly: the access
          key, your automations, and your reply history. We may keep minimal billing records where
          tax law requires it.
        </p>
      </Section>

      <Section title="Deleting your data" id="data-deletion">
        <p>You can have everything Loop stores about you deleted at any time, in any of these ways:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>From your dashboard (instant)</strong> — open your Loop dashboard and choose
            &quot;Delete account &amp; data&quot;. This disconnects your Instagram account and
            erases your account details, automations, and reply history right away.
          </li>
          <li>
            <strong>Email us</strong> — send a request to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your Instagram username,
            and we&apos;ll delete everything and confirm within 30 days.
          </li>
          <li>
            <strong>From Instagram</strong> — go to Instagram&apos;s{" "}
            <em>Settings → Apps and websites</em>, find Loop and remove it. That instantly revokes
            our access; then use either option above to erase what we&apos;ve stored.
          </li>
        </ul>
        <p>
          You can also email us to access or correct any data we hold about you. Whichever way you
          choose, the result is the same: your account, automations, and reply history are removed
          from our systems (we keep nothing else — see &quot;What we never store&quot; above).
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
