import { RESULTS } from "@/lib/results";
import Mark from "./Mark";
import Reveal from "./Reveal";
import Tracker from "./Tracker";

const EMAIL = "team.matrix.jec@gmail.com";
// Developer credit in the footer. The name is plain text if this is empty.
const DEV_LINKEDIN = "https://www.linkedin.com/in/garvit-dayal-74537a370/";
const YOUTUBE = "https://www.youtube.com/@MATRIXJEC";
const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/matrix.jec" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/matrix-jec/" },
  { label: "YouTube", href: YOUTUBE },
  { label: "GitHub", href: "https://github.com/Matrix-JEC" },
  { label: "X", href: "https://x.com/MatrixJec" },
];

// Official team names. The form deliberately uses plain domain names instead, since juniors don't know these yet.
const TEAMS = [
  { name: "Students Technical Council", text: "Builds the club's websites and tools, runs workshops, and writes the problem statements for hackathons." },
  { name: "Matrix Management & PR", text: "Plans events from the first idea to the last chair, and handles sponsors, outreach and the people we work with." },
  { name: "Matrix Studio", text: "Designs the posters and brand work, shoots our events and cuts them into reels and aftermovies." },
  { name: "Students Editorial Council", text: "Writes what MATRIX puts out: announcements, event write-ups and reports." },
];

// Sources: JEC's news post on Vibe Coding, MATRIX's LinkedIn, Linktree, YouTube and matrixjec.co.in.
const EVENTS = [
  {
    when: "Jan 2026",
    name: "Winter Arc",
    text: "A 30-day January challenge across ten tracks, from Python, DSA and cybersecurity to art and fitness. One task a day, with streaks, XP and a leaderboard.",
  },
  {
    when: "Jul 2025",
    name: "Vibe Coding",
    text: "Our first hackathon, in Jashan Auditorium. Around 150 students from every branch took part, and 19 shortlisted teams presented their projects to faculty judges.",
  },
  {
    when: "Talk series",
    name: "Beyond the Coffee Chat",
    text: "Honest conversations with JEC alumni about careers, like the pros and cons of an MBA with Aman Juriani (JEC'15, IIM Rohtak'19).",
    href: YOUTUBE,
  },
  {
    when: "Workshops",
    name: "CODE RED",
    text: "A hands-on workshop series for students who want to learn by building.",
  },
];

// How new members can contribute to Vibe Coding 2.0, one per team.
const VC2_ROLES = [
  { what: "Write the problem statements", team: "Students Technical Council" },
  { what: "Run the day", team: "Matrix Management & PR" },
  { what: "Design and film it", team: "Matrix Studio" },
  { what: "Tell the story", team: "Students Editorial Council" },
];

export default function Home() {
  return (
    <>
      <Reveal />
      <Tracker />
      <header className="top">
        <div className="wrap nav">
          <a className="brand" href="#top" aria-label="MATRIX, back to top">
            <Mark className="mark" />
            MATRIX
          </a>
          <nav className="nav-links" aria-label="Sections">
            <a href="#about">About</a>
            <a href="#teams">Teams</a>
            <a href="#events">Events</a>
          </nav>
          <a className="btn small line" href="#apply">Results</a>
        </div>
      </header>

      <main id="top">
        <section className="wrap hero">
          <div>
            <h1>Join<br />MATRIX.</h1>
            <p>
              The skill enhancement community of Jabalpur Engineering College is taking in 1st and 2nd year students.
              No experience needed, just curiosity.
            </p>
            <a className="btn" href="#apply">See the results</a>
          </div>
          <Mark className="mark" animate />
        </section>

        <section className="wrap split" id="about">
          <h2 className="reveal">What we do</h2>
          <div className="reveal">
            <p>
              MATRIX started in 2024 as the technical community of JEC. We run hackathons, workshop series,
              month-long challenges and talks with alumni, and every one of them is planned, designed, filmed and
              posted by students.
            </p>
            <p>
              As a member you work on real events from your first month, learn from seniors who have done it before,
              and find people who like building as much as you do.
            </p>
          </div>
        </section>

        <section className="wrap split" id="teams">
          <div className="reveal">
            <h2>Teams</h2>
            <p className="aside">
              MATRIX is led by the Advisory Board&apos;27, Core Team&apos;28 and Sub Team&apos;29. New members join one
              or more of these teams. In the form you just pick the kind of work you like.
            </p>
          </div>
          <ul className="list">
            {TEAMS.map((t) => (
              <li className="reveal" key={t.name}>
                <h3>{t.name}</h3>
                <p>{t.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="wrap split" id="events">
          <div className="reveal">
            <h2>Events</h2>
            <p className="aside">A few things members have built and run so far.</p>
          </div>
          <ul className="list events">
            {EVENTS.map((e) => (
              <li className="reveal" key={e.name}>
                <div>
                  <small>{e.when}</small>
                  <h3>{e.name}</h3>
                </div>
                <p>
                  {e.text}
                  {e.href && (
                    <>
                      {" "}
                      <a href={e.href} target="_blank" rel="noreferrer">Watch on YouTube</a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>

          <article className="feature reveal" aria-labelledby="vc2">
            <div className="feature-bars" aria-hidden="true" />
            <p className="feature-tag">Coming soon</p>
            <h2 id="vc2">Vibe Coding 2.0</h2>
            <p className="feature-lead">
              The second edition of our hackathon, with real-world problem statements and a ₹6,000 prize pool. This
              time we want you building it with us.
            </p>
            <ul className="feature-roles">
              {VC2_ROLES.map((r) => (
                <li className="reveal" key={r.team}>
                  <h3>{r.what}</h3>
                  <p>{r.team}</p>
                </li>
              ))}
            </ul>
            <a className="btn" href="#apply">Meet the new team</a>
          </article>
        </section>

        <section className="wrap results" id="apply" aria-labelledby="results">
          <div className="results-head reveal">
            {/* poster-style slanted shapes in the corner */}
            <svg className="results-corner" viewBox="0 0 600 360" aria-hidden="true">
              <polygon points="300,0 600,0 600,230" fill="var(--red)" />
              <polygon points="230,0 262,0 600,259 600,284" fill="#fff" />
              <polygon points="150,0 190,0 600,314 600,345" fill="#6b0409" />
            </svg>
            <p className="feature-tag">Recruitment &apos;26 results</p>
            <h2 id="results">Selected students</h2>
            <p className="results-lead">
              Applications are closed. We&apos;ve emailed everyone selected their team and the link to join the members&apos;
              WhatsApp group, so check your inbox and spam folder. Didn&apos;t get it? DM us on Instagram{" "}
              <a href="https://www.instagram.com/matrix.jec" target="_blank" rel="noreferrer">@matrix.jec</a>.
            </p>
          </div>
          {RESULTS.map((r) => (
            <div className="results-team reveal" key={r.team}>
              <div className="results-team-head">
                <div>
                  <small>Selected for</small>
                  <h3>{r.team}</h3>
                </div>
                <p className="results-count"><b>{r.names.length}</b> members</p>
              </div>
              <ul className="pills">
                {r.names.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}
          <div className="results-end reveal">
            <p className="results-congrats">Congratulations!</p>
            <p>Welcome to the MATRIX family.</p>
            {/* poster-style band of slanted shapes along the bottom */}
            <svg className="results-band" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <g stroke="#000" strokeWidth="6" strokeLinejoin="miter">
                <polygon points="0,88 360,88 330,120 0,120" fill="#fff" />
                <polygon points="130,38 360,38 334,62 104,62" fill="#6b0409" />
                <polygon points="300,48 760,48 690,120 230,120" fill="var(--red)" />
                <polygon points="820,26 1060,26 1030,52 790,52" fill="#fff" />
                <polygon points="930,120 1200,0 1200,120" fill="var(--red)" />
                <polygon points="700,96 960,96 940,120 676,120" fill="#fff" />
              </g>
            </svg>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>
            <p>MATRIX, Jabalpur Engineering College</p>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
          <nav aria-label="Social links">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </nav>
          <p className="credit">
            Developed by{" "}
            {DEV_LINKEDIN ? (
              <a href={DEV_LINKEDIN} target="_blank" rel="noreferrer" data-track="dev_linkedin">Garvit Dayal</a>
            ) : (
              "Garvit Dayal"
            )}
          </p>
        </div>
      </footer>
    </>
  );
}

