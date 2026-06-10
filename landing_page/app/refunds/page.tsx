import type { Metadata } from "next";
import { LegalPage, Section, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — loop",
  description: "How cancellations and refunds work at Loop.",
  robots: { index: true, follow: true },
};

export default function Refunds() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      updated="June 10, 2026"
      intro="Flat pricing deserves a flat-out simple refund policy."
    >
      <Section title="Cancelling">
        <p>
          Cancel anytime from your dashboard — no emails, no phone calls. Your subscription stays
          active until the end of the period you&apos;ve paid for, and you won&apos;t be charged
          again.
        </p>
      </Section>

      <Section title="Refunds">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>First 7 days:</strong> if Loop isn&apos;t working for you in your first week
            on a new subscription, email us and we&apos;ll refund the month in full.
          </li>
          <li>
            <strong>Service failure:</strong> if a verified outage on our side kept your
            automations down for a significant part of a billing period, we&apos;ll refund or
            credit that period.
          </li>
          <li>
            <strong>Otherwise:</strong> payments for periods already started are non-refundable.
          </li>
        </ul>
        <p>
          Approved refunds are issued to the original payment method within 5–7 business days.
        </p>
      </Section>

      <Section title="How to request">
        <p>
          Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address linked to
          your account with your Instagram username. We respond within 2 business days.
        </p>
      </Section>
    </LegalPage>
  );
}
