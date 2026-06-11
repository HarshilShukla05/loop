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
      updated="June 11, 2026"
      intro="These Terms of Service govern your access to and use of Loop. By creating an account or using Loop you agree to be bound by them — please read them."
    >
      <Section title="1. Agreement to these terms">
        <p>
          Loop (&quot;Loop&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by an
          individual proprietor based in India. By accessing or using the Loop website or web
          application (together, the &quot;Service&quot;), you agree to these Terms and to our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service. If
          you use Loop on behalf of a business, you represent that you are authorised to bind that
          business, and &quot;you&quot; includes it.
        </p>
      </Section>

      <Section title="2. What Loop is">
        <p>
          Loop lets you create automations for your own Instagram professional account: when
          someone comments a keyword you chose on your post or reel, Loop sends them the direct
          message you wrote, on your behalf, and may post a public reply under their comment. Loop
          is an independent product and is <strong>not affiliated with, endorsed by, or sponsored
          by Meta Platforms, Inc. or Instagram</strong>.
        </p>
      </Section>

      <Section title="3. Eligibility and your account">
        <ul className="list-disc space-y-2 pl-6">
          <li>You must be at least 18 years old.</li>
          <li>
            You need an Instagram professional (Business or Creator) account, and you must own or
            be authorised to operate it.
          </li>
          <li>
            You are responsible for all activity that occurs through your Loop account and for
            keeping access to it secure. Notify us immediately of any unauthorised use.
          </li>
          <li>
            The information you provide must be accurate; we may suspend accounts created with
            false information or on someone else&apos;s behalf without authority.
          </li>
        </ul>
      </Section>

      <Section title="4. Instagram and the Meta platform">
        <p>
          The Service works through Meta&apos;s official Instagram API. By connecting your account
          you authorise Loop to access and use your Instagram data as described in the{" "}
          <a href="/privacy">Privacy Policy</a>, and you can revoke that access at any time from
          Instagram&apos;s settings or by deleting your Loop account. You acknowledge that:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Loop depends on Meta&apos;s APIs, policies, and rate limits, which Meta may change,
            restrict, or withdraw at any time without notice to us;
          </li>
          <li>
            features may stop working partly or entirely as a result, and we are not responsible
            for actions Meta or Instagram take regarding your account;
          </li>
          <li>
            your use of Instagram remains governed by Meta&apos;s own terms, including the{" "}
            <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer">
              Meta Platform Terms
            </a>{" "}
            and Instagram&apos;s Terms of Use and Community Guidelines.
          </li>
        </ul>
      </Section>

      <Section title="5. Subscription, billing and refunds">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Loop costs a flat <strong>₹200 per month</strong>, billed in advance. Prices are in
            Indian Rupees and include applicable taxes unless stated otherwise.
          </li>
          <li>
            Payments are processed by third-party payment providers; we do not store your card or
            banking details.
          </li>
          <li>
            Your subscription renews automatically each month until cancelled. You can cancel at
            any time from the dashboard; the Service stays active until the end of the period you
            have paid for, and you will not be charged again.
          </li>
          <li>
            Refunds are handled as described in our <a href="/refunds">Refund Policy</a>.
          </li>
          <li>
            We may change prices with at least <strong>30 days&apos; notice</strong>; changes apply
            from your next billing cycle.
          </li>
        </ul>
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree that you will not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            use Loop to message people who have not taken an action toward you (such as commenting
            on your post) — unsolicited or bulk messaging is prohibited;
          </li>
          <li>
            send content that is unlawful, deceptive, harassing, hateful, infringing, sexually
            exploitative, or otherwise harmful, or that violates Meta&apos;s policies;
          </li>
          <li>
            use the Service for spam, phishing, scams, misleading commercial practices, or to
            collect personal data beyond what the Service is designed for;
          </li>
          <li>
            probe, scan, overload, disrupt, or attempt to gain unauthorised access to the Service,
            or interfere with other users&apos; use of it;
          </li>
          <li>
            copy, resell, sublicense, reverse engineer, or build a competing service from the
            Service, except as permitted by law;
          </li>
          <li>use the Service in violation of any applicable law or regulation.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section, with or without notice,
          and may remove automations that breach it.
        </p>
      </Section>

      <Section title="7. Your content and messages">
        <p>
          You own the content of your automations — the keywords, reply messages, and links you
          configure — and the messages Loop sends on your behalf are <strong>your</strong>{" "}
          messages: you are solely responsible for them and for having the rights to send them.
          You grant us only the limited, non-exclusive licence to store and process that content as
          needed to operate the Service. Your audience&apos;s data remains subject to our{" "}
          <a href="/privacy">Privacy Policy</a>; we do not sell it.
        </p>
      </Section>

      <Section title="8. Intellectual property and feedback">
        <p>
          The Service — its software, design, branding, and content other than yours — is owned by
          us and protected by law. These Terms grant you a limited, non-exclusive,
          non-transferable, revocable right to use the Service for your own business while your
          subscription is active. If you send us feedback or suggestions, you grant us a perpetual,
          royalty-free licence to use them without obligation to you.
        </p>
      </Section>

      <Section title="9. Disclaimers">
        <p>
          The Service is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>,
          without warranties of any kind, express or implied, including merchantability, fitness
          for a particular purpose, and non-infringement. We do not warrant that the Service will
          be uninterrupted, error-free, or secure, that every comment will be detected, that every
          message will be delivered, or that the Service will produce any particular outcome for
          your account, audience, or business. Nothing in these Terms limits rights you have under
          applicable consumer protection law that cannot be limited by contract.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law: (a) we are not liable for any indirect,
          incidental, special, consequential, or punitive damages, or for lost profits, revenues,
          data, or goodwill; (b) we are not liable for actions taken by Meta or Instagram with
          respect to your account; and (c) our total aggregate liability for all claims arising
          out of or relating to the Service is limited to the amounts you paid us in the{" "}
          <strong>three (3) months</strong> preceding the event giving rise to the claim.
        </p>
      </Section>

      <Section title="11. Indemnification">
        <p>
          You agree to indemnify and hold us harmless from and against any claims, liabilities,
          damages, losses, and expenses (including reasonable legal fees) arising out of or
          connected with: (a) your use of the Service; (b) the content of messages sent through
          your automations; (c) your breach of these Terms; or (d) your violation of any law or of
          any third party&apos;s rights, including Meta&apos;s terms and policies.
        </p>
      </Section>

      <Section title="12. Suspension and termination">
        <p>
          You may stop using Loop and delete your account at any time from the dashboard; on
          deletion we remove your data as described in the{" "}
          <a href="/privacy#data-deletion">Privacy Policy</a>. We may suspend or terminate your
          access if you materially breach these Terms, if required by law or by Meta, or if we
          discontinue the Service (in which case we will give reasonable notice and a pro-rata
          refund of any unused paid period). Sections 7–11 and 14 survive termination.
        </p>
      </Section>

      <Section title="13. Changes to the Service or these Terms">
        <p>
          We are a small product that ships often — features may be added, changed, or removed. We
          may also update these Terms from time to time; for material changes we will give notice
          (by email or in the app) at least 15 days before they take effect. Continuing to use the
          Service after changes take effect means you accept them; if you do not, cancel and stop
          using the Service.
        </p>
      </Section>

      <Section title="14. Governing law and disputes">
        <p>
          These Terms are governed by the laws of India, and the courts of India have exclusive
          jurisdiction over any dispute, subject to any mandatory consumer-law rights you may
          have. Before going to court, write to us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> — we resolve almost everything by
          email.
        </p>
      </Section>

      <Section title="15. General">
        <p>
          These Terms, the <a href="/privacy">Privacy Policy</a>, and the{" "}
          <a href="/refunds">Refund Policy</a> are the entire agreement between you and us about
          the Service. If any provision is held unenforceable, the rest remains in effect. Our not
          enforcing a provision is not a waiver of it. You may not assign these Terms; we may
          assign them in connection with a transfer of the Service. Questions? Contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
