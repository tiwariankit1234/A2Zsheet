import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Github, GraduationCap, Linkedin, Mail } from 'lucide-react';

const profile = {
  name: 'Ankit Tiwari',
  role: 'Full-stack developer · B.Tech ECE graduate, NIT Kurukshetra',
  email: 'tiwariankit5139@gmail.com',
  github: 'https://github.com/tiwariankit1234',
  linkedin: 'https://www.linkedin.com/in/ankit-tiwari-50a241255',
};

const projects = [
  {
    name: 'Mediscripto',
    stack: 'MongoDB · Express · React · Node · Azure',
    summary:
      'Healthcare appointment booking platform with role-based access for admins, doctors and patients. Deployed on Microsoft Azure, with API optimisation and MongoDB indexing to cut response latency.',
    live: 'https://purple-river-01f4f0400.6.azurestaticapps.net/',
    code: 'https://github.com/tiwariankit1234/Mediscripto',
  },
  {
    name: 'Quizlet',
    stack: 'React · Gemini API · JavaScript',
    summary:
      'AI quiz generator that builds a quiz in under 10 seconds instead of ~15 minutes by hand, with configurable domain, difficulty and question type across 10+ subjects.',
    live: 'https://quizlet-ashen.vercel.app/',
    code: 'https://github.com/tiwariankit1234/Quizlet',
  },
  {
    name: 'DevDebug',
    stack: 'React · Node · MongoDB · Gemini API · Azure VM',
    summary:
      'AI code-analysis tool that runs user code in a sandbox across 5+ languages, then uses Gemini for bug fixes, performance reviews and security scans. CI/CD through GitHub Actions to an Azure VM.',
    live: 'http://20.244.16.121:5000/',
  },
  {
    name: 'A2Z Tracker',
    stack: 'React · Express · MongoDB',
    summary: 'This site: the full A2Z DSA sheet with progress tracking, bookmarks, notes and guest-to-account sync.',
  },
];

const skills = [
  ['Languages', ['C++', 'Java', 'C', 'Python', 'JavaScript']],
  ['Web', ['React', 'Tailwind CSS', 'Node.js', 'Express.js', 'Spring Boot', 'REST APIs']],
  ['Data', ['MongoDB', 'SQL', 'Database design']],
  ['Cloud & tools', ['Microsoft Azure', 'Git', 'GitHub Actions', 'CI/CD', 'Postman']],
  ['CS fundamentals', ['Data Structures & Algorithms', 'OOP', 'Operating Systems', 'DBMS', 'Microservices']],
];

const extLink = 'inline-flex items-center gap-1 text-brand-700 hover:underline dark:text-brand-500';

export default function AboutMePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-700 text-lg font-bold text-white">AT</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{profile.role}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-500">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Open to opportunities
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          I recently graduated in Electronics and Communication Engineering from NIT Kurukshetra, and I build full-stack web apps. Most of my work is on
          the backend: designing REST APIs, structuring data in MongoDB and SQL, and deploying to the cloud so the apps are actually usable. I&apos;ve
          solved thousands of problems across different coding platforms, and I built this tracker to work through Striver&apos;s A2Z sheet in one place,
          with my progress, bookmarks and notes saved alongside every problem. I&apos;m actively looking for software engineering opportunities.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="btn-outline" href={`mailto:${profile.email}`}>
            <Mail className="h-4 w-4" /> Email
          </a>
          <a className="btn-outline" href={profile.github} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a className="btn-outline" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Projects</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <article key={p.name} className="card flex flex-col p-4 text-sm">
              <h3 className="font-medium">{p.name}</h3>
              <p className="font-mono text-xs text-zinc-500">{p.stack}</p>
              <p className="mt-2 flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">{p.summary}</p>
              {(p.live || p.code) && (
                <div className="mt-3 flex gap-4 text-xs font-medium">
                  {p.live && (
                    <a className={extLink} href={p.live} target="_blank" rel="noopener noreferrer">
                      Live <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {p.code && (
                    <a className={extLink} href={p.code} target="_blank" rel="noopener noreferrer">
                      Code <Github className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Skills</h2>
        <dl className="space-y-3 text-sm">
          {skills.map(([group, items]) => (
            <div key={group} className="sm:flex sm:gap-4">
              <dt className="w-36 shrink-0 text-zinc-500">{group}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5 sm:mt-0">
                {items.map((s) => (
                  <span key={s} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <GraduationCap className="h-4 w-4" /> Education
        </h2>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <p className="font-medium">National Institute of Technology, Kurukshetra</p>
          <p className="text-xs text-zinc-500">2022 – 2026</p>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">B.Tech, Electronics and Communication Engineering · CGPA 8.11</p>
      </section>

      <Link to="/data-notes" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200">
        How the problem data on this site was built <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
