# Meta Instagram API — App Review & Advanced Access Requirements

> Goal: get **Advanced Access** for the Loop app so it can serve creators we don't
> own/manage (i.e. real customers). This doc is the single checklist for what Meta
> requires, what we must build/finish first, and exactly what the screencasts must
> show — which drives the frontend UI/UX redesign.
>
> Last verified against Meta docs: June 2026 (Graph API `v23.0`, Instagram API with
> Instagram Login).

---

## 0. TL;DR — the critical path

1. **We CAN test with live data today.** Standard Access (no review) works for any
   Instagram professional account that has a **role on the app** (Admin/Developer/
   Tester added in App Dashboard → App Roles → Instagram Testers). Webhooks fire,
   OAuth works, DMs send. "App not live" only blocks *third-party* users.
2. Finish **Flow B (DM outbox worker)** — review requires at least one successful
   API call per permission in the last 30 days, and the screencast must show a DM
   actually arriving in a real Instagram inbox.
3. Complete the **app settings checklist** (privacy policy, data deletion, icon, etc.).
4. **Business Verification** of the Meta Business portfolio connected to the app.
5. Redesign dashboard UI to be **screencast-ready** (see §6), record one screencast
   **per permission**, write per-permission use-case descriptions, submit.

---

## 1. Access levels — why we need Advanced Access

| Level | Who can use the app | Review needed |
|---|---|---|
| Standard Access | Only IG professional accounts with a role on the app / in the app's Business | No |
| Advanced Access | Any third-party IG professional account (our customers) | **App Review + Business Verification** |

- Loop is a tech provider serving accounts we don't manage → Advanced Access is mandatory.
- Only **Web** is supported as a platform for Instagram API with Instagram Login —
  reviewer will test our web app.

## 2. Permissions we request (and what each must demonstrate)

These match `server/internal/instagram/connector.go:29-33`.

### `instagram_business_basic` (dependency of the other two)
- Allowed usage: get basic metadata of an IG professional account.
- Screencast must show: Instagram OAuth login → consent screen granting the
  permission → our app displaying the fetched username/account info (we do this on
  the dashboard's connected-account section).

### `instagram_business_manage_comments`
- Allowed usage: read/manage comments on the account's media.
- Screencast must show: login + grant → a comment being read/used by the app —
  for us: a comment with the trigger keyword appearing on a post, and the app
  reacting to it (rule match). Show **both our app UI and the native Instagram
  app/web** so the reviewer sees the real comment.

### `instagram_business_manage_messages`
- Allowed usage: view, manage, and respond to messages (CRM-style tools).
- Screencast must show: login + grant → an **actual message being sent and arriving
  in the Instagram inbox** (web or mobile shown on screen). Screenshots are not
  accepted — must be a recording of real transmission.
- Messaging policy constraints we must respect (and should show):
  - DMs can only be sent in response to a user action (their comment/message) —
    our comment→DM private-reply flow satisfies this.
  - **24-hour messaging window**: replies must go out within 24h of the user's
    comment/message. Automated content is only allowed inside this window.
  - **Human Agent** (optional extra feature, separate review) extends the window
    to 7 days for human responses — not needed for v1; don't request it.

> ⚠️ Each permission needs its **own** use-case description (copy-pasted text
> between permissions is an explicit rejection reason) and its **own** screencast
> evidence. Requesting a permission we don't visibly use = rejection.

## 3. App settings checklist (App Dashboard)

- [ ] **App icon** 1024×1024, no Meta/Instagram trademarks or logos in it
- [ ] **Privacy Policy URL** — publicly reachable, shown on the consent screen
      (host on the landing page, e.g. `/privacy`)
- [ ] **Data Deletion** instructions URL or callback endpoint
- [ ] **App category** selected
- [ ] **Business email** set (review results go there)
- [ ] **App Domains / Site URL** + valid OAuth **redirect URI** (must be HTTPS in prod)
- [ ] Webhook endpoint live over HTTPS with verify token configured
      (`/webhooks/instagram`, `META_WEBHOOK_VERIFY_TOKEN`)

## 4. Business Verification

- Required for Advanced Access. Connect the app to a Meta **Business portfolio**:
  App Dashboard → Settings → Basic → Verification.
- A person with **Admin role on the Business** completes verification in Business
  Manager ("Start Business Verification").
- Documents (typical for India): legal business name + address proof — e.g. GST
  registration / certificate of incorporation / utility bill matching the business
  name; plus confirming a business phone/email/domain. A sole proprietor can verify
  with applicable local registration documents.
- Do this **in parallel** early — it can take days to weeks and review can't pass
  without it.

## 5. Pre-submission technical requirements

- [ ] **≥1 successful API call per requested permission within 30 days** of
      submission (logged by Meta within ~2 days). Concretely:
      - `GET /me` (basic) ✅ already implemented
      - comments read via webhook/Graph call (manage_comments)
      - `POST .../messages` DM send (manage_messages) → **requires Flow B worker done**
- [ ] **Test credentials for the reviewer**: a dedicated test login to OUR web app
      (do not give personal Meta credentials). Reviewer must be able to log in and
      replicate the whole flow themselves — if they can't reproduce it, they reject.
- [ ] **Step-by-step reviewer instructions** for the web platform: URL, login,
      how to connect IG, how to create a rule, which post to comment on, what DM
      to expect.
- [ ] A test Instagram **professional** account wired up end-to-end (added as
      Instagram Tester in App Roles so everything works pre-approval).
- [ ] `POST /{ig-user-id}/subscribed_apps` succeeding (already implemented in
      `connector.go:121-129`).

## 6. Screencast requirements (drives the UI/UX redesign)

Official technical/presentation rules:

- **1080p minimum**, recorded at monitor width **≤1440px**, full-screen or full-window
  capture only.
- **Reviewers do NOT listen to audio** — narration is ignored. Use **on-screen
  captions/tooltips** to explain anything not self-evident. (Common advice online
  says "speak aloud" — Meta's own submission guide says the opposite.)
- App UI **in English**; if any UI isn't self-explanatory, caption it.
- **Enlarged, visible mouse cursor**; prefer mouse over keyboard shortcuts.
- No filler — record only the essential flow per permission.
- Tools: OBS/QuickTime are fine; annotate/zoom in post (iMovie/Camtasia).

What one end-to-end recording must contain (can be cut per-permission):

1. Open our web app → click **Continue with Instagram**.
2. Instagram consent screen — pause long enough that each permission grant is readable.
3. Land on dashboard showing the connected account username (proves `basic`).
4. Create an automation rule: pick a post, set keyword, write DM message + link.
5. Switch to Instagram (second account, native app/web on screen): comment the
   keyword on that post (proves `manage_comments` reading the comment).
6. Show the DM arriving in the commenter's Instagram inbox within seconds
   (proves `manage_messages`).
7. Back in our app: show the activity/log entry for the sent DM.

### UI/UX redesign implications (so the recording sells itself)

- Every screen in the recorded path must look **finished**: login page, OAuth
  return, dashboard, rule editor, post picker, and a **DM activity log** view
  (worth adding — it visually proves the message permission usage in-app).
- English-only copy in the recorded path; self-explanatory button labels
  ("Connect Instagram", "Create automation", "Send DM when someone comments…").
- Clear state feedback: "Connected as @handle", "Rule active", "DM sent to @user".
- No dev artifacts on screen: no localhost URLs (use the real domain), no mock-mode
  banners (`VITE_USE_MOCK` off), no dev-login button visible, no console/devtools.
- Layout readable at 1440px width recording — avoid tiny text/dense tables on the
  recorded screens.

## 7. Suggested order of work

1. Add team + test IG professional accounts as **Instagram Testers** → verify the
   full pipeline with live webhooks today (no review needed).
2. Build the **DM outbox worker** (Flow B) → end-to-end comment→DM works.
3. Start **Business Verification** in parallel.
4. Ship privacy policy + data deletion pages on the landing page; finish app settings.
5. **Frontend redesign** of the recorded path (login → dashboard → rule editor →
   activity log) to screencast quality.
6. Deploy to a real HTTPS domain; make the required API calls per permission.
7. Record screencasts, write per-permission use cases + reviewer instructions, submit.

### Common rejection reasons to avoid
- Missing/unclear screencast for any requested permission.
- Reviewer can't reproduce the flow with provided test credentials.
- Duplicate use-case text across permissions.
- Requesting permissions the app doesn't visibly use.
- Broken privacy policy URL / incomplete settings; app icon with Meta logos.

---

Sources: Meta docs — [Instagram Platform App Review](https://developers.facebook.com/docs/instagram-platform/app-review/),
[App Review Submission Guide](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/submission-guide/),
[Permissions Reference](https://developers.facebook.com/docs/permissions/),
[Business Verification](https://developers.facebook.com/docs/development/release/business-verification),
[Instagram Platform Overview](https://developers.facebook.com/docs/instagram-platform/overview/).
