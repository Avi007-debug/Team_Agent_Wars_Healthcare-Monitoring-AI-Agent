const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Numbering, LevelFormat, BorderStyle, PageBreak
} = require("docx");

// ---------- helpers ----------
function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } });
}
function p(text) {
  return new Paragraph({ children: [new TextRun({ text })], spacing: { after: 160 } });
}
function pRuns(runs) {
  return new Paragraph({ children: runs, spacing: { after: 160 } });
}
function bold(text) { return new TextRun({ text, bold: true }); }
function reg(text) { return new TextRun({ text }); }
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text })],
    numbering: { reference: "bullet-list", level },
    spacing: { after: 80 }
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text })],
    numbering: { reference: "num-list", level },
    spacing: { after: 80 }
  });
}
function hr() {
  return new Paragraph({
    text: "",
    border: { bottom: { color: "AAAAAA", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 200, after: 200 }
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function bulletBold(leadIn, rest) {
  return new Paragraph({
    children: [new TextRun({ text: leadIn, bold: true }), new TextRun({ text: rest })],
    numbering: { reference: "bullet-list", level: 0 },
    spacing: { after: 80 }
  });
}

const children = [];

// ===================== TITLE =====================
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Google Summer of Code (GSoC) 2027", bold: true, size: 48 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 }
  }),
  new Paragraph({
    children: [new TextRun({ text: "Complete Preparation Guide", bold: true, size: 32, color: "555555" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 }
  }),
  new Paragraph({
    children: [new TextRun({
      text: "A start-to-finish playbook: absolute-beginner basics, understanding the program, choosing an org, building community relationships, writing a winning proposal, the selection process, a month-by-month roadmap, and similar programs worth targeting alongside GSoC.",
      italics: true, color: "555555"
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }),
  hr(),
  pageBreak()
);

// ===================== PART 1: ABSOLUTE BEGINNER GUIDE =====================
children.push(h1("Part 1 — Absolute Beginner's Starting Guide"));
children.push(p("If you've never contributed to open source before, start here. Everything in later sections assumes you're comfortable with the basics below — spend real time on this part before worrying about org selection."));

children.push(h2("1.1 What \"contributing to open source\" actually means"));
children.push(p("Open-source projects are codebases whose source code is public, usually hosted on GitHub or GitLab, that anyone can propose changes to. \"Contributing\" simply means: you find something the project needs (a bug fix, a small feature, a documentation fix, a test), you make the change on your own copy of the code, and you submit it back for the maintainers to review and merge. Nobody expects a beginner to understand the entire codebase before starting — you learn it piece by piece through small contributions."));

children.push(h2("1.2 Git and GitHub basics you need before anything else"));
children.push(p("Git is the version-control tool; GitHub is the website that hosts Git repositories and adds collaboration features (issues, pull requests, discussions). You need to be comfortable with the following core workflow:"));
children.push(numbered("Install Git and create a free GitHub account (github.com) with a professional username and photo — this is your public developer identity."));
children.push(numbered("Fork the repository — this creates your own copy of the project under your GitHub account."));
children.push(numbered("Clone your fork to your machine: git clone <your-fork-url> — this downloads the code locally."));
children.push(numbered("Create a new branch for your change: git checkout -b fix/short-description — never work directly on the main/master branch."));
children.push(numbered("Make your change, then stage and commit it: git add . followed by git commit -m \"clear description of the change\"."));
children.push(numbered("Push your branch to your fork: git push origin fix/short-description."));
children.push(numbered("Open a Pull Request (PR) from your branch to the original project's main branch, with a clear title and description of what you changed and why."));
children.push(numbered("Respond to review comments — maintainers will often ask for changes; push new commits to the same branch and the PR updates automatically."));
children.push(p("That loop — fork, branch, commit, push, PR, review, merge — is 90% of open-source contribution. Everything else is domain knowledge specific to each project."));

children.push(h2("1.3 How to read an unfamiliar codebase without getting overwhelmed"));
children.push(bullet("Start with the README — it usually explains what the project does and how to run it."));
children.push(bullet("Get the project actually running locally before reading much code — a working build gives you something concrete to poke at and break."));
children.push(bullet("Don't try to understand the whole codebase at once. Pick one small file or module relevant to your first issue and trace only what's needed to fix it."));
children.push(bullet("Use GitHub's code search and \"Find file\" (press \".\" on a repo page to open it in a browser-based VS Code) to jump around quickly."));
children.push(bullet("Read closed PRs and issues for the area you're touching — they show how maintainers think and what conventions they expect."));

children.push(h2("1.4 Finding your first issue"));
children.push(p("Look for labels like good first issue, beginner-friendly, help wanted, or E-easy on a project's issue tracker. Useful places to search across many projects at once:"));
children.push(bullet("GitHub's own filter: github.com/search with label:\"good first issue\" plus a language or topic filter"));
children.push(bullet("goodfirstissue.dev — curated feed of beginner-friendly issues across popular repos"));
children.push(bullet("up-for-grabs.net — similar curated list, organized by project"));
children.push(bullet("firsttimersonly.com — issues specifically reserved for first-time contributors"));
children.push(p("Comment on the issue to say you'd like to work on it before starting (many projects ask for this so two people don't duplicate work), then wait for a maintainer to assign it to you or give a thumbs-up."));

children.push(h2("1.5 Your very first PR — a simple checklist"));
children.push(numbered("Confirm the issue is still open and unassigned."));
children.push(numbered("Read CONTRIBUTING.md fully — every project has slightly different rules (branch naming, commit message format, test requirements)."));
children.push(numbered("Make the smallest change that correctly fixes the issue — don't refactor unrelated code in the same PR."));
children.push(numbered("Run the existing test suite locally, and add a test for your change if the project expects one."));
children.push(numbered("Write a clear PR description: what you changed, why, and how you tested it. Link the issue (e.g., \"Fixes #123\")."));
children.push(numbered("Be patient and polite during review — reviewers are often volunteers; a slow response is normal, not a rejection."));

children.push(h2("1.6 Communication basics for beginners"));
children.push(bullet("Ask questions in public channels (issue comments, Discord/Slack), not private DMs — it helps others with the same question and is what maintainers expect."));
children.push(bullet("Before asking, check the README, docs, and recent issues/PRs for the same question — show you've made an effort."));
children.push(bullet("When you ask, be specific: what you tried, what you expected, what actually happened (include error messages/logs)."));
children.push(bullet("Say thank you when someone helps you — small, but it's noticed, and open source runs on goodwill."));

children.push(h2("1.7 Free resources to actually learn this"));
children.push(bullet("GitHub Skills (skills.github.com) — free, interactive, hands-on GitHub/Git courses run inside real repos"));
children.push(bullet("opensource.guide — GitHub's own guide to how open-source collaboration and etiquette works"));
children.push(bullet("\"Pro Git\" book (git-scm.com/book) — free, the standard reference for Git internals once you outgrow the basics"));
children.push(bullet("freeCodeCamp's Git and GitHub tutorials — good structured beginner path if you prefer video/course format"));
children.push(bullet("firstcontributions.github.io — a practice repository literally designed to let you make a harmless first PR to learn the workflow risk-free"));

children.push(h2("1.8 Common beginner mistakes to avoid"));
children.push(bullet("Asking to be assigned to five issues at once and finishing none of them — pick one, finish it, then move to the next."));
children.push(bullet("Submitting a huge first PR that touches many files — it's hard to review and likely to sit ignored; start small."));
children.push(bullet("Not reading CONTRIBUTING.md and getting basic process things wrong (branch naming, commit format, missing tests)."));
children.push(bullet("Disappearing after being assigned an issue without any update — if you get stuck or busy, just say so in the issue."));
children.push(bullet("Arguing defensively with review feedback instead of iterating — reviewers are trying to help the code, not attacking you personally."));
children.push(bullet("Chasing only \"impressive\" issues and ignoring genuinely easy ones — the goal early on is learning the workflow, not looking advanced."));

children.push(pageBreak());

// ===================== PART 2: UNDERSTANDING GSOC =====================
children.push(h1("Part 2 — Understanding GSoC (What It Actually Is)"));
children.push(p("Google Summer of Code is not a coding test. It's a mentorship program: Google pays a stipend to contributors who work with an open-source organization's mentors on a real project for 12+ weeks. The org, not Google, picks who gets in — so the entire game is about convincing a specific group of maintainers that you're the safest bet to finish their project well."));

children.push(h2("2.1 Key facts (current program shape, based on GSoC 2026)"));
children.push(bulletBold("Eligibility: ", "You must be 18+ by the contributor application deadline. You do not need to be a student anymore — GSoC has been open to \"students and beginners to open source\" since 2022. As a 3rd-year student, you're eligible either way."));
children.push(bulletBold("\"Beginner to open source\" clause: ", "Even non-students qualify if they have limited prior open-source experience (small numbers of PRs, class/personal projects, single-institution projects). This matters less for you since you'll qualify as a student, but it explains why GSoC actively avoids picking already-established maintainers — they want first-timers."));
children.push(bulletBold("Stipend: ", "Paid in two installments, scaled by project size and by a per-country cost-of-living tier. India generally falls in a mid tier — figures vary by year, so check the official GSoC stipend page once 2027 amounts are published."));
children.push(bulletBold("Project sizes: ", "Historically Medium (~175 hrs) and Large (~350 hrs) projects. Standard coding length is 12 weeks, extendable up to 22 weeks if you and your mentor agree the scope needs it."));

children.push(h2("2.2 Structure per year"));
children.push(numbered("Org application period (orgs apply to Google) — mid/late January"));
children.push(numbered("Accepted orgs announced, org project-idea lists published — February"));
children.push(numbered("Contributor engagement window — orgs open their idea lists and Slack/Discord/mailing lists for prospective contributors to start talking to mentors — Feb–March"));
children.push(numbered("Contributor proposal submission window — mid-March to early-April"));
children.push(numbered("Proposal review period — orgs rank and discuss submissions internally — April"));
children.push(numbered("Accepted contributors announced — late April"));
children.push(numbered("Community Bonding period — accepted contributors onboard, refine the plan with mentors, set up dev environment — late April to late May"));
children.push(numbered("Coding period — ~12 weeks, with 1–2 evaluation checkpoints — late May to August"));
children.push(numbered("Final evaluations and results — late August / early September"));

children.push(p("For GSoC 2027, exact dates aren't published yet (Google typically announces the new program cycle around November–December of the preceding year), but you should plan around this same rhythm, shifted ~12 months from 2026's dates. Re-check summerofcode.withgoogle.com around November 2026 for the official 2027 announcement and again in January 2027 for confirmed dates."));

children.push(pageBreak());

// ===================== PART 3: ORG SELECTION =====================
children.push(h1("Part 3 — Phase 1: Choosing the Right Organization"));
children.push(p("This is the single highest-leverage decision in the whole process. Most rejected proposals aren't rejected for being badly written — they're proposals for the wrong org, where the applicant never built a relationship or picked a project mismatched to their skills."));

children.push(h2("3.1 Criteria for picking an org"));
children.push(numbered("Tech-stack overlap, not topic-overlap. You want overlap with what you can already write code in (C++, Python/Flask/FastAPI, React/Next.js, embedded C for ESP32/ESP8266, networking/security tooling) more than overlap with a buzzword you find interesting."));
children.push(numbered("Mentor responsiveness. Skim last year's org page and their Discord/Zulip/mailing list. Are maintainers replying within a day or two, or is it a ghost town? A responsive small org beats a huge but overloaded one."));
children.push(numbered("Slot count vs. applicant pool. A niche cybersecurity/embedded org with 3–5 slots and a small applicant pool gives you far better odds than a flagship org with 300+ applicants for 4 slots."));
children.push(numbered("Codebase health. Prefer orgs with clear CONTRIBUTING.md, labeled good first issue / gsoc-candidate tags, active CI, and recent commits."));
children.push(numbered("Idea list quality. Good orgs publish detailed project ideas with expected outcomes, skill requirements, and difficulty level."));
children.push(numbered("Return likelihood. Orgs that have participated in GSoC for 3+ consecutive years are safer bets — they know how to run the program and are likely to reapply."));

children.push(h2("3.2 Where to find the org list"));
children.push(bullet("Official archive of all past years' orgs: summerofcode.withgoogle.com/archive — filter by year and by \"technology\" tag (e.g., Security, Machine Learning, Embedded, Web)."));
children.push(bullet("Current year's accepted orgs (once published): summerofcode.withgoogle.com/programs/2027/organizations (URL pattern; check once live)."));
children.push(bullet("Cross-reference an org's idea list from prior years even before the new list drops — most orgs recycle 40–60% of themes, so you can start reading code in December/January instead of waiting for February's official list."));

children.push(h2("3.3 Organizations worth shortlisting for your background"));
children.push(p("Based on your cybersecurity interest (pentesting, HackTheBox), embedded/IoT work (ESP32/ESP8266 sensor networks), full-stack skills (React/Next.js/FastAPI/Flask/Docker/AWS/GCP), and competitive-programming/algorithmic strength — these are strong-fit categories. Verify each org actually applies for the specific year before investing time, since participation isn't guaranteed year to year."));

children.push(h3("Security / defensive tooling (strongest fit given your HackTheBox + pentesting + VPN/IPsec analyzer background)"));
children.push(bulletBold("The Honeynet Project — ", "honeypots, malware analysis, threat intelligence tooling (Python/Go heavy)"));
children.push(bulletBold("OWASP Foundation — ", "dozens of sub-projects (web app security scanners, dependency-check tools, API security) — huge idea variety"));
children.push(bulletBold("Wazuh — ", "open-source SIEM/XDR, very close to your \"AI-powered IPsec VPN analyzer\" SIH work"));
children.push(bulletBold("Suricata / OISF — ", "network IDS/IPS, C-heavy, directly adjacent to packet analysis work"));
children.push(bulletBold("Zeek Project — ", "network security monitoring, scripting + C++"));
children.push(bulletBold("CCExtractor / VLC (security-adjacent tooling projects) — ", "media/security crossover, good if you want variety"));

children.push(h3("Embedded / IoT (fits your ESP32/ESP8266 perimeter-detection work)"));
children.push(bulletBold("The Zephyr Project (Linux Foundation) — ", "RTOS for embedded/IoT, very active GSoC participant historically"));
children.push(bulletBold("RIOT OS — ", "IoT operating system, similar space to Zephyr, smaller/friendlier community"));
children.push(bulletBold("PlatformIO — ", "embedded build tooling, directly relevant to your ESP32 toolchain experience"));

children.push(h3("Full-stack / infra (fits your React/Next.js/FastAPI/Docker/cloud stack)"));
children.push(bulletBold("CNCF-adjacent orgs (e.g., Falco, Sigstore) — ", "cloud-native security, sits between your security interest and full-stack skills"));
children.push(bulletBold("FOSSASIA — ", "hosts many small sub-projects across web, IoT, and AI — very beginner-friendly, huge idea variety"));
children.push(bulletBold("Zulip — ", "real-time chat app, React/Python, historically one of the most mentor-responsive and contributor-friendly GSoC orgs (good \"safe\" pick)"));

children.push(p("Approach: Shortlist 4–6 orgs across 2 categories (e.g., 3 security-focused + 3 embedded-focused) rather than betting on one. You'll submit up to 3 proposals to (up to 3 different) orgs during the actual application window — narrow to your final 3 only after several weeks of community engagement tells you where the mentors are actually responsive to you."));

children.push(pageBreak());

// ===================== PART 4: NETWORKING =====================
children.push(h1("Part 4 — Phase 2: Networking, Community Engagement & Org Relations"));
children.push(p("This is the phase that actually decides selection — most orgs explicitly tell mentors to weight \"did we see this person before the proposal\" heavily, because it predicts whether you'll vanish mid-project."));

children.push(h2("4.1 The first two weeks in a new org"));
children.push(numbered("Read CONTRIBUTING.md, README.md, and the architecture docs fully before writing anything. Nothing burns goodwill with mentors faster than a question answered in the first paragraph of the README."));
children.push(numbered("Set up the dev environment and get the project building/running locally. This alone filters out half of drive-by applicants."));
children.push(numbered("Join their real-time channel (Discord/Slack/Zulip/IRC) and the mailing list if they have one. Introduce yourself briefly — who you are, what you're interested in, and that you're exploring GSoC 2027. Don't ask \"how can I contribute\" with nothing else; instead show you've already looked."));
children.push(numbered("Pick up a good first issue and actually finish it, even if it's small. This is worth more than any amount of Discord chat."));

children.push(h2("4.2 Building a real relationship with mentors (Sept 2026 – Feb 2027)"));
children.push(bullet("Comment thoughtfully on open issues even before you're ready to code — a clarifying question that shows you understood the problem is itself a contribution."));
children.push(bullet("Review other contributors' PRs if the org culture allows it — it builds visibility and shows technical judgment."));
children.push(bullet("Attend any community calls / office hours the org runs, especially the prospective-contributor calls that ramp up before application season."));
children.push(bullet("Consistency beats intensity. A contributor who shows up weekly for 4 months looks far more reliable than one who does 10 PRs in one frantic week before the deadline."));
children.push(bullet("Track every interaction (issues commented on, PRs merged, calls attended) in a running doc — you'll need this both to write your proposal and to answer \"why should we pick you\" honestly."));

children.push(h2("4.3 Etiquette that actually matters to maintainers"));
children.push(bullet("Never DM a mentor directly with a question that belongs in the public channel."));
children.push(bullet("Don't ask \"will you accept my proposal if I do X\" — it signals you're optimizing for the stipend, not the project."));
children.push(bullet("Keep PRs small and focused; a giant first PR is harder to review and more likely to sit unmerged."));
children.push(bullet("If a maintainer gives you critical code review feedback, respond by iterating — this is effectively a preview of how you'll behave during the actual coding period."));

children.push(pageBreak());

// ===================== PART 5: PROPOSAL DRAFTING =====================
children.push(h1("Part 5 — Phase 3: Proposal Drafting"));

children.push(h2("5.1 What a proposal actually needs to contain"));
children.push(p("Most orgs provide a template (check their idea-list page or wiki) — always use theirs if one exists. A strong proposal generally has these sections:"));
children.push(bulletBold("Title & short synopsis — ", "one paragraph, plain-language summary of what you'll build and why it matters to the org."));
children.push(bulletBold("About you — ", "background, relevant prior work (your GitHub, competitive programming, hackathon placements, prior open-source PRs), and why this specific project — not a generic \"I love open source\" paragraph."));
children.push(bulletBold("Problem statement — ", "demonstrate you understand the actual gap in the codebase, not just the org's one-line idea description."));
children.push(bulletBold("Proposed solution / technical approach — ", "the meat of the doc. Name the modules/files you expect to touch, the libraries/APIs you'll use, the architecture of any new component, and how it integrates with existing code."));
children.push(bulletBold("Timeline — ", "week-by-week or bi-weekly breakdown mapped to the actual coding period, including buffer weeks for review cycles and unexpected blockers."));
children.push(bulletBold("Deliverables & milestones — ", "what \"done\" looks like at each evaluation checkpoint."));
children.push(bulletBold("Availability — ", "be explicit about exams and other commitments, and confirm you can commit ~25–35 hrs/week during the coding period."));
children.push(bulletBold("Why me — ", "tie your specific technical background (competitive programming for algorithmic problem-solving, embedded systems work for hardware-adjacent projects, pentesting background for security orgs) directly to the project's technical demands."));

children.push(h2("5.2 Proposal-writing best practices"));
children.push(bullet("Draft it with your mentor's input, iteratively — the strongest proposals are the ones where a mentor has already given feedback on 1–2 earlier drafts before the deadline."));
children.push(bullet("One exceptional proposal beats three mediocre ones. A common strong pattern: 1 primary org where you've done the most groundwork, 2 backups where you've done lighter but real engagement."));
children.push(bullet("Cite your own prior contributions to the org directly in the proposal (\"as discussed with @mentor-handle in issue #123...\") — a strong trust signal."));
children.push(bullet("Avoid scope creep. A tightly scoped, deliverable project mentors can picture finishing in 12 weeks beats an ambitious but vague one."));
children.push(bullet("Proofread for clarity over flourish — clear, well-structured technical writing outperforms \"sounding impressive.\""));

children.push(h2("5.3 Common rejection reasons (avoid these)"));
children.push(bullet("No or minimal prior interaction with the org before submitting."));
children.push(bullet("Proposal copies the org's idea-list description almost verbatim with no independent technical detail."));
children.push(bullet("Unrealistic timeline (too ambitious, or \"learn the basics\" scheduled into the actual coding weeks instead of beforehand)."));
children.push(bullet("No evidence of having actually run/built/explored the codebase."));
children.push(bullet("Applying to a project completely mismatched with demonstrated skills, with no explanation of how you'll close the gap."));

children.push(pageBreak());

// ===================== PART 6: SELECTION PROCESS =====================
children.push(h1("Part 6 — Phase 4: The Selection Process (What Happens After You Submit)"));
children.push(numbered("Internal org review — mentors and org admins read every proposal submitted to their org, discuss internally, and rank candidates per project slot."));
children.push(numbered("Slot allocation — Google allocates a number of contributor slots to each org based on the org's request and Google's overall budget; not every strong proposal gets in purely because of slot scarcity."));
children.push(numbered("Results announcement — accepted contributors are notified around late April (based on the 2026 pattern); rejected applicants are also notified."));
children.push(numbered("If not selected: many orgs are happy to have you keep contributing anyway, and some explicitly encourage re-applying the following year with a track record already built."));
children.push(numbered("Community Bonding — accepted contributors spend ~3–4 weeks refining the technical plan with their mentor, setting up infrastructure, and getting deeply familiar with the codebase before the coding clock starts."));
children.push(numbered("Coding period evaluations — typically a mid-term and final evaluation, each requiring both contributor and mentor sign-off; failing an evaluation can result in early termination, so consistent, visible progress throughout is important."));

children.push(pageBreak());

// ===================== PART 7: ROADMAP =====================
children.push(h1("Part 7 — Roadmap: Preparing for GSoC 2027 (Starting Now, September 2026)"));
children.push(p("This assumes GSoC 2027 follows the same rhythm as 2026 (org apps ~Jan 2027, results ~late Apr 2027) — treat exact dates as provisional until Google confirms them."));

children.push(h2("September – October 2026: Foundation"));
children.push(bullet("Finalize your shortlist of 5–8 candidate orgs across security + embedded, based on your existing strengths."));
children.push(bullet("For each shortlisted org: clone the repo, get it building locally, and read through CONTRIBUTING.md and core architecture docs."));
children.push(bullet("Set up GitHub profile hygiene — pin your strongest existing projects (Heapify, HyperAD, SentinelMesh AI, Vajra-OT) since mentors will look at your profile."));
children.push(bullet("Join each shortlisted org's community channel; introduce yourself and start lurking/reading issue history to understand current priorities."));

children.push(h2("November – December 2026: Deep engagement"));
children.push(bullet("Pick 2–3 good first issues across your top 3–4 orgs and get them merged."));
children.push(bullet("Start regularly commenting on open issues and reviewing others' PRs where welcomed."));
children.push(bullet("Narrow your shortlist to your top 3 orgs based on which mentors are actually responsive to you specifically."));
children.push(bullet("Watch for the official GSoC 2027 announcement (expected ~November/December) and mark the org-application and contributor-timeline dates as soon as published."));

children.push(h2("January 2027: Org list published, ramp up"));
children.push(bullet("Once the 2027 org list is live, confirm your shortlisted orgs actually got in this cycle; if any didn't, pivot quickly to a backup from your original list."));
children.push(bullet("Read the specific 2027 idea list for your top orgs — ideas can shift year to year."));
children.push(bullet("Take on a medium-sized PR (not just a first-issue) in your top 1–2 orgs to demonstrate sustained capability."));
children.push(bullet("Start informal proposal conversations with your top-choice mentors — ask what a strong project scope would look like for your skill level."));

children.push(h2("February – Early March 2027: Proposal groundwork"));
children.push(bullet("Draft your primary proposal early; share a rough draft with your mentor for feedback well before the deadline (aim for at least 2 rounds of feedback)."));
children.push(bullet("Draft 1–2 backup proposals for your secondary orgs in parallel, but keep the primary as your deepest, most polished submission."));
children.push(bullet("Keep contributing small PRs throughout this window — momentum right up to the deadline matters."));

children.push(h2("Mid-March – Early April 2027: Submission window"));
children.push(bullet("Finalize and submit up to 3 proposals before the deadline (never submit at the last minute)."));
children.push(bullet("Continue being present and helpful in the community even after submitting; some orgs do notice continued engagement post-submission."));

children.push(h2("Late April 2027: Results"));
children.push(bullet("If selected: use Community Bonding to lock down the technical plan and dev environment with your mentor before coding starts."));
children.push(bullet("If not selected: request feedback from the org if they offer it, and consider whether to keep contributing toward a stronger 2028 application, or pivot to one of the alternative programs in Part 8 for this cycle."));

children.push(pageBreak());

// ===================== PART 8: SIMILAR PROGRAMS =====================
children.push(h1("Part 8 — Similar Programs Worth Targeting Alongside (or Instead of) GSoC"));
children.push(p("Don't put all your effort into a single program with one selection event per year. These run on different timelines and some are far less competitive, which also gives you contribution history that strengthens your GSoC proposal."));

children.push(h2("8.1 Global open-source mentorship programs"));
children.push(bulletBold("LFX Mentorship (Linux Foundation) — ", "rolling cohorts (roughly quarterly, not once a year like GSoC), stipend-paid, huge presence of security and cloud-native/embedded projects (Zephyr, CNCF projects). Very well aligned to your stack, and you can apply multiple times a year."));
children.push(bulletBold("Outreachy — ", "biannual (May and December cohorts), paid internship, open to a broader range of applicants including those who wouldn't qualify as GSoC \"beginners.\" Strong option if you want a second shot in the same year."));
children.push(bulletBold("Season of Docs — ", "Google-run but focused on technical documentation rather than code; worth knowing about but lower fit for your profile."));
children.push(bulletBold("MLH Fellowship (Major League Hacking) — ", "paid, structured 12-week open-source fellowship with tracks including Security, Backend/DevOps, and Open Source — direct overlap with your interests, rolling seasonal cohorts."));

children.push(h2("8.2 India-specific / community-run \"Summer of Code\" style programs"));
children.push(bulletBold("GirlScript Summer of Code (GSSoC) — ", "despite the name, historically open to all; large beginner-friendly open-source program, runs roughly April–May, great for building your first sustained contribution streak."));
children.push(bulletBold("Social Winter of Code (SWOC) — ", "sibling program to GSSoC, runs around December–January — good timing to build momentum right before GSoC applications open."));
children.push(bulletBold("Script Winter/Summer of Code — ", "similar community-run model, good for early practice PRs."));
children.push(bulletBold("C4GT (Code for GovTech) — ", "India-government-adjacent open-source program, fellowship-style, often has security/infra-relevant projects; good CV addition given your VPN/security-analyzer SIH work."));

children.push(h2("8.3 Hackathons / competitive events (shorter feedback loop, keeps CP + security skills sharp)"));
children.push(bulletBold("Smart India Hackathon (SIH) — ", "you're already tracking this (Theme 13 Blockchain & Cybersecurity, PS 26160)."));
children.push(bulletBold("Hacktoberfest (October, annual) — ", "low-effort way to rack up merged PRs across many repos in a month; useful to warm up your open-source contribution habit before the Sept–Oct GSoC-prep window."));
children.push(bulletBold("HackTheBox / CTF-style competitions (seasonal, ongoing) — ", "keeps your pentesting skills sharp, directly relevant if you target security-focused GSoC orgs."));
children.push(bulletBold("24 Pull Requests (December, annual) — ", "a lightweight December tradition to build a contribution streak right before SWOC and GSoC prep ramps up."));

children.push(h2("8.4 Suggested stacking strategy"));
children.push(p("Given your timeline, a reasonable combined calendar looks like:"));
children.push(bullet("Oct 2026: Hacktoberfest (warm-up PRs across your shortlisted orgs where possible)"));
children.push(bullet("Dec 2026: 24 Pull Requests + start of SWOC"));
children.push(bullet("Jan–Feb 2027: SWOC wrap-up, GSoC 2027 org list drops, deep-dive begins"));
children.push(bullet("Throughout: LFX Mentorship applications whenever a relevant cohort opens (check quarterly) as a parallel, less-competitive track"));
children.push(bullet("Mar–Apr 2027: GSoC 2027 proposal submission"));
children.push(p("This keeps you contributing continuously rather than in one anxious burst before the GSoC deadline — which is exactly the pattern mentors are trying to select for in the first place."));

children.push(pageBreak());

// ===================== QUICK REFERENCE =====================
children.push(h1("Quick Reference Links"));
children.push(bullet("GSoC official site: summerofcode.withgoogle.com"));
children.push(bullet("GSoC program rules/FAQ: developers.google.com/open-source/gsoc/faq"));
children.push(bullet("Org archive (browse past years by technology): summerofcode.withgoogle.com/archive"));
children.push(bullet("LFX Mentorship: mentorship.lfx.linuxfoundation.org"));
children.push(bullet("Outreachy: outreachy.org"));
children.push(bullet("MLH Fellowship: fellowship.mlh.io"));
children.push(bullet("GirlScript Summer of Code: gssoc.girlscript.tech"));
children.push(bullet("GitHub Skills (learn Git/GitHub free): skills.github.com"));
children.push(bullet("Open Source Guide: opensource.guide"));
children.push(bullet("Practice your first PR risk-free: firstcontributions.github.io"));

// ===================== DOCUMENT =====================
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 260 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 260 } } } }
        ]
      },
      {
        reference: "num-list",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 320 } } } }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } }
      },
      children
    }
  ]
});

const path = require("path");
const outputPath = path.join(__dirname, "GSoC_2027_Complete_Preparation_Guide.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Successfully created: " + outputPath);
});

