import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Code2,
  Globe2,
  Menu,
  Network,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Locale = 'en' | 'ru' | 'de';

type CaseStudy = {
  id: string;
  title: string;
  client: string;
  industry: string;
  services: string[];
  summary: string;
  accent: string;
  secondary: string;
  art: 'grid' | 'ribbon' | 'nodes' | 'bars';
};

const caseStudies: CaseStudy[] = [
  {
    id: 'northstar',
    title: 'A clearer signal for every route',
    client: 'Northstar Energy',
    industry: 'Energy & Utilities',
    services: ['Custom Software', 'Cloud Development'],
    summary: 'A live operations platform that turns a decade of grid data into decisions in minutes.',
    accent: '#F0543D',
    secondary: '#F6D24A',
    art: 'grid',
  },
  {
    id: 'liminal',
    title: 'Banking, rebuilt for real life',
    client: 'Liminal Bank',
    industry: 'Banking',
    services: ['Digital Transformation', 'Mobile Development'],
    summary: 'A composable banking experience for 2.4m customers, designed around their actual financial days.',
    accent: '#D2D4FE',
    secondary: '#373A72',
    art: 'ribbon',
  },
  {
    id: 'atlas',
    title: 'The map behind the movement',
    client: 'Atlas Logistics',
    industry: 'Logistics',
    services: ['Web Development', 'MVP Development'],
    summary: 'A control tower for complex supply chains that makes every handoff visible.',
    accent: '#B9E3D2',
    secondary: '#164B40',
    art: 'nodes',
  },
  {
    id: 'civic',
    title: 'Public services, made legible',
    client: 'Civic Futures',
    industry: 'Government',
    services: ['Custom Software', 'Digital Transformation'],
    summary: 'A language-first casework system that helps frontline teams resolve cases with confidence.',
    accent: '#F8D1C8',
    secondary: '#F0543D',
    art: 'bars',
  },
  {
    id: 'morrow',
    title: 'A new standard for learning',
    client: 'Morrow Education',
    industry: 'Education',
    services: ['Cloud Development', 'Web Development'],
    summary: 'Cloud infrastructure and tools that give educators more time for the human work.',
    accent: '#F4B9C8',
    secondary: '#792A4F',
    art: 'ribbon',
  },
  {
    id: 'vita',
    title: 'From data to better care',
    client: 'Vita Life Sciences',
    industry: 'Life Sciences',
    services: ['Custom Software', 'Cloud Development'],
    summary: 'A secure research workspace connecting teams, evidence, and the next breakthrough.',
    accent: '#C3D6F4',
    secondary: '#234A85',
    art: 'grid',
  },
];

const services = [
  'All services',
  'Cloud Development',
  'Custom Software',
  'Digital Transformation',
  'Mobile Development',
  'MVP Development',
  'Web Development',
];

const industries = [
  'All industries',
  'Banking',
  'Education',
  'Energy & Utilities',
  'Enterprise',
  'Government',
  'Life Sciences',
  'Logistics',
];

const pageMeta: Record<Locale, Record<string, { title: string; description: string }>> = {
  en: {
    home: {
      title: 'AttoLabs — Engineers for AI Era',
      description: 'AttoLabs helps organizations turn ideas into practical, scalable AI-enabled software.',
    },
    cases: {
      title: 'Case studies — AttoLabs',
      description: 'Explore software, cloud, mobile, and transformation work by AttoLabs.',
    },
    about: {
      title: 'Who we are — AttoLabs',
      description: 'Meet the distributed engineering studio behind AttoLabs.',
    },
    cooperation: {
      title: 'Work with us — AttoLabs',
      description: 'Bring AttoLabs the hard problem, half-formed idea, or product your team is ready to build.',
    },
    careers: {
      title: 'Careers — AttoLabs',
      description: 'Join a small, distributed team building useful software for the AI era.',
    },
  },
  ru: {
    home: {
      title: 'AttoLabs — Инженеры для эры ИИ',
      description: 'AttoLabs превращает идеи организаций в практичные и масштабируемые программные решения с ИИ.',
    },
    cases: {
      title: 'Кейсы — AttoLabs',
      description: 'Изучите проекты AttoLabs в области ПО, облачных платформ, мобильных решений и трансформации.',
    },
    about: {
      title: 'О нас — AttoLabs',
      description: 'Распределённая инженерная студия AttoLabs.',
    },
    cooperation: {
      title: 'Сотрудничество — AttoLabs',
      description: 'Расскажите AttoLabs о сложной задаче, идее или продукте, который вы готовы создавать.',
    },
    careers: {
      title: 'Карьера — AttoLabs',
      description: 'Присоединяйтесь к небольшой распределённой команде, создающей полезное ПО для эры ИИ.',
    },
  },
  de: {
    home: {
      title: 'AttoLabs — Engineers for AI Era',
      description: 'AttoLabs entwickelt praktische, skalierbare Softwarelösungen mit KI.',
    },
    cases: {
      title: 'Cases — AttoLabs',
      description: 'Entdecken Sie Software-, Cloud-, Mobile- und Transformationsprojekte von AttoLabs.',
    },
    about: {
      title: 'Über uns — AttoLabs',
      description: 'Das verteilte Engineering-Studio hinter AttoLabs.',
    },
    cooperation: {
      title: 'Zusammenarbeit — AttoLabs',
      description: 'Bringen Sie AttoLabs Ihr komplexes Problem oder Ihre nächste Produktidee.',
    },
    careers: {
      title: 'Karriere — AttoLabs',
      description: 'Werden Sie Teil eines kleinen, verteilten Teams für nützliche Software.',
    },
  },
};

function Meta({ locale, page }: { locale: Locale; page: keyof typeof pageMeta.en }) {
  useEffect(() => {
    const meta = pageMeta[locale][page];
    document.title = meta.title;
    document.documentElement.lang = locale;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
    description.setAttribute('content', meta.description);
    for (const [property, content] of [
      ['og:title', meta.title],
      ['og:description', meta.description],
      ['og:type', 'website'],
    ]) {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    }
  }, [locale, page]);
  return null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function BrandMark({ light = false }: { light?: boolean }) {
  const color = light ? '#F4ECE7' : '#1A1A1A';
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-label="AttoLabs rotor mark" role="img">
      <g fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="square">
        <path d="M15 2v9M15 19v9M2 15h9M19 15h9" />
        <path d="m5.8 5.8 6.4 6.4M17.8 17.8l6.4 6.4M24.2 5.8l-6.4 6.4M12.2 17.8l-6.4 6.4" />
      </g>
      <circle cx="15" cy="15" r="3.1" fill="#F0543D" />
    </svg>
  );
}

function SectionTag({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`mono-label flex items-center gap-3 ${light ? 'text-[#F4ECE7]/65' : 'text-[#1A1A1A]/55'}`}>
      <span className="h-px w-7 bg-current" />
      {children}
    </div>
  );
}

function ButtonLink({
  children,
  href,
  coral = false,
}: {
  children: ReactNode;
  href: string;
  coral?: boolean;
}) {
  const className = `group inline-flex items-center gap-3 border px-5 py-3.5 mono-label transition-colors ${
    coral
      ? 'border-[#F0543D] bg-[#F0543D] text-[#F4ECE7] hover:bg-[#1A1A1A] hover:border-[#1A1A1A]'
      : 'border-[#1A1A1A]/35 hover:bg-[#1A1A1A] hover:text-[#F4ECE7]'
  }`;
  const content = (
    <>
      {children}
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
    </>
  );
  return href.startsWith('/') ? (
    <Link href={href} className={className} data-testid={`link-${href.replaceAll('/', '').replaceAll(':', '-')}`}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className} data-testid={`link-${href.replace('#', '')}`}>
      {content}
    </a>
  );
}

function Header({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const nav = [
    ['What we do', '/cases'],
    ['Who we are', '/about'],
    ['Work with us', '/cooperation'],
    ['Jobs', '/careers'],
  ];
  const languagePath = (locale: Locale) => (locale === 'en' ? '/' : `/${locale}`);
  return (
    <header className={`${overlay ? 'absolute' : 'relative bg-[#F4ECE7]'} inset-x-0 top-0 z-40`}>
      <div className="site-wrap flex h-20 items-center justify-between border-b border-[#1A1A1A]/20">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
          <BrandMark />
          <span className="display-font text-[1.14rem] font-bold tracking-[-.04em]">AttoLabs</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {nav.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              className="mono-label text-[.61rem] transition-colors hover:text-[#F0543D]"
              data-testid={`link-nav-${name.toLowerCase().replaceAll(' ', '-')}`}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-5 md:flex">
          <div className="flex items-center gap-2 mono-label text-[.56rem]">
            {(['en', 'ru', 'de'] as Locale[]).map((locale) => (
              <Link
                key={locale}
                href={languagePath(locale)}
                className={`${(location === languagePath(locale) || (locale === 'en' && !location.startsWith('/ru') && !location.startsWith('/de'))) ? 'text-[#F0543D]' : 'text-[#1A1A1A]/45'} hover:text-[#F0543D]`}
                aria-label={`Switch to ${locale}`}
              >
                {locale.toUpperCase()}
              </Link>
            ))}
          </div>
          <Link href="/cooperation" className="border border-[#1A1A1A] px-4 py-2.5 mono-label hover:bg-[#1A1A1A] hover:text-[#F4ECE7]" data-testid="link-start-project">
            Start a project
          </Link>
        </div>
        <button
          className="md:hidden"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen(!open)}
          data-testid="button-mobile-menu"
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-[#1A1A1A] bg-[#F4ECE7] md:hidden"
          >
            <div className="site-wrap flex flex-col py-3">
              {nav.map(([name, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="border-b border-[#1A1A1A]/15 py-4 mono-label">
                  {name}
                  <ArrowRight className="ml-2 inline" size={14} />
                </Link>
              ))}
              <div className="flex gap-4 py-4 mono-label">
                {(['en', 'ru', 'de'] as Locale[]).map((locale) => (
                  <Link key={locale} href={languagePath(locale)} onClick={() => setOpen(false)}>{locale.toUpperCase()}</Link>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function RotorArt() {
  return (
    <div className="relative mx-auto aspect-square w-[min(75vw,580px)]">
      <div className="absolute inset-[17%] rounded-full border border-[#F4ECE7]/25" />
      <div className="absolute inset-[27%] rounded-full border border-[#F4ECE7]/25" />
      <div className="hero-orbit absolute inset-[5%]">
        <svg viewBox="0 0 500 500" fill="none" role="img" aria-label="Abstract coral rotor diagram showing AttoLabs engineering approach">
          <path d="M250 35v120M250 345v120M35 250h120M345 250h120" stroke="#F4ECE7" strokeWidth="2" opacity=".6" />
          <path d="m98 98 86 86M316 316l86 86M402 98l-86 86M184 316l-86 86" stroke="#F4ECE7" strokeWidth="2" opacity=".6" />
          <path d="M250 65c38 0 69 31 69 69 0 38-31 69-69 69-38 0-69-31-69-69 0-38 31-69 69-69Z" stroke="#F0543D" strokeWidth="18" />
          <path d="M250 297c38 0 69 31 69 69 0 38-31 69-69 69-38 0-69-31-69-69 0-38 31-69 69-69Z" stroke="#F0543D" strokeWidth="18" />
          <path d="M65 250c0-38 31-69 69-69 38 0 69 31 69 69 0 38-31 69-69 69-38 0-69-31-69-69Z" stroke="#F0543D" strokeWidth="18" />
          <path d="M297 250c0-38 31-69 69-69 38 0 69 31 69 69 0 38-31 69-69 69-38 0-69-31-69-69Z" stroke="#F0543D" strokeWidth="18" />
          <circle cx="250" cy="250" r="26" fill="#F6D24A" />
          <circle cx="250" cy="250" r="8" fill="#1A1A1A" />
        </svg>
      </div>
      <div className="hero-orbit-slow absolute inset-[11%]"><div className="h-2 w-2 bg-[#F6D24A]" /></div>
    </div>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative overflow-hidden bg-[#F0543D] pt-28 text-[#F4ECE7]">
      <Header overlay />
      <div className="coral-grid absolute inset-0 opacity-25" />
      <div className="site-wrap relative grid min-h-[760px] items-center gap-16 pb-24 pt-16 md:grid-cols-[1.05fr_.95fr] md:pb-32 md:pt-28">
        <motion.div initial={reduce ? false : { opacity: 0, x: -24 }} animate={reduce ? undefined : { opacity: 1, x: 0 }} transition={{ duration: .8 }} className="max-w-[650px]">
          <SectionTag light>01 / AttoLabs</SectionTag>
          <h1 className="display-font mt-8 text-[clamp(4.2rem,10.7vw,9.5rem)] font-semibold leading-[.84] tracking-[-.085em]">
            Engineers<br /><span className="text-[#1A1A1A]">for AI</span><br />Era<span className="text-[#F6D24A]">.</span>
          </h1>
          <p className="mt-10 max-w-[500px] text-[1.08rem] leading-[1.65] text-[#F4ECE7]/85">AttoLabs helps organizations turn ideas into AI-enabled software. Practical, scalable, and ready for the future.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/cases">Explore our work</ButtonLink>
            <Link href="/cooperation" className="group inline-flex items-center gap-3 px-4 py-3.5 mono-label text-[#F4ECE7] hover:text-[#F6D24A]" data-testid="link-hero-contact">Tell us what’s next <ArrowDownRight size={17} className="transition-transform group-hover:translate-y-1 group-hover:translate-x-1" /></Link>
          </div>
        </motion.div>
        <motion.div initial={reduce ? false : { opacity: 0, scale: .8, rotate: -12 }} animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, delay: .2, ease: [0.22, 1, 0.36, 1] }} className="float-mark relative">
          <RotorArt />
          <div className="absolute bottom-2 left-0 max-w-[180px] mono-label leading-[1.6] text-[#F4ECE7]/60">A small team<br />with a wide orbit</div>
        </motion.div>
      </div>
      <div className="relative border-t border-[#F4ECE7]/25">
        <div className="site-wrap flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="mono-label text-[#F4ECE7]/60">Based across four countries / working everywhere</div>
          <div className="flex items-center gap-2 mono-label text-[#F4ECE7]/70"><span className="h-1.5 w-1.5 rounded-full bg-[#F6D24A]" />Open for conversations</div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return <section className="bg-[#1A1A1A] text-[#F4ECE7]"><div className="site-wrap grid grid-cols-2 md:grid-cols-4">
    {[['04', 'countries'], ['07', 'industries'], ['06', 'services'], ['∞', 'possibilities']].map(([num, label], i) => <div key={label} className={`border-[#F4ECE7]/20 py-10 md:py-14 ${i < 3 ? 'border-r' : ''} ${i > 1 ? 'border-t md:border-t-0' : ''} ${i % 2 === 0 ? 'pr-5 md:pr-10' : 'pl-5 md:pl-10'}`}>
      <div className="display-font text-5xl font-semibold tracking-[-.08em] text-[#F6D24A] md:text-7xl">{num}</div><div className="mt-3 mono-label text-[#F4ECE7]/55">{label}</div>
    </div>)}
  </div></section>;
}

function SectionIntro({ tag, title, children, dark = false }: { tag: string; title: ReactNode; children?: ReactNode; dark?: boolean }) {
  return <div className={`grid gap-8 md:grid-cols-[.8fr_1.2fr] md:gap-20 ${dark ? 'text-[#F4ECE7]' : ''}`}><SectionTag light={dark}>{tag}</SectionTag><div><h2 className="display-font max-w-4xl text-[clamp(2.8rem,6.3vw,6.1rem)] font-semibold leading-[.91] tracking-[-.075em]">{title}</h2>{children && <div className={`mt-8 max-w-xl text-lg leading-[1.65] ${dark ? 'text-[#F4ECE7]/65' : 'text-[#1A1A1A]/65'}`}>{children}</div>}</div></div>;
}

function FilterChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} data-testid={`filter-${String(children).toLowerCase().replaceAll(' ', '-')}`} className={`whitespace-nowrap border px-3 py-2 mono-label text-[.58rem] transition-all ${active ? 'border-[#F0543D] bg-[#F0543D] text-[#F4ECE7]' : 'border-[#1A1A1A]/25 hover:border-[#1A1A1A]'}`}>{children}</button>;
}

function CaseVisual({ item }: { item: CaseStudy }) {
  if (item.art === 'grid') return <div className="relative h-full w-full overflow-hidden" style={{ background: item.secondary }}><div className="absolute inset-0 opacity-40" style={{ backgroundImage: `linear-gradient(${item.accent} 1px,transparent 1px),linear-gradient(90deg,${item.accent} 1px,transparent 1px)`, backgroundSize: '27px 27px' }} /><div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-[17px]" style={{ borderColor: item.accent }} /><div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ background: item.accent }} /></div>;
  if (item.art === 'bars') return <div className="relative h-full w-full overflow-hidden p-7" style={{ background: item.accent }}><div className="flex h-full items-end gap-2">{[.35,.58,.48,.78,.63,.93,.71,.86].map((height, i) => <div key={i} className="flex-1" style={{ height: `${height * 100}%`, background: i % 3 === 0 ? item.secondary : '#F4ECE7' }} />)}</div><div className="absolute left-7 top-7 mono-label" style={{ color: item.secondary }}>case / {item.id}</div></div>;
  if (item.art === 'nodes') return <div className="relative h-full w-full overflow-hidden" style={{ background: item.secondary }}><svg viewBox="0 0 400 300" className="h-full w-full"><path d="M10 230 95 155l72 37 69-103 75 76 78-124" stroke={item.accent} strokeWidth="2" fill="none" /><path d="M10 230 95 155l72 37 69-103 75 76 78-124" stroke={item.accent} strokeWidth="14" strokeDasharray="1 30" strokeLinecap="round" fill="none" /><g fill={item.accent}>{[[10,230],[95,155],[167,192],[236,89],[311,165],[389,41]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="8" />)}</g></svg><div className="absolute left-6 top-6 mono-label" style={{ color: item.accent }}>network / visible</div></div>;
  return <div className="relative h-full w-full overflow-hidden" style={{ background: item.accent }}><div className="absolute -left-10 top-20 h-40 w-[125%] -rotate-12 border-y-[18px]" style={{ borderColor: item.secondary }} /><div className="absolute -left-10 top-36 h-40 w-[125%] rotate-12 border-y-[2px]" style={{ borderColor: item.secondary }} /><div className="absolute right-6 top-6 mono-label" style={{ color: item.secondary }}>layer / 03</div></div>;
}

function CaseCard({ item }: { item: CaseStudy }) {
  return <motion.div layout className="group text-left">
    <Link href={`/cases/${item.id}`} data-testid={`card-case-${item.id}`}>
      <div className="relative aspect-[1.23] overflow-hidden"><CaseVisual item={item} /><div className="absolute inset-0 bg-[#1A1A1A]/10 opacity-0 transition-opacity group-hover:opacity-100" /><div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-[#F4ECE7] opacity-0 transition-all group-hover:opacity-100"><ArrowRight size={17} /></div></div>
      <div className="mt-5 flex items-start justify-between gap-3"><div><div className="mono-label text-[#1A1A1A]/50">{item.client}</div><h3 className="display-font mt-2 text-2xl font-semibold leading-[1.05] tracking-[-.045em]">{item.title}</h3></div><span className="mt-1 text-[#F0543D]"><ArrowRight size={18} className="-rotate-45 transition-transform group-hover:rotate-0" /></span></div>
      <p className="mt-3 max-w-sm text-sm leading-[1.55] text-[#1A1A1A]/60">{item.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{item.services.map(service => <span key={service} className="border border-[#1A1A1A]/20 px-2 py-1 mono-label text-[.53rem]">{service}</span>)}</div>
    </Link>
  </motion.div>;
}

function Work() {
  const [service, setService] = useState('All services');
  const [industry, setIndustry] = useState('All industries');
  const filtered = useMemo(() => caseStudies.filter(c => (service === 'All services' || c.services.includes(service)) && (industry === 'All industries' || c.industry === industry)), [service, industry]);
  return <section id="work" className="bg-[#F4ECE7] py-24 md:py-36"><div className="site-wrap">
    <SectionIntro tag="02 / Selected work" title={<>Useful things,<br /><span className="text-[#F0543D]">built properly.</span></>}><span>Good engineering should be felt by the people using it. These are a few places where we made complex things clearer, faster, and more capable.</span></SectionIntro>
    <div className="mt-16 border-y border-[#1A1A1A]/20 py-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10"><div className="flex items-center gap-3 pt-2 mono-label text-[#1A1A1A]/50"><Zap size={14} className="text-[#F0543D]" />Find by</div><div className="flex min-w-0 flex-1 flex-col gap-3"><div className="flex flex-wrap gap-2">{services.map(item => <FilterChip key={item} active={service === item} onClick={() => setService(item)}>{item}</FilterChip>)}</div><div className="flex flex-wrap gap-2">{industries.map(item => <FilterChip key={item} active={industry === item} onClick={() => setIndustry(item)}>{item}</FilterChip>)}</div></div></div></div>
    <div className="mt-7 flex items-center justify-between"><p className="mono-label text-[#1A1A1A]/55" data-testid="text-result-count">{filtered.length} {filtered.length === 1 ? 'case study' : 'case studies'} / matching your view</p>{(service !== 'All services' || industry !== 'All industries') && <button onClick={() => { setService('All services'); setIndustry('All industries'); }} className="mono-label text-[#F0543D] underline underline-offset-4" data-testid="button-clear-filters">Clear filters</button>}</div>
    <motion.div layout className="mt-8 grid gap-x-8 gap-y-16 md:grid-cols-2">{filtered.map(item => <CaseCard key={item.id} item={item} />)}</motion.div>
    {filtered.length === 0 && <div className="border border-dashed border-[#1A1A1A]/30 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#F0543D] text-[#F0543D]"><Network size={21} /></div><h3 className="display-font mt-5 text-2xl font-semibold">That combination is still becoming.</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[#1A1A1A]/60">We don’t have a published case study for this view yet. Tell us what you’re building and we’ll talk through the shape of it.</p><Link href="/cooperation" className="mt-5 inline-block mono-label text-[#F0543D] underline underline-offset-4">Start the conversation</Link></div>}
  </div></section>;
}

function Process() {
  const steps = [['01', 'Listen closely', 'We start with the problem underneath the brief. What must be true for this to work?'], ['02', 'Make it legible', 'We map the smallest useful version, the systems around it, and the decisions that matter.'], ['03', 'Build in the open', 'Small releases, honest trade-offs, senior hands on the work. No black boxes.'], ['04', 'Leave it stronger', 'Your team gets a product, a platform, and the confidence to keep moving.']];
  return <section className="bg-[#F6D24A] py-24 md:py-32"><div className="site-wrap"><SectionIntro tag="03 / How we work" title={<>A process with<br /><span className="text-[#F0543D]">no theatre.</span></>}><span>Technology moves quickly. Our job is to bring enough rigour to make that speed useful.</span></SectionIntro><div className="mt-16 grid border-t border-[#1A1A1A]/30 md:grid-cols-4">{steps.map(([number, title, copy], i) => <div key={number} className={`border-b border-[#1A1A1A]/30 py-7 md:border-b-0 md:py-8 ${i < 3 ? 'md:border-r md:pr-7' : 'md:pl-7'} ${i > 0 ? 'md:pl-7' : ''}`}><div className="mono-label text-[#F0543D]">{number}</div><h3 className="display-font mt-14 text-2xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-4 text-sm leading-[1.6] text-[#1A1A1A]/65">{copy}</p></div>)}</div></div></section>;
}

function Proof() {
  return <section className="bg-[#1A1A1A] py-24 text-[#F4ECE7] md:py-32"><div className="site-wrap"><SectionIntro dark tag="04 / The signal" title={<>Serious about<br /><span className="text-[#F6D24A]">useful.</span></>}><span>We measure our work by the change it makes, not the noise it creates. The best compliment is a team that can go further after us.</span></SectionIntro><div className="mt-20 grid gap-12 md:grid-cols-[1.3fr_.7fr] md:gap-24"><blockquote className="border-l-2 border-[#F0543D] pl-6 md:pl-10"><p className="display-font max-w-3xl text-[clamp(2rem,4vw,4rem)] font-medium leading-[.98] tracking-[-.06em]">“AttoLabs gave us the rare combination of momentum and calm. We shipped something our customers understood on day one.”</p><footer className="mt-8 mono-label text-[#F4ECE7]/55">Maya Chen / VP Product, Liminal Bank</footer></blockquote><div className="grid grid-cols-2 gap-x-6 gap-y-9 self-end">{[['2.4m', 'customers reached'], ['38%', 'faster decisions'], ['11 mo', 'from brief to launch'], ['4.9/5', 'team trust score']].map(([num, label]) => <div key={label} className="border-t border-[#F4ECE7]/25 pt-4"><div className="display-font text-3xl tracking-[-.06em] text-[#F0543D]">{num}</div><div className="mt-2 mono-label text-[#F4ECE7]/50">{label}</div></div>)}</div></div></div></section>;
}

function About() {
  return <section id="about" className="bg-[#F4ECE7] py-24 md:py-36"><div className="site-wrap"><SectionIntro tag="05 / Who we are" title={<>Small enough<br />to <span className="text-[#F0543D]">care.</span></>}><span>AttoLabs is a distributed engineering studio for teams doing consequential work. We bring product thinking, systems discipline, and a healthy respect for the details.</span></SectionIntro><div className="mt-20 grid gap-8 md:grid-cols-[.9fr_1.1fr]"><div className="relative min-h-[340px] overflow-hidden bg-[#F0543D] p-7"><div className="absolute -right-12 -top-12 h-64 w-64 rounded-full border-[32px] border-[#F6D24A]" /><div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full border border-[#F4ECE7]/70" /><div className="relative flex h-full flex-col justify-between text-[#F4ECE7]"><div className="mono-label">We are / a useful distance away</div><div><div className="display-font text-5xl font-semibold leading-[.87] tracking-[-.08em]">The future<br />needs builders.</div><div className="mt-6 max-w-xs text-sm leading-relaxed text-[#F4ECE7]/75">Our team works across London, Lisbon, Toronto, and São Paulo.</div></div></div></div><div className="grid content-center gap-8 md:grid-cols-2 md:gap-x-12"><div><Code2 className="text-[#F0543D]" size={24} /><h3 className="display-font mt-5 text-xl font-semibold">Technical by default</h3><p className="mt-3 text-sm leading-[1.6] text-[#1A1A1A]/60">The people in the room are the people writing the software. Architecture is a conversation, not a handoff.</p></div><div><Globe2 className="text-[#F0543D]" size={24} /><h3 className="display-font mt-5 text-xl font-semibold">Different by design</h3><p className="mt-3 text-sm leading-[1.6] text-[#1A1A1A]/60">Distributed teams sharpen our thinking. Four perspectives, one shared standard for the work.</p></div><div><Sparkles className="text-[#F0543D]" size={24} /><h3 className="display-font mt-5 text-xl font-semibold">Curious, not careless</h3><p className="mt-3 text-sm leading-[1.6] text-[#1A1A1A]/60">We use AI as leverage, with the judgement to know where it belongs and where it doesn’t.</p></div><div><Clock3 className="text-[#F0543D]" size={24} /><h3 className="display-font mt-5 text-xl font-semibold">Built for the long run</h3><p className="mt-3 text-sm leading-[1.6] text-[#1A1A1A]/60">We leave systems clearer than we found them, so your team owns the next chapter.</p></div></div></div></div></section>;
}

function Jobs() {
  const [expanded, setExpanded] = useState(false);
  return <section id="jobs" className="border-t border-[#1A1A1A]/20 bg-[#F4ECE7] py-24 md:py-32"><div className="site-wrap grid gap-10 md:grid-cols-[.8fr_1.2fr]"><SectionTag>06 / Jobs</SectionTag><div><h2 className="display-font text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[.9] tracking-[-.075em]">Make the<br /><span className="text-[#F0543D]">next thing.</span></h2><p className="mt-8 max-w-lg text-lg leading-[1.6] text-[#1A1A1A]/65">We’re always interested in meeting people who care about how things work. Especially product-minded engineers, design engineers, and technical leads.</p><button onClick={() => setExpanded(!expanded)} className="mt-8 flex items-center gap-3 border-b border-[#1A1A1A] pb-2 mono-label" data-testid="button-open-roles">{expanded ? 'Hide roles' : 'See how we work'}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button><AnimatePresence>{expanded && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-8 border-t border-[#1A1A1A]/20">{['Senior Product Engineer', 'Design Engineer', 'Technical Lead'].map(role => <div key={role} className="flex items-center justify-between border-b border-[#1A1A1A]/20 py-5"><div><div className="display-font text-xl font-semibold">{role}</div><div className="mt-1 mono-label text-[#1A1A1A]/45">Remote / full-time</div></div><a href="mailto:hello@attolabs.com?subject=Role enquiry" aria-label={`Apply for ${role}`} className="flex h-9 w-9 items-center justify-center border border-[#1A1A1A] hover:bg-[#F0543D] hover:text-[#F4ECE7]" data-testid={`link-apply-${role.toLowerCase().replaceAll(' ', '-')}`}><ArrowRight size={16} /></a></div>)}</div></motion.div>}</AnimatePresence></div></div></section>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true); };
  return <section id="contact" className="relative overflow-hidden bg-[#F0543D] py-24 text-[#F4ECE7] md:py-36"><div className="coral-grid absolute inset-0 opacity-25" /><div className="site-wrap relative grid gap-14 md:grid-cols-[1fr_.8fr] md:gap-24"><div><SectionTag light>07 / Work with us</SectionTag><h2 className="display-font mt-8 text-[clamp(3.4rem,7vw,7.4rem)] font-semibold leading-[.86] tracking-[-.085em]">Expand the<br />possibilities<br />of the <span className="text-[#F6D24A]">future.</span></h2><p className="mt-9 max-w-md text-lg leading-[1.6] text-[#F4ECE7]/75">Bring us the hard problem, the half-formed idea, or the thing your team can’t stop thinking about. We’ll bring questions.</p><div className="mt-12 flex items-center gap-3 mono-label text-[#F4ECE7]/65"><span className="h-2 w-2 rounded-full bg-[#F6D24A]" />Usually reply within two working days</div></div><div className="bg-[#F4ECE7] p-6 text-[#1A1A1A] md:p-9"><AnimatePresence mode="wait">{sent ? <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[390px] flex-col justify-center"><div className="flex h-12 w-12 items-center justify-center bg-[#F6D24A]"><Check size={24} /></div><h3 className="display-font mt-7 text-4xl font-semibold leading-none tracking-[-.06em]">Message received.</h3><p className="mt-4 max-w-sm text-sm leading-relaxed text-[#1A1A1A]/60">Thanks for reaching out. We’ll be in touch shortly to find a useful first conversation.</p><button onClick={() => setSent(false)} className="mt-8 self-start mono-label underline underline-offset-4" data-testid="button-send-another">Send another message</button></motion.div> : <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-7"><div><label htmlFor="name" className="mono-label text-[#1A1A1A]/55">Your name</label><input required id="name" name="name" type="text" className="mt-2 w-full border-b border-[#1A1A1A]/30 bg-transparent py-3 text-lg outline-none focus:border-[#F0543D]" placeholder="How should we call you?" data-testid="input-name" /></div><div><label htmlFor="email" className="mono-label text-[#1A1A1A]/55">Work email</label><input required id="email" name="email" type="email" className="mt-2 w-full border-b border-[#1A1A1A]/30 bg-transparent py-3 text-lg outline-none focus:border-[#F0543D]" placeholder="you@company.com" data-testid="input-email" /></div><div><label htmlFor="brief" className="mono-label text-[#1A1A1A]/55">What are you working on?</label><textarea required id="brief" name="brief" rows={4} className="mt-2 w-full resize-none border-b border-[#1A1A1A]/30 bg-transparent py-3 text-lg outline-none focus:border-[#F0543D]" placeholder="A few useful details is plenty." data-testid="input-brief" /></div><button type="submit" className="group mt-2 flex w-full items-center justify-between bg-[#1A1A1A] px-5 py-4 text-[#F4ECE7] mono-label hover:bg-[#F0543D]" data-testid="button-submit-contact">Send the brief <Send size={16} className="transition-transform group-hover:translate-x-1" /></button><p className="text-[.7rem] leading-relaxed text-[#1A1A1A]/45">No sales sequence. No deck required. Just a useful conversation.</p></motion.form>}</AnimatePresence></div></div></section>;
}

function Footer() {
  return <footer className="bg-[#1A1A1A] py-8 text-[#F4ECE7]"><div className="site-wrap flex flex-col gap-8 md:flex-row md:items-end md:justify-between"><div><Link href="/" className="flex items-center gap-2.5" data-testid="link-footer-home"><BrandMark light /><span className="display-font text-[1.14rem] font-bold tracking-[-.04em]">AttoLabs</span></Link><p className="mt-4 max-w-xs text-sm leading-relaxed text-[#F4ECE7]/45">Engineering for the AI era, from idea to impact.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 mono-label text-[#F4ECE7]/55"><Link href="/cases" className="hover:text-[#F6D24A]">Work</Link><Link href="/about" className="hover:text-[#F6D24A]">About</Link><Link href="/careers" className="hover:text-[#F6D24A]">Jobs</Link><Link href="/cooperation" className="hover:text-[#F6D24A]">Contact</Link><a href="mailto:hello@attolabs.com" className="hover:text-[#F6D24A]">hello@attolabs.com</a></div><div className="mono-label text-[#F4ECE7]/35">© 2026 AttoLabs</div></div></footer>;
}

function PageFrame({ children }: { children: ReactNode }) {
  return <div className="grain"><Header />{children}<Footer /></div>;
}

function Home({ locale = 'en' }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  return <><Meta locale={locale} page="home" /><div className="grain"><Hero /><Stats /><motion.main initial="hidden" whileInView="visible" viewport={{ once: true, amount: .1 }} variants={reduce ? undefined : fadeIn}><Work /><Process /><Proof /><About /><Jobs /><Contact /></motion.main><Footer /></div></>;
}

function CasesPage({ locale = 'en' }: { locale?: Locale }) {
  return <><Meta locale={locale} page="cases" /><PageFrame><main><div className="bg-[#F4ECE7] pb-10 pt-20"><div className="site-wrap"><SectionIntro tag="01 / All work" title={<>Projects with<br /><span className="text-[#F0543D]">a point of view.</span></>}><span>Filter by the problem space or capability you need. Open a case to see the thinking behind the build.</span></SectionIntro></div></div><Work /></main></PageFrame></>;
}

function CaseDetailPage({ locale = 'en' }: { locale?: Locale }) {
  const [location] = useLocation();
  const slug = location.split('/').filter(Boolean).at(-1);
  const item = caseStudies.find((caseStudy) => caseStudy.id === slug);
  if (!item) return <PageFrame><main className="site-wrap min-h-[70vh] py-28"><SectionTag>404 / Case not found</SectionTag><h1 className="display-font mt-8 text-6xl font-semibold tracking-[-.08em]">This case moved.</h1><Link href="/cases" className="mt-8 inline-block mono-label text-[#F0543D] underline underline-offset-4">Back to all work</Link></main></PageFrame>;
  return <><Meta locale={locale} page="cases" /><PageFrame><main className="bg-[#F4ECE7]"><div className="site-wrap py-20 md:py-28"><Link href="/cases" className="mono-label text-[#F0543D]">← Back to all work</Link><div className="mt-16 grid gap-12 md:grid-cols-[.9fr_1.1fr] md:items-end"><div><SectionTag>Case / {item.id}</SectionTag><div className="mono-label mt-10 text-[#F0543D]">{item.client}</div><h1 className="display-font mt-4 max-w-2xl text-[clamp(3.8rem,8vw,8rem)] font-semibold leading-[.86] tracking-[-.085em]">{item.title}</h1><p className="mt-8 max-w-xl text-lg leading-[1.65] text-[#1A1A1A]/65">{item.summary} We partnered with the team from first sketch to a resilient product in the hands of real people.</p></div><div className="aspect-[1.2]"><CaseVisual item={item} /></div></div><div className="mt-16 grid gap-8 border-t border-[#1A1A1A]/20 pt-8 md:grid-cols-3"><div><div className="mono-label text-[#1A1A1A]/50">Sector</div><div className="mt-3 text-lg">{item.industry}</div></div><div><div className="mono-label text-[#1A1A1A]/50">Capabilities</div><div className="mt-3 flex flex-wrap gap-2">{item.services.map(service => <span key={service} className="border border-[#1A1A1A]/20 px-2 py-1 mono-label text-[.56rem]">{service}</span>)}</div></div><div><div className="mono-label text-[#1A1A1A]/50">AttoLabs role</div><div className="mt-3 text-lg">Product, systems, and delivery partner</div></div></div></div></main></PageFrame></>;
}

function AboutPage({ locale = 'en' }: { locale?: Locale }) {
  return <><Meta locale={locale} page="about" /><PageFrame><main><div className="bg-[#F4ECE7] py-20 md:py-28"><div className="site-wrap"><SectionIntro tag="01 / Who we are" title={<>People who make<br /><span className="text-[#F0543D]">things clearer.</span></>}><span>We are an engineering studio for organizations doing consequential work. Small enough to care, experienced enough to make complexity useful.</span></SectionIntro></div></div><About /><Proof /></main></PageFrame></>;
}

function CooperationPage({ locale = 'en' }: { locale?: Locale }) {
  return <><Meta locale={locale} page="cooperation" /><PageFrame><main><div className="bg-[#F4ECE7] py-20 md:py-28"><div className="site-wrap"><SectionIntro tag="01 / Work with us" title={<>Start with the<br /><span className="text-[#F0543D]">hard problem.</span></>}><span>Tell us what is changing, what is stuck, and what a useful outcome would look like. We will answer with a concrete approach.</span></SectionIntro></div></div><Process /><Contact /></main></PageFrame></>;
}

function CareersPage({ locale = 'en' }: { locale?: Locale }) {
  return <><Meta locale={locale} page="careers" /><PageFrame><main><div className="bg-[#F4ECE7] py-20 md:py-28"><div className="site-wrap"><SectionIntro tag="01 / Careers" title={<>Build the<br /><span className="text-[#F0543D]">next thing.</span></>}><span>AttoLabs is looking for people who care about how things work and how they feel in the hands of real people.</span></SectionIntro></div></div><Jobs /><About /></main></PageFrame></>;
}

const HomeEn = () => <Home />;
const CasesEn = () => <CasesPage />;
const CaseDetailEn = () => <CaseDetailPage />;
const AboutEn = () => <AboutPage />;
const CooperationEn = () => <CooperationPage />;
const CareersEn = () => <CareersPage />;

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch>
    <Route path="/" component={HomeEn} />
    <Route path="/ru" component={() => <Home locale="ru" />} />
    <Route path="/de" component={() => <Home locale="de" />} />
    <Route path="/cases" component={CasesEn} />
    <Route path="/ru/cases" component={() => <CasesPage locale="ru" />} />
    <Route path="/de/cases" component={() => <CasesPage locale="de" />} />
    <Route path="/cases/:slug" component={CaseDetailEn} />
    <Route path="/ru/cases/:slug" component={() => <CaseDetailPage locale="ru" />} />
    <Route path="/de/cases/:slug" component={() => <CaseDetailPage locale="de" />} />
    <Route path="/about" component={AboutEn} />
    <Route path="/ru/about" component={() => <AboutPage locale="ru" />} />
    <Route path="/de/about" component={() => <AboutPage locale="de" />} />
    <Route path="/cooperation" component={CooperationEn} />
    <Route path="/ru/cooperation" component={() => <CooperationPage locale="ru" />} />
    <Route path="/de/cooperation" component={() => <CooperationPage locale="de" />} />
    <Route path="/careers" component={CareersEn} />
    <Route path="/ru/careers" component={() => <CareersPage locale="ru" />} />
    <Route path="/de/careers" component={() => <CareersPage locale="de" />} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;