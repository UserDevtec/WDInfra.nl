import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { inlineSvgData } from './inlineSvgData';
import buildenvContent from './buildenvContent.json';
import './styles.css';

declare global {
  interface Window {
    WD_INFRA_REST_BASE?: string;
    WD_INFRA_CONTACT_FORM_HTML?: string;
  }
}

function asset(filename: string) {
  return inlineSvgData[filename] || '';
}

function logoAsset(type: 'header' | 'footer' | 'phone' | 'mark', fallback: string) {
  return inlineSvgData[fallback] || '';
}

type SiteSettings = {
  telefoonnummer: string;
  email: string;
  adres: string;
  postcode: string;
  plaats: string;
  contactFormHtml: string;
  heroImages: HeroImages;
  galleries: SiteGalleries;
  careers: CareersContent;
  kernpuntenHome: InfoPoint[];
  werkgebied: string[];
  kernpuntenOverOns: InfoPoint[];
};

type HeroImages = {
  diensten: string;
  projecten: string;
  verhuur: string;
  overOns: string;
  werkenBij: string;
  contact: string;
};

type SiteGalleries = {
  home: string[];
  werkenBij: string[];
};

type CareersContent = {
  wijZoeken: string[];
  wijBieden: string[];
};

type InfoPoint = {
  title: string;
  text: string;
};

const defaultSiteSettings: SiteSettings = {
  telefoonnummer: '',
  email: '',
  adres: '',
  postcode: '',
  plaats: '',
  contactFormHtml: '',
  heroImages: {
    diensten: '',
    projecten: '',
    verhuur: '',
    overOns: '',
    werkenBij: '',
    contact: '',
  },
  galleries: {
    home: [],
    werkenBij: [],
  },
  careers: {
    wijZoeken: [],
    wijBieden: [],
  },
  kernpuntenHome: [],
  werkgebied: [],
  kernpuntenOverOns: [],
};

function hasWordPressRestBase() {
  return typeof window !== 'undefined' && Boolean(window.WD_INFRA_REST_BASE);
}

function phoneHref(phone: string) {
  if (!phone.trim()) return '#';
  const normalized = phone.replace(/^0/, '+31').replace(/[^\d+]/g, '');
  return `tel:${normalized}`;
}

function fullAddress(settings: SiteSettings) {
  return [settings.adres, [settings.postcode, settings.plaats].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function mapsUrl(settings: SiteSettings) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(settings))}`;
}

function mapsEmbedUrl(settings: SiteSettings) {
  return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress(settings))}&z=13&output=embed`;
}

function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(hasWordPressRestBase() ? defaultSiteSettings : buildenvSiteSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(!hasWordPressRestBase());

  useEffect(() => {
    if (!hasWordPressRestBase()) {
      setSettings(buildenvSiteSettings);
      setSettingsLoaded(true);
      return;
    }

    const controller = new AbortController();
    const restBase = window.WD_INFRA_REST_BASE || '';

    fetch(`${restBase}site-settings`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : defaultSiteSettings))
      .then((data: Partial<SiteSettings>) => {
        const contactTemplate = document.getElementById('wd-infra-contact-form-template') as HTMLTemplateElement | null;
        const contactFormHtml = data.contactFormHtml || window.WD_INFRA_CONTACT_FORM_HTML || contactTemplate?.innerHTML || '';

        setSettings({
          telefoonnummer: data.telefoonnummer || '',
          email: data.email || '',
          adres: data.adres || '',
          postcode: data.postcode || '',
          plaats: data.plaats || '',
          contactFormHtml,
          heroImages: {
            diensten: data.heroImages?.diensten || '',
            projecten: data.heroImages?.projecten || '',
            verhuur: data.heroImages?.verhuur || '',
            overOns: data.heroImages?.overOns || '',
            werkenBij: data.heroImages?.werkenBij || '',
            contact: data.heroImages?.contact || '',
          },
          galleries: {
            home: Array.isArray(data.galleries?.home) ? data.galleries.home : [],
            werkenBij: Array.isArray(data.galleries?.werkenBij) ? data.galleries.werkenBij : [],
          },
          careers: {
            wijZoeken: Array.isArray(data.careers?.wijZoeken) ? data.careers.wijZoeken : [],
            wijBieden: Array.isArray(data.careers?.wijBieden) ? data.careers.wijBieden : [],
          },
          kernpuntenHome: Array.isArray(data.kernpuntenHome) ? data.kernpuntenHome : [],
          werkgebied: Array.isArray(data.werkgebied) ? data.werkgebied : [],
          kernpuntenOverOns: Array.isArray(data.kernpuntenOverOns) ? data.kernpuntenOverOns : [],
        });
        setSettingsLoaded(true);
      })
      .catch(() => {
        setSettings(defaultSiteSettings);
        setSettingsLoaded(true);
      });

    return () => controller.abort();
  }, []);

  return { settings, settingsLoaded };
}

function pageHeroImage(settings: SiteSettings, key: keyof HeroImages, fallback: string) {
  return settings.heroImages[key] || fallback;
}

function normalizeImageSlides(images: string[]) {
  return Array.from(new Set(images.filter((image) => typeof image === 'string' && image.trim() !== '')));
}

function useProjects() {
  const [items, setItems] = useState<Project[]>(hasWordPressRestBase() ? [] : buildenvProjects);
  const [loaded, setLoaded] = useState(!hasWordPressRestBase());

  useEffect(() => {
    if (!hasWordPressRestBase()) {
      setItems(buildenvProjects);
      setLoaded(true);
      return;
    }

    const controller = new AbortController();
    const restBase = window.WD_INFRA_REST_BASE || '';

    fetch(`${restBase}projects`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((projectsFromWp: Project[]) => {
        if (!Array.isArray(projectsFromWp)) return;
        setItems(projectsFromWp);
        setLoaded(true);
      })
      .catch(() => {
        setItems([]);
        setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  return { projects: items, projectsLoaded: loaded };
}

function useServices() {
  const [items, setItems] = useState<Service[]>(hasWordPressRestBase() ? [] : buildenvServices);
  const [loaded, setLoaded] = useState(!hasWordPressRestBase());

  useEffect(() => {
    if (!hasWordPressRestBase()) {
      setItems(buildenvServices);
      setLoaded(true);
      return;
    }

    const controller = new AbortController();
    const restBase = window.WD_INFRA_REST_BASE || '';

    fetch(`${restBase}services`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((servicesFromWp: Service[]) => {
        if (!Array.isArray(servicesFromWp)) return;
        setItems(servicesFromWp);
        setLoaded(true);
      })
      .catch(() => {
        setItems([]);
        setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  return { services: items.map(normalizeService), servicesLoaded: loaded };
}

function useRentals() {
  const [items, setItems] = useState<RentalItem[]>(hasWordPressRestBase() ? [] : buildenvRentals);
  const [loaded, setLoaded] = useState(!hasWordPressRestBase());

  useEffect(() => {
    if (!hasWordPressRestBase()) {
      setItems(buildenvRentals);
      setLoaded(true);
      return;
    }

    const controller = new AbortController();
    const restBase = window.WD_INFRA_REST_BASE || '';

    fetch(`${restBase}rentals`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((rentalsFromWp: RentalItem[]) => {
        if (!Array.isArray(rentalsFromWp)) return;
        setItems(rentalsFromWp);
        setLoaded(true);
      })
      .catch(() => {
        setItems([]);
        setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  return { rentals: items, rentalsLoaded: loaded };
}

type Service = {
  slug: string;
  title: string;
  name?: string;
  intro: string;
  image: string;
  label: string;
  bullets: string[];
  fullText?: string;
  projectTag?: string;
};

type ServiceSlug = string;

type ProjectMedia = {
  type: 'image' | 'video' | 'embed';
  url: string;
  poster?: string;
};

type RentalItem = {
  slug: string;
  title: string;
  image: string;
  text: string;
  order?: number;
};

type Project = {
  slug: string;
  title: string;
  place: string;
  text: string;
  image: string;
  intro: string;
  details: string[];
  gallery: string[];
  media?: ProjectMedia[];
  serviceTags: ServiceSlug[];
  date?: string;
};

const buildenvSiteSettings = {
  ...defaultSiteSettings,
  ...buildenvContent.siteSettings,
  heroImages: {
    ...defaultSiteSettings.heroImages,
    ...buildenvContent.siteSettings.heroImages,
  },
  galleries: {
    ...defaultSiteSettings.galleries,
    ...buildenvContent.siteSettings.galleries,
  },
  careers: {
    ...defaultSiteSettings.careers,
    ...buildenvContent.siteSettings.careers,
  },
  kernpuntenHome: Array.isArray(buildenvContent.siteSettings.kernpuntenHome)
    ? buildenvContent.siteSettings.kernpuntenHome
    : [],
  werkgebied: Array.isArray(buildenvContent.siteSettings.werkgebied) ? buildenvContent.siteSettings.werkgebied : [],
  kernpuntenOverOns: Array.isArray(buildenvContent.siteSettings.kernpuntenOverOns)
    ? buildenvContent.siteSettings.kernpuntenOverOns
    : [],
} satisfies SiteSettings;

const buildenvProjects = buildenvContent.projects as Project[];
const buildenvServices = buildenvContent.services as Service[];
const buildenvRentals = buildenvContent.rentals as RentalItem[];

const navItems = [
  ['HOME', '/'],
  ['DIENSTEN', '/diensten'],
  ['PROJECTEN', '/projecten'],
  ['VERHUUR', '/verhuur'],
  ['OVER ONS', '/over-ons'],
  ['WERKEN BIJ', '/werken-bij'],
  ['CONTACT', '/contact'],
];

const footerNavItems = [
  ['Home', '/'],
  ['Diensten', '/diensten'],
  ['Projecten', '/projecten'],
  ['Verhuur', '/verhuur'],
  ['Over ons', '/over-ons'],
  ['Werken bij', '/werken-bij'],
  ['Contact', '/contact'],
];

function normalizeService(service: Service): Service {
  return {
    ...service,
    image: service.image || '',
    name: service.name || service.label || service.title,
    label: service.label || service.name || service.title,
    projectTag: service.projectTag || service.slug,
    fullText: service.fullText || service.intro,
    bullets: Array.isArray(service.bullets) ? service.bullets : [],
  };
}

function getServiceTagHref(slug: ServiceSlug) {
  return slug === 'verhuur' ? '/verhuur' : `/dienst/${slug}`;
}

const termsArticles = [
  ['Artikel 1', 'Wet- en regelgeving', 'De onderaannemer moet verplichtingen uit de CAO Bouw & Infra, sociale verzekeringswetten, loonheffing, KvK-inschrijving, mandagenregisters en overige wettelijke voorschriften naleven. Werk mag alleen met schriftelijke toestemming worden overgedragen of verder uitbesteed.'],
  ['Artikel 2', 'Orders en aanwijzingen', 'De onderaannemer is verplicht de door de aannemer gegeven orders en aanwijzingen op te volgen.'],
  ['Artikel 3', 'Rechtstreekse prijsaanbieding', 'Het is de onderaannemer niet toegestaan rechtstreeks prijsaanbiedingen te doen aan de opdrachtgever van de aannemer voor uitbreidingen of wijzigingen, tenzij daarvoor vooraf schriftelijke toestemming is gegeven.'],
  ['Artikel 4', 'Aanvang en uitvoeringsduur', 'Partijen waarschuwen elkaar tijdig als werkzaamheden niet op de afgesproken dag kunnen starten. Bij vertraging door omstandigheden van de andere partij kan schadevergoeding of termijnverlenging aan de orde zijn. Bij te late oplevering kan een vergoeding per werkbare werkdag gelden.'],
  ['Artikel 5', 'Oplevering voorafgaand aan hoofdaannemer', 'Als het werk eerder moet worden opgeleverd dan het hoofdwerk, vindt opname plaats in aanwezigheid van beide partijen. Goedkeuring, eventuele gebreken en onderhoudstermijn worden schriftelijk vastgelegd.'],
  ['Artikel 6', 'Oplevering tegelijk met hoofdaannemer', 'Als het werk gelijktijdig met het hoofdwerk wordt opgeleverd, wordt beoordeeld of het voldoet aan de overeenkomst. Kleine gebreken mogen de voortgang niet hinderen en moeten onverwijld worden hersteld.'],
  ['Artikel 7', 'Werkterrein en voorzieningen', 'De aannemer zorgt voor toegankelijkheid, begaanbaarheid, schaftruimten, sanitaire voorzieningen en tijdige beschikbaarheid van afgesproken zaken. De onderaannemer gebruikt verstrekte zaken zorgvuldig en deponeert afval op aangewezen plaatsen.'],
  ['Artikel 8', 'Weekrapporten en bouwvergadering', 'Als weekrapporten zijn afgesproken, moeten deze tijdig worden aangeleverd en voor akkoord worden getekend. Relevante informatie uit bouwvergaderingen wordt gedeeld wanneer dit betrekking heeft op het opgedragen werk.'],
  ['Artikel 9', 'Betaling', 'Betaling vindt plaats wanneer facturen voldoen aan de eisen uit de overeenkomst. De aannemer kan bewijs verlangen dat werknemers correct zijn betaald volgens hun arbeidsovereenkomst.'],
  ['Artikel 10', 'Premies en loonheffing', 'De aannemer mag bedragen voor premies sociale verzekeringswetten en loonheffing storten op een geblokkeerde rekening of rechtstreeks voldoen wanneer dit nodig is om risico onder de Wet Ketenaansprakelijkheid te beperken.'],
  ['Artikel 11', 'Vrijwaring', 'Als voldoende zekerheid wordt geboden via een onderlinge waarborgmaatschappij, doet de aannemer geen beroep op bepaalde administratieve en inhoudingsrechten rond premies en loonheffing.'],
  ['Artikel 12', 'Verhaal', 'Wanneer de aannemer premies, loonheffing of CAO-verplichtingen moet voldoen die door de onderaannemer verschuldigd waren, kan dit bedrag worden verhaald op de onderaannemer.'],
  ['Artikel 13', 'Eindafrekening', 'Wanneer de aannemer de eindafrekening bij de opdrachtgever wil indienen, vraagt hij de onderaannemer diens eindafrekening in te dienen. Tenzij anders overeengekomen gebeurt dit binnen vier weken.'],
  ['Artikel 14', 'Zekerheidstelling', 'De aannemer kan zekerheid verlangen voor nakoming van verplichtingen, meestal in de vorm van een bankgarantie van 5% van de aannemingssom. Ook de onderaannemer kan zekerheid verlangen bij betalingsrisico.'],
  ['Artikel 15', 'Ontbinding', 'Partijen kunnen de overeenkomst ontbinden bij onder meer staking van bedrijfsuitoefening, surseance, faillissement, beëindiging van het hoofdwerk of ontbinding van de overeenkomst met de opdrachtgever.'],
  ['Artikel 16', 'Geschillen', 'Geschillen over de overeenkomst of daaruit voortvloeiende overeenkomsten worden beslecht zoals overeengekomen tussen aannemer en opdrachtgever, of via de gewone rechter te Dordrecht.'],
];

const privacySections = [
  ['Verantwoordelijke', 'WD Infra b.v., gevestigd aan de West Kinderdijk 122f, 2953 XW te Alblasserdam, is verantwoordelijk voor de verwerking van persoonsgegevens zoals weergegeven in deze privacyverklaring. De website www.wdinfra.nl is eigendom van WD Infra b.v.'],
  ['Contact over privacy', 'Voor vragen, zorgen, klachten of verzoeken over privacy kunt u contact opnemen per post ter attentie van afdeling Privacy of per e-mail via info@wdinfra.nl. Dit privacybeleid is herzien op 09-05-2018.'],
  ['Persoonsgegevens die worden verwerkt', 'WD Infra verwerkt onder meer naam, adresgegevens, geslacht, telefoonnummer, e-mailadres, bankrekeningnummer, IP-adres, correspondentiegegevens, locatiegegevens, websiteactiviteiten, surfgedrag, internetbrowser en apparaattype.'],
  ['Doelen en grondslagen', 'Persoonsgegevens worden gebruikt om te communiceren met bestaande of voormalige relaties, wettelijke verplichtingen na te komen, direct marketing of toekomstige nieuwsbrieven te verzenden en de website en dienstverlening te verbeteren.'],
  ['Bewaartermijn', 'Persoonsgegevens worden niet langer bewaard dan nodig is voor het doel waarvoor ze zijn verzameld. Gegevens voor dienstverlening worden bewaard zolang dat nodig is voor de service en als referentie. Gegevens voor direct marketing worden bewaard zolang WD Infra denkt dat berichten, diensten of services relevant zijn.'],
  ['Rechten van betrokkenen', 'U heeft recht op inzage, correctie, verwijdering, intrekking van toestemming, bezwaar tegen verwerking en gegevensoverdraagbaarheid. Een verzoek kan worden gestuurd naar info@wdinfra.nl. Ter controle kan om een afgeschermde kopie van een identiteitsbewijs worden gevraagd. WD Infra reageert zo snel mogelijk, uiterlijk binnen vier weken.'],
  ['Cameratoezicht', 'Op de werf is cameratoezicht aanwezig voor persoonlijke veiligheid en preventie tegen diefstal. Beelden worden volgens de oude verklaring na 24 uur overschreven.'],
  ['Delen met derden', 'WD Infra verkoopt persoonsgegevens niet aan derden en verstrekt deze uitsluitend wanneer dit nodig is voor uitvoering van een overeenkomst of om te voldoen aan een wettelijke verplichting.'],
  ['Cookies', 'Volgens de oude privacyverklaring gebruikt WD Infra geen functionele, analytische of tracking cookies en worden ook geen cookies door derden geplaatst.'],
  ['Beveiliging', 'WD Infra neemt passende maatregelen tegen misbruik, verlies, onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde wijziging. Bij signalen van misbruik kan contact worden opgenomen via 06-22505618 of info@wdinfra.nl.'],
];

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function currentAppPath() {
  const params = new URLSearchParams(window.location.search);
  const fallbackPath = params.get('p');

  if (fallbackPath) {
    return normalizePath(fallbackPath);
  }

  return normalizePath(window.location.pathname);
}

function usePath() {
  const [path, setPath] = useState(currentAppPath());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fallbackPath = params.get('p');

    if (!fallbackPath) {
      return;
    }

    const normalizedPath = normalizePath(fallbackPath);
    window.history.replaceState(null, '', normalizedPath + window.location.hash);
    setPath(normalizedPath);
  }, []);

  useEffect(() => {
    const onPop = () => setPath(currentAppPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (href: string) => {
    const normalizedHref = normalizePath(href);
    if (normalizedHref === currentAppPath()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.history.pushState(null, '', normalizedHref);
    setPath(normalizedHref);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, navigate };
}

function Link({
  href,
  children,
  className,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        if (href.startsWith('/')) {
          event.preventDefault();
          onNavigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}

function Reveal({ children, className = '', ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`reveal ${className}`} {...props}>{children}</div>;
}

function Header({
  path,
  navigate,
  services,
  siteSettings,
}: {
  path: string;
  navigate: (href: string) => void;
  services: Service[];
  siteSettings: SiteSettings;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const goTo = (href: string) => {
    setMenuOpen(false);
    navigate(href);
  };

  return (
    <>
      <header className={`site-header ${menuOpen ? 'menu-open' : ''}`}>
        <div className="header-inner">
          <Link className="brand" href="/" onNavigate={navigate}>
            <img src={logoAsset('header', 'WD-infra-enkel-logo-lang-blue-white.svg')} alt="WD Infra B.V." />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
            Menu
          </button>
          <nav id="primary-nav" className="primary-nav" aria-label="Hoofdnavigatie">
            {navItems.map(([label, href]) => (
              label === 'DIENSTEN' ? (
                <div className="nav-item has-dropdown" key={label}>
                  <Link
                    href={href}
                    onNavigate={goTo}
                    className={path === href || path.startsWith('/dienst') ? 'active' : ''}
                  >
                    {label}
                  </Link>
                  <div className="nav-dropdown" aria-label="Diensten submenu">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/dienst/${service.slug}`}
                        onNavigate={goTo}
                      >
                        <span>{service.title}</span>
                        <small>{service.name || service.label}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={label}
                  href={href}
                  onNavigate={goTo}
                  className={[
                    path === href || (href !== '/' && path.startsWith(href)) ? 'active' : '',
                    href === '/werken-bij' ? 'nav-career' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {label}
                </Link>
              )
            ))}
          </nav>
          <div className="header-actions">
            <a className="phone-link" href={phoneHref(siteSettings.telefoonnummer)} aria-label="Bel WD Infra">
              <span className="phone-icon" aria-hidden="true">
                <img src={logoAsset('phone', 'WD-infra-enkel-logo.svg')} alt="" />
              </span>
              <span>
                <small>Direct bellen</small>
                {siteSettings.telefoonnummer}
              </span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

function HomePage({
  navigate,
  projects,
  projectsLoaded,
  services,
  servicesLoaded,
  siteSettings,
}: {
  navigate: (href: string) => void;
  projects: Project[];
  projectsLoaded: boolean;
  services: Service[];
  servicesLoaded: boolean;
  siteSettings: SiteSettings;
}) {
  const heroSlides = useMemo(() => normalizeImageSlides(siteSettings.galleries.home), [siteSettings.galleries.home]);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    setActiveHeroSlide(0);

    if (heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <>
      <section className="hero section-dark">
        {heroSlides.length > 0 && (
          <div className="hero-slider" aria-hidden="true">
            {heroSlides.map((image, index) => (
              <div
                className={`hero-slide ${index === activeHeroSlide ? 'active' : ''}`}
                key={`${image}-${index}`}
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(20, 48, 104, 0.72), rgba(20, 48, 104, 0.48) 48%, rgba(20, 48, 104, 0.16)), linear-gradient(0deg, rgba(20, 48, 104, 0.1), rgba(20, 48, 104, 0.1)), url(${image})`,
                }}
              />
            ))}
          </div>
        )}
        <div className="container hero-content">
          <Reveal>
            <p className="eyebrow">
              WD Infra B.V.{siteSettings.plaats ? ` uit ${siteSettings.plaats}` : ''}
            </p>
            <h1>Sterk in bestrating, grondwerk en riolering</h1>
            <p className="hero-subtitle">
              Praktisch en betrouwbaar infra werk voor particulieren, bedrijven,
              aannemers en overheden in de regio groot Rotterdam.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/diensten" onNavigate={navigate}>
                Bekijk onze diensten
              </Link>
              <Link className="button button-secondary" href="/contact" onNavigate={navigate}>
                Vraag een offerte aan
              </Link>
            </div>
          </Reveal>
        </div>
        <StatsStrip items={siteSettings.kernpuntenHome} />
      </section>

      <ImageMarquee projects={projects} navigate={navigate} />
      <ServicesSection services={services} servicesLoaded={servicesLoaded} navigate={navigate} />
      <CareersBand navigate={navigate} />
      <ProjectsPreview projects={projects} projectsLoaded={projectsLoaded} navigate={navigate} muted randomize limit={3} />
      <ContactSection siteSettings={siteSettings} />
      <ServiceArea places={siteSettings.werkgebied} />
    </>
  );
}

function HeroExamplesPage({ navigate }: { navigate: (href: string) => void }) {
  const examples = [
    {
      name: 'Variant 1',
      label: 'Split-screen project',
      title: 'Uitvoering voor buitenruimte zonder omwegen',
      text: 'Een ruime witte voorzijde met een groot projectbeeld ernaast. Rustig, direct en sterk gericht op contact.',
      className: 'hero-example-split',
    },
    {
      name: 'Variant 2',
      label: 'Operationeel dashboard',
      title: 'Planning, materieel en uitvoering strak geregeld',
      text: 'Een zakelijke variant met disciplines, werkgebied en inzetbaarheid direct zichtbaar voor aannemers en gemeenten.',
      className: 'hero-example-dashboard',
    },
    {
      name: 'Variant 3',
      label: 'Editorial projectbeeld',
      title: 'Buitenruimte die klopt van ondergrond tot afwerking',
      text: 'Een beeldgedreven hero met veel rust, stevige typografie en een meer premium eerste indruk.',
      className: 'hero-example-editorial',
    },
    {
      name: 'Variant 4',
      label: 'Werken bij eerst',
      title: 'Maak werk van buitenruimte bij WD Infra',
      text: 'Een variant waarin personeelswerving meer gewicht krijgt, zonder het dienstenaanbod te verliezen.',
      className: 'hero-example-recruitment',
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Hero voorbeelden"
        title="Compleet andere hero-richtingen"
        text="Vier losse concepten met een andere compositie, nadruk en eerste indruk."
        image=""
      />
      <section className="section hero-examples-section">
        <div className="container hero-examples-list">
          {examples.map((example) => (
            <div className="hero-example-wrap" key={example.name}>
              <p className="eyebrow">{example.name}</p>
              <section className={`hero-example ${example.className}`}>
                <div className="hero-example-copy">
                  <span>{example.label}</span>
                  <h2>{example.title}</h2>
                  <p>{example.text}</p>
                  <div className="button-row">
                    <Link className="button button-primary" href="/diensten" onNavigate={navigate}>
                      Bekijk diensten
                    </Link>
                    <Link className="button button-secondary" href="/contact" onNavigate={navigate}>
                      Vraag offerte aan
                    </Link>
                  </div>
                </div>
                <figure className="hero-example-media hero-example-media-empty" aria-hidden="true" />
                <div className="hero-example-stats" aria-label="WD Infra in het kort">
                  <strong>25+ jaar</strong>
                  <strong>30+ vakmensen</strong>
                  <strong>Regio Rotterdam</strong>
                </div>
              </section>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ImageMarquee({ projects, navigate }: { projects: Project[]; navigate: (href: string) => void }) {
  const projectImages = projects.filter((project) => project.image);

  if (projectImages.length === 0) {
    return null;
  }

  const repeatedProjects = Array.from(
    { length: Math.max(12, projectImages.length * 4) },
    (_, index) => projectImages[index % projectImages.length],
  );
  const loop = [...repeatedProjects, ...repeatedProjects];
  const marqueeStyle = {
    '--marquee-duration': `${Math.max(54, repeatedProjects.length * 6)}s`,
  } as CSSProperties;

  return (
    <section className="image-marquee-section" aria-label="Projectbeelden van WD Infra">
      <div className="image-marquee">
        <div className="image-marquee-track" style={marqueeStyle}>
          {loop.map((project, index) => (
            <Link
              className="marquee-card"
              href={`/project/${project.slug}`}
              onNavigate={navigate}
              key={`${project.slug}-${index}`}
            >
              <img src={project.image} alt="" />
              <span>{project.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsStrip({ items }: { items: InfoPoint[] }) {
  if (items.length === 0) {
    return null;
  }

  const loop = [...items, ...items];

  return (
    <section className="stats-strip" aria-label="WD Infra in het kort">
      <div className="container stats-viewport">
        <div className="stats-track">
          {loop.map((item, index) => (
            <div className="stats-card" key={`${item.title}-${index}`}>
              <img src={logoAsset('mark', 'WD-infra-enkel-logo.svg')} alt="" />
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({
  services,
  servicesLoaded,
  navigate,
}: {
  services: Service[];
  servicesLoaded: boolean;
  navigate: (href: string) => void;
}) {
  return (
    <section className="section" id="diensten">
      <div className="container">
        <SectionHeading
          eyebrow="Diensten"
          title="Duidelijk aanbod voor buitenruimte en infra"
          text="WD Infra voert grote en kleinere infrastructurele projecten uit voor hoofdaannemers, projectontwikkelaars, woningbouwbedrijven, overheidsinstellingen, bedrijven en particulieren."
        />
        <div className="service-grid">
          {services.length > 0 ? (
            services.slice(0, 4).map((service) => (
              <ServiceCard service={service} navigate={navigate} key={service.slug} />
            ))
          ) : servicesLoaded ? (
            <EmptyServiceCards />
          ) : (
            <ServiceLoadingCards />
          )}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, navigate }: { service: Service; navigate: (href: string) => void }) {
  return (
    <Reveal>
      <Link
        className="service-card clickable-card"
        href={`/dienst/${service.slug}`}
        onNavigate={navigate}
      >
        {service.image ? <img src={service.image} alt="" /> : <div className="service-card-placeholder" />}
        <div className="service-card-body">
          <span>{service.title}</span>
          <h3>{service.name || service.title}</h3>
          <p>{service.intro}</p>
        </div>
      </Link>
    </Reveal>
  );
}

function ServiceLoadingCards() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <Reveal key={item}>
          <article className="service-card service-card-empty project-card-loading">
            <div className="service-card-placeholder" />
            <div className="service-card-body">
              <span>Diensten</span>
              <h3>Diensten laden</h3>
              <p>De gepubliceerde diensten worden opgehaald uit WordPress.</p>
            </div>
          </article>
        </Reveal>
      ))}
    </>
  );
}

function EmptyServiceCards() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <Reveal key={item}>
          <article className="service-card service-card-empty">
            <div className="service-card-placeholder" />
            <div className="service-card-body">
              <span>Diensten</span>
              <h3>Geen diensten gepubliceerd</h3>
              <p>Zodra er diensten in WordPress staan, verschijnen ze automatisch op deze plek.</p>
            </div>
          </article>
        </Reveal>
      ))}
    </>
  );
}

function WhyUs() {
  const valueItems: InfoPoint[] = [];

  return (
    <section className="section section-muted">
      <div className="container split-layout">
        <Reveal>
          <p className="eyebrow">Waarom WD Infra?</p>
          <h2>Persoonlijk, korte lijnen en flexibel</h2>
          <p>
            Geen overbodige lagen, maar duidelijke afspraken en mensen die weten
            wat er buiten nodig is. WD Infra combineert vakmanschap met een
            praktische manier van samenwerken.
          </p>
        </Reveal>
        <div className="value-grid">
          {valueItems.map((item) => (
            <Reveal className="value-card" key={item.title}>
              <img className="value-mark" src={logoAsset('mark', 'WD-infra-enkel-logo.svg')} alt="" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    ['01', 'Korte intake', 'We bespreken de vraag, locatie, planning en praktische randvoorwaarden.'],
    ['02', 'Heldere aanpak', 'U krijgt duidelijkheid over werkzaamheden, materieel en uitvoering.'],
    ['03', 'Uitvoering', 'Het team schakelt snel, werkt netjes en houdt afspraken overzichtelijk.'],
  ];

  return (
    <section className="section process-section">
      <div className="container">
        <SectionHeading
          eyebrow="Aanpak"
          title="Van eerste vraag naar nette oplevering"
          text="De werkwijze blijft compact en duidelijk, ook bij projecten waar meerdere partijen betrokken zijn."
        />
        <div className="process-grid">
          {steps.map(([number, title, text]) => (
            <Reveal className="process-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsPreview({
  projects,
  projectsLoaded,
  navigate,
  muted = false,
  limit = 3,
  layout = 'default',
  randomize = false,
}: {
  projects: Project[];
  projectsLoaded: boolean;
  navigate: (href: string) => void;
  muted?: boolean;
  limit?: number;
  layout?: 'default' | 'home';
  randomize?: boolean;
}) {
  const visibleProjects = useMemo(() => {
    const source = randomize ? [...projects].sort(() => Math.random() - 0.5) : projects;
    return source.slice(0, limit);
  }, [limit, projects, randomize]);

  return (
    <section className={`section${muted ? ' section-muted' : ''}`}>
      <div className="container">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow">Projecten</p>
            <h2>Werk uit de praktijk</h2>
          </div>
          <Link className="button button-outline" href="/projecten" onNavigate={navigate}>
            Bekijk projecten
          </Link>
        </div>
        <div className={`project-grid${layout === 'home' ? ' project-grid-home' : ''}`}>
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project) => (
              <ProjectCard project={project} navigate={navigate} key={project.title} />
            ))
          ) : projectsLoaded ? (
            <EmptyProjectCards />
          ) : (
            <ProjectLoadingCards />
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectLoadingCards() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <Reveal key={item}>
          <article className="project-card project-card-empty project-card-loading" aria-label="Projecten laden">
            <div className="project-card-placeholder" />
            <div className="project-card-body">
              <span>Projecten</span>
              <h3>Projecten laden</h3>
              <p>De gepubliceerde projecten worden opgehaald uit WordPress.</p>
            </div>
          </article>
        </Reveal>
      ))}
    </>
  );
}

function EmptyProjectCards() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <Reveal key={item}>
          <article className="project-card project-card-empty">
            <div className="project-card-placeholder" />
            <div className="project-card-body">
              <span>Projecten</span>
              <h3>Geen projecten gepubliceerd</h3>
              <p>Zodra er projecten in WordPress staan, verschijnen ze automatisch op deze plek.</p>
            </div>
          </article>
        </Reveal>
      ))}
    </>
  );
}

function ServiceArea({ places }: { places: string[] }) {
  if (places.length === 0) {
    return null;
  }

  return (
    <section className="section area-section">
      <div className="container area-layout">
        <Reveal>
          <p className="eyebrow">Werkgebied</p>
          <h2>Actief in regio groot Rotterdam</h2>
          <p>
            WD Infra werkt voor projecten in de onderstaande plaatsen en regio&apos;s.
          </p>
        </Reveal>
        <Reveal className="area-map" aria-label="Werkgebied plaatsen">
          {places.map((place) => (
            <span key={place}>{place}</span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function CareersBand({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="section career-section">
      <div className="container career-panel">
        <div>
          <p className="eyebrow">Vacature stratenmakers</p>
          <h2>Kom werken bij WD Infra</h2>
          <p>
            WD Infra zoekt hard naar nieuwe vakmensen. Ben jij stratenmaker of
            heb je ervaring in bestrating, grondwerk of riolering? Dan maken we
            graag kennis.
          </p>
        </div>
        <div className="career-actions">
          <span>
            <img src={logoAsset('mark', 'WD-infra-enkel-logo.svg')} alt="" />
            Bellen of appen mag ook
          </span>
          <Link className="button button-primary" href="/werken-bij" onNavigate={navigate}>
            Bekijk vacatures
          </Link>
        </div>
      </div>
    </section>
  );
}

function ContactCta({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  return (
    <section className="section contact-teaser">
      <div className="container contact-teaser-inner">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h2>Een project bespreken?</h2>
          <p>
            Bel direct of stuur een bericht. WD Infra denkt graag mee over de
            uitvoering, planning en praktische oplossing.
          </p>
        </Reveal>
        <div className="button-row">
          <a className="button button-outline" href={phoneHref(siteSettings.telefoonnummer)}>
            {siteSettings.telefoonnummer}
          </a>
          <Link className="button button-primary" href="/contact" onNavigate={navigate}>
            Naar contact
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProjectsOverviewCta({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  return (
    <section className="section projects-overview-cta">
      <div className="container projects-overview-panel">
        <div>
          <p className="eyebrow">Project starten</p>
          <h2>Van buitenruimte naar uitvoerbaar plan</h2>
          <p>
            Heeft u een project in bestrating, grondwerk of riolering? WD Infra
            kijkt praktisch mee naar bereikbaarheid, planning, materieel en
            uitvoering.
          </p>
        </div>
        <div className="projects-overview-actions">
          <a href={phoneHref(siteSettings.telefoonnummer)}>{siteSettings.telefoonnummer}</a>
          <Link className="button button-primary" href="/contact" onNavigate={navigate}>
            Project bespreken
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServicesOverviewCta({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  return (
    <section className="section projects-overview-cta">
      <div className="container projects-overview-panel">
        <div>
          <p className="eyebrow">Diensten bespreken</p>
          <h2>Welke uitvoering past bij uw werk?</h2>
          <p>
            Van straatwerk tot grondwerk en riolering: WD Infra denkt mee over
            de juiste aanpak, capaciteit en planning voor uw project.
          </p>
        </div>
        <div className="projects-overview-actions">
          <a href={phoneHref(siteSettings.telefoonnummer)}>{siteSettings.telefoonnummer}</a>
          <Link className="button button-primary" href="/contact" onNavigate={navigate}>
            Diensten bespreken
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProjectContactCta({ navigate, project }: { navigate: (href: string) => void; project: Project }) {
  return (
    <section className="section project-contact-teaser">
      <div className="container project-contact-panel">
        <div>
          <p className="eyebrow">Project bespreken</p>
          <h2>Een vergelijkbaar project aanpakken?</h2>
          <p>
            WD Infra denkt mee over straatwerk, grondwerk, riolering, planning
            en materieel. Voor een project zoals {project.title.toLowerCase()} is
            vooral duidelijke afstemming vooraf belangrijk.
          </p>
        </div>
        <div className="project-contact-list">
          <span>Praktische opname van locatie en werkzaamheden</span>
          <span>Duidelijke planning, inzet en afspraken</span>
          <span>Direct schakelen met WD Infra uit Alblasserdam</span>
          <Link className="button button-primary" href="/contact" onNavigate={navigate}>
            Bespreek uw project
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServicesOverviewPage({
  navigate,
  services,
  servicesLoaded,
  siteSettings,
}: {
  navigate: (href: string) => void;
  services: Service[];
  servicesLoaded: boolean;
  siteSettings: SiteSettings;
}) {
  return (
    <>
      <PageHero
        eyebrow="Diensten"
        title="Infra werkzaamheden die overzichtelijk blijven"
        text="WD Infra helpt met bestrating, grondwerk, riolering en verhuur. Van kleine aanpassing tot groter project."
        image={pageHeroImage(siteSettings, 'diensten', '')}
        pattern="running"
      />
      <ServicesSection services={services} servicesLoaded={servicesLoaded} navigate={navigate} />
      <ServicesOverviewCta navigate={navigate} siteSettings={siteSettings} />
    </>
  );
}

function ServicePage({
  service,
  navigate,
  projects,
  projectsLoaded,
  siteSettings,
}: {
  service: Service;
  navigate: (href: string) => void;
  projects: Project[];
  projectsLoaded: boolean;
  siteSettings: SiteSettings;
}) {
  const projectTag = service.projectTag || service.slug;
  const relatedProjects = projects
    .filter((project) => project.serviceTags.includes(projectTag))
    .sort((a, b) => Date.parse(b.date || '') - Date.parse(a.date || ''))
    .slice(0, 3);

  return (
    <>
      <PageHero eyebrow="Dienst" title={service.title} text={service.intro} image={service.image} pattern="basket" />
      <section className="section">
        <div className="container detail-layout">
          <Reveal>
            <h2>{service.name || service.title}</h2>
            <p>{service.fullText || service.intro}</p>
            <Link className="button button-primary" href="/contact" onNavigate={navigate}>
              Vraag een offerte aan
            </Link>
          </Reveal>
          {service.bullets.length > 0 && (
            <Reveal className="check-list">
              <h3>Werkzaamheden</h3>
              {service.bullets.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </Reveal>
          )}
        </div>
      </section>
      <ProjectsPreview projects={relatedProjects} projectsLoaded={projectsLoaded} navigate={navigate} />
      <ServicesOverviewCta navigate={navigate} siteSettings={siteSettings} />
    </>
  );
}

function ProjectsPage({
  navigate,
  projects,
  projectsLoaded,
  siteSettings,
}: {
  navigate: (href: string) => void;
  projects: Project[];
  projectsLoaded: boolean;
  siteSettings: SiteSettings;
}) {
  return (
    <>
      <PageHero
        eyebrow="Projecten"
        title="Recent werk van WD Infra"
        text="Een compact overzicht van projecten in bestrating, grondwerk, riolering en terreinverharding."
        image={pageHeroImage(siteSettings, 'projecten', '')}
        pattern="modular"
      />
      <section className="section">
        <div className="container project-grid project-grid-wide">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard project={project} navigate={navigate} key={project.title} />
            ))
          ) : projectsLoaded ? (
            <EmptyProjectCards />
          ) : (
            <ProjectLoadingCards />
          )}
        </div>
      </section>
      <ProjectsOverviewCta navigate={navigate} siteSettings={siteSettings} />
    </>
  );
}

function toVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (host.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function ProjectMediaFrame({ media, className = '' }: { media: ProjectMedia; className?: string }) {
  if (media.type === 'video') {
    return (
      <video className={className} src={media.url} poster={media.poster || undefined} controls playsInline preload="metadata" />
    );
  }

  if (media.type === 'embed') {
    return (
      <iframe
        className={className}
        src={toVideoEmbedUrl(media.url)}
        title="Projectvideo"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return <img className={className} src={media.url} alt="" />;
}

function projectMediaFromProject(project: Project): ProjectMedia[] {
  if (project.media?.length) {
    return project.media.filter((item) => item.url);
  }

  return [project.image, ...project.gallery.filter((image) => image !== project.image)]
    .filter(Boolean)
    .map((url) => ({ type: 'image', url }) as ProjectMedia);
}

function ProjectDetailPage({ project, navigate }: { project: Project; navigate: (href: string) => void }) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const projectMedia = projectMediaFromProject(project);
  const currentMedia = projectMedia[selectedMedia] ?? projectMedia[0];
  const activeMedia = activeLightboxIndex !== null ? projectMedia[activeLightboxIndex] : null;
  const hasLightboxNavigation = projectMedia.length > 1;
  const showPreviousMedia = () => {
    setActiveLightboxIndex((index) => {
      if (index === null) return null;
      return (index - 1 + projectMedia.length) % projectMedia.length;
    });
  };
  const showNextMedia = () => {
    setActiveLightboxIndex((index) => {
      if (index === null) return null;
      return (index + 1) % projectMedia.length;
    });
  };

  useEffect(() => {
    setSelectedMedia(0);
    setActiveLightboxIndex(null);
  }, [project.slug]);

  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (event.key === 'ArrowLeft') {
        showPreviousMedia();
      } else if (event.key === 'ArrowRight') {
        showNextMedia();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, projectMedia.length]);

  useEffect(() => {
    if (projectMedia.length <= 1 || projectMedia.some((item) => item.type !== 'image')) return;

    const timer = window.setInterval(() => {
      setSelectedMedia((index) => (index + 1) % projectMedia.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [projectMedia.length]);

  return (
    <>
      <PageHero eyebrow="Project" title={project.title} text={project.text} image={project.image} pattern="modular" />
      <section className="section project-detail-section">
        <div className="container project-detail-layout">
          <Reveal>
            <p className="eyebrow">{project.place}</p>
            <p>{project.intro}</p>
            {project.serviceTags.length > 0 && (
              <div className="project-tags project-tags-linked" aria-label="Gekoppelde diensten">
                {project.serviceTags.map((tag) => (
                  <Link key={tag} href={getServiceTagHref(tag)} onNavigate={navigate}>
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </Reveal>
          {project.details.length > 0 && (
            <Reveal className="check-list">
              <h3>Werkzaamheden</h3>
              {project.details.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </Reveal>
          )}
        </div>
        {currentMedia && (
          <div className="container project-showcase">
            <Reveal className="project-main-image">
              {currentMedia.type === 'image' ? (
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(selectedMedia)}
                  aria-label="Vergroot projectafbeelding"
                >
                  <ProjectMediaFrame media={currentMedia} />
                </button>
              ) : (
                <div className="project-main-media">
                  <ProjectMediaFrame media={currentMedia} />
                </div>
              )}
            </Reveal>
            {projectMedia.length > 1 && (
              <Reveal className="project-thumb-grid">
                {projectMedia.map((media, mediaIndex) => {
                  return (
                    <button
                      className={selectedMedia === mediaIndex ? 'active' : ''}
                      type="button"
                      onMouseEnter={() => setSelectedMedia(mediaIndex)}
                      onFocus={() => setSelectedMedia(mediaIndex)}
                      onClick={() => {
                        setSelectedMedia(mediaIndex);
                        if (media.type === 'image') {
                          setActiveLightboxIndex(mediaIndex);
                        }
                      }}
                      aria-label={media.type === 'image' ? 'Vergroot projectafbeelding' : 'Selecteer projectvideo'}
                      key={`${media.type}-${media.url}-${mediaIndex}`}
                    >
                      <ProjectMediaFrame media={media} />
                      {media.type !== 'image' && <span className="project-thumb-video-label">Video</span>}
                    </button>
                  );
                })}
              </Reveal>
            )}
          </div>
        )}
      </section>
      {activeMedia && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Projectmedia">
          <button className="lightbox-backdrop" type="button" onClick={() => setActiveLightboxIndex(null)} aria-label="Sluit media" />
          <div className="lightbox-panel">
            <button className="lightbox-close" type="button" onClick={() => setActiveLightboxIndex(null)}>
              Sluiten
            </button>
            {hasLightboxNavigation && (
              <>
                <button className="lightbox-arrow lightbox-arrow-prev" type="button" onClick={showPreviousMedia} aria-label="Vorige media">
                  ‹
                </button>
                <button className="lightbox-arrow lightbox-arrow-next" type="button" onClick={showNextMedia} aria-label="Volgende media">
                  ›
                </button>
              </>
            )}
            <ProjectMediaFrame media={activeMedia} />
          </div>
        </div>
      )}
      <ProjectContactCta navigate={navigate} project={project} />
    </>
  );
}

function RentalPage({
  navigate,
  siteSettings,
  rentals,
}: {
  navigate: (href: string) => void;
  siteSettings: SiteSettings;
  rentals: RentalItem[];
}) {
  const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);

  return (
    <>
      <PageHero
        eyebrow="Verhuur / Zero Emission"
        title="Materieel en ondersteuning voor uw project"
        text="Heeft u met spoed een machine, product of extra vakmensen nodig? WD Infra denkt mee en schakelt praktisch."
        image={pageHeroImage(siteSettings, 'verhuur', '')}
        pattern="basket"
      />
      <section className="section">
        <div className="container rental-page-layout">
          <Reveal className="rental-intro">
            <h2>Verhuur via WD Infra</h2>
            <p>
              Naast uitvoering biedt WD Infra de mogelijkheid om materieel,
              machines en stratenmakerkoppels in te zetten. Handig wanneer u
              tijdelijk capaciteit mist of het werk deels zelf wilt oppakken.
            </p>
            <Link className="button button-primary" href="/contact" onNavigate={navigate}>
              Bel of mail voor beschikbaarheid
            </Link>
          </Reveal>
          <Reveal className="rental-grid rental-grid-full">
            {rentals.length > 0 ? (
              rentals.map((item) => (
                <RentalCard item={item} onSelect={setSelectedRental} key={item.slug} />
              ))
            ) : (
              <EmptyRentalCards />
            )}
          </Reveal>
        </div>
      </section>
      {selectedRental && (
        <RentalReserveModal item={selectedRental} siteSettings={siteSettings} onClose={() => setSelectedRental(null)} />
      )}
    </>
  );
}

function RentalCard({ item, onSelect }: { item: RentalItem; onSelect: (item: RentalItem) => void }) {
  return (
    <button
      className="rental-card rental-card-button clickable-card"
      type="button"
      onClick={() => onSelect(item)}
    >
      {item.image ? <img src={item.image} alt="" /> : <div className="rental-card-placeholder" />}
      <div>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </button>
  );
}

function EmptyRentalCards() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <article className="rental-card rental-card-empty" key={item}>
          <div className="rental-card-placeholder" />
          <div>
            <h3>Geen verhuuritems gepubliceerd</h3>
            <p>Zodra er verhuuritems in WordPress staan, verschijnen ze automatisch op deze plek.</p>
          </div>
        </article>
      ))}
    </>
  );
}

function RentalReserveModal({
  item,
  siteSettings,
  onClose,
}: {
  item: RentalItem;
  siteSettings: SiteSettings;
  onClose: () => void;
}) {
  const mailSubject = `Aanvraag verhuur - ${item.title}`;
  const mailBody = `Beste WD Infra,

Ik wil graag meer informatie ontvangen over de beschikbaarheid en mogelijkheden voor:

${item.title}

Korte omschrijving van mijn aanvraag:
- Project/locatie:
- Gewenste periode:
- Gewenste inzet of hoeveelheid:

Mijn contactgegevens:
- Naam:
- Telefoonnummer:

Met vriendelijke groet,`;

  const mailHref = `mailto:${siteSettings.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  return (
    <div className="reserve-modal" role="dialog" aria-modal="true" aria-label={`Reserveer ${item.title}`}>
      <button className="reserve-modal-backdrop" type="button" onClick={onClose} aria-label="Sluit reserveren" />
      <div className="reserve-modal-panel">
        <button className="reserve-modal-close" type="button" onClick={onClose}>
          Sluiten
        </button>
        <div className="reserve-modal-media">
          <img src={item.image} alt="" />
        </div>
        <div className="reserve-modal-content">
          <p className="eyebrow">Verhuur aanvragen</p>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
          <div className="reserve-actions">
            <a className="button button-primary" href={mailHref}>
              Reserveer per mail
            </a>
            <a className="button button-outline" href={phoneHref(siteSettings.telefoonnummer)}>
              Direct bellen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  return (
    <>
      <PageHero
        eyebrow="Over ons"
        title="Vakkundig infrabedrijf uit Alblasserdam"
        text="WD Infra is gericht op infrastructuur, kwaliteit en vakmanschap. Persoonlijke aandacht voor ieder project staat centraal."
        image={pageHeroImage(siteSettings, 'overOns', '')}
        pattern="running"
      />
      <section className="section about-values-section">
        <div className="container">
          <ValueSlider items={siteSettings.kernpuntenOverOns} />
        </div>
      </section>
      <section className="section">
        <div className="container about-intro-layout">
          <Reveal>
            <h2>Ruim 25 jaar ervaring</h2>
            <p>
              WD Infra is een vakkundig en ambitieus bedrijf met hoofdactiviteiten
              in bestrating, riolering, reconstructie en grondwerk. Het bedrijf
              werkt voor zowel grote als kleinere infrastructurele projecten.
            </p>
            <p>
              Met ruim dertig vakkundige stratenmakers en grondwerkers, VCA-2
              certificering en een instelling waarbij kwaliteit boven kwantiteit
              staat, blijft het werk betrouwbaar en overzichtelijk.
            </p>
            <Link className="button button-primary" href="/projecten" onNavigate={navigate}>
              Bekijk projecten
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ValueSlider({ items }: { items: InfoPoint[] }) {
  if (items.length === 0) {
    return null;
  }

  const loop = [...items, ...items];

  return (
    <Reveal className="value-slider values-rail" aria-label="Kernwaarden van WD Infra">
      <div className="values-rail-head">
        <p className="eyebrow">Onze manier van werken</p>
        <h2>Persoonlijk schakelen, praktisch uitvoeren</h2>
      </div>
      <div className="values-rail-viewport">
        <div className="values-rail-track">
          {loop.map((item, index) => (
            <article className="value-card value-slide" key={`${item.title}-${index}`}>
              <img className="value-mark" src={logoAsset('mark', 'WD-infra-enkel-logo.svg')} alt="" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function CareersPage({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  return (
    <>
      <PageHero
        eyebrow="Werken bij"
        title="Stratenmakers gezocht"
        text="Ben jij gemotiveerd, flexibel en heb je affiniteit met bestrating, riolering en grondwerk? Dan past WD Infra mogelijk bij jou."
        image={pageHeroImage(siteSettings, 'werkenBij', '')}
        pattern="basket"
      />
      <section className="section">
        <div className="container detail-layout">
          <Reveal>
            <h2>Vacature stratenmaker</h2>
            <p>
              Als stratenmaker bij WD Infra ben je voornamelijk bezig met
              bestratingswerkzaamheden, riolering en grondwerk. Hard werken,
              precisie en een praktische instelling zijn belangrijk.
            </p>
            <Link className="button button-primary" href="/contact" onNavigate={navigate}>
              Reageer op vacature
            </Link>
          </Reveal>
          {(siteSettings.careers.wijZoeken.length > 0 || siteSettings.careers.wijBieden.length > 0) && (
            <Reveal className="check-list">
              {siteSettings.careers.wijZoeken.length > 0 && (
                <>
                  <h3>Wat WD Infra zoekt</h3>
                  {siteSettings.careers.wijZoeken.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </>
              )}
              {siteSettings.careers.wijBieden.length > 0 && (
                <>
                  <h3>Wat WD Infra biedt</h3>
                  {siteSettings.careers.wijBieden.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </>
              )}
            </Reveal>
          )}
        </div>
        {siteSettings.galleries.werkenBij.length > 0 && (
          <div className="container career-image-grid">
            {siteSettings.galleries.werkenBij.map((image, index) => (
              <Reveal key={`${image}-${index}`}>
                <img src={image} alt="" />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ContactPage({ siteSettings }: { siteSettings: SiteSettings }) {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Neem contact op met WD Infra"
        text="Voor bestrating, grondwerk, riolering, verhuur of een offerte in Alblasserdam en regio Rotterdam."
        image={pageHeroImage(siteSettings, 'contact', '')}
        pattern="modular"
      />
      <ContactSection siteSettings={siteSettings} wideMap />
    </>
  );
}

function ContactMap({ siteSettings, wide = false }: { siteSettings: SiteSettings; wide?: boolean }) {
  return (
    <div className={`contact-map-card ${wide ? 'contact-map-card-wide' : ''}`}>
      <iframe
        title="Kaart WD Infra B.V."
        src={mapsEmbedUrl(siteSettings)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div>
        <span>Adres</span>
        <strong>WD Infra B.V.</strong>
        <p>{fullAddress(siteSettings)}</p>
      </div>
      <a
        className="button button-primary"
        href={mapsUrl(siteSettings)}
        target="_blank"
        rel="noreferrer"
      >
        Navigeer
      </a>
    </div>
  );
}

function ContactSection({ siteSettings, wideMap = false }: { siteSettings: SiteSettings; wideMap?: boolean }) {
  const hasContactForm = siteSettings.contactFormHtml.trim() !== '';

  return (
    <section className="section contact-section">
      <div className={`container contact-layout ${hasContactForm ? '' : 'contact-layout-no-form'}`}>
        <Reveal className="contact-info">
          <p className="eyebrow">Contactgegevens</p>
          <h2>Snel schakelen over uw project</h2>
          <address>
            <strong>WD Infra B.V.</strong>
            <br />
            {siteSettings.adres}
            <br />
            {siteSettings.postcode} {siteSettings.plaats}
          </address>
          <p>
            <a href={phoneHref(siteSettings.telefoonnummer)}>{siteSettings.telefoonnummer}</a>
            <br />
            <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
          </p>
          {!wideMap && <ContactMap siteSettings={siteSettings} />}
        </Reveal>
        {hasContactForm && (
          <div
            className="contact-form contact-form-embed"
            dangerouslySetInnerHTML={{ __html: siteSettings.contactFormHtml }}
          />
        )}
        {wideMap && <Reveal className="contact-map-wide-wrap"><ContactMap siteSettings={siteSettings} wide /></Reveal>}
      </div>
    </section>
  );
}

function PageHero({
  eyebrow,
  title,
  text,
  image,
  pattern = 'running',
}: {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  pattern?: 'running' | 'basket' | 'modular';
}) {
  return (
    <section className={`page-hero section-dark page-hero-pattern-${pattern}`}>
      {image && <div className="page-hero-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />}
      <div className="container page-hero-content">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{text}</p>
        </Reveal>
      </div>
    </section>
  );
}

function ProjectCard({ project, navigate }: { project: Project; navigate: (href: string) => void }) {
  return (
    <Reveal>
      <Link className="project-card clickable-card" href={`/project/${project.slug}`} onNavigate={navigate}>
        {project.image ? <img src={project.image} alt="" /> : <div className="project-card-placeholder" />}
        <div className="project-card-body">
          <span>{project.place}</span>
          <h3>{project.title}</h3>
          <p>{project.text}</p>
        </div>
      </Link>
    </Reveal>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <Reveal className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </Reveal>
  );
}

function LegalPage({ type }: { type: 'terms' | 'privacy' }) {
  const isPrivacy = type === 'privacy';
  const sections = isPrivacy ? privacySections : termsArticles;

  return (
    <>
      <PageHero
        eyebrow={isPrivacy ? 'Privacy' : 'Voorwaarden'}
        title={isPrivacy ? 'Privacy statement' : 'Algemene voorwaarden'}
        text={
          isPrivacy
            ? 'Hoe WD Infra omgaat met persoonsgegevens en contactaanvragen via de website.'
            : 'De uitgangspunten en voorwaarden voor werkzaamheden, aanvragen en samenwerking met WD Infra.'
        }
        image=""
      />
      <section className="section legal-section">
        <div className="container legal-layout">
          <Reveal>
            <p className="eyebrow">WD Infra B.V.</p>
            <h2>{isPrivacy ? 'Privacyverklaring van WD Infra' : 'Werk in onderaanneming van derden'}</h2>
            <p>
              {isPrivacy
                ? 'Deze pagina gebruikt de informatie uit het privacy statement van de bestaande WD Infra-website.'
                : 'Deze pagina gebruikt de informatie uit de algemene voorwaarden van de bestaande WD Infra-website.'}
            </p>
            <div className="legal-meta">
              {isPrivacy ? (
                <>
                  <strong>WD Infra b.v. - www.wdinfra.nl</strong>
                  <span>W.J. Koelewijn Holding b.v.</span>
                  <span>Laatste herziening: 09-05-2018</span>
                </>
              ) : (
                <>
                  <strong>WD Infra b.v. te Alblasserdam</strong>
                  <span>KvK 58893768</span>
                  <span>W.J. Koelewijn Holding b.v. - KvK 24322260</span>
                </>
              )}
            </div>
          </Reveal>
          <Reveal className="legal-card legal-list">
            {sections.map(([label, title, text]) => (
              <article key={`${label}-${title}`}>
                {!isPrivacy && <span>{label}</span>}
                <h3>{isPrivacy ? label : title}</h3>
                <p>{isPrivacy ? title : text}</p>
              </article>
            ))}
            <p className="legal-contact-note">
              Voor vragen over deze pagina kunt u contact opnemen via
              <a href="mailto:info@wdinfra.nl"> info@wdinfra.nl</a>.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Footer({ navigate, siteSettings }: { navigate: (href: string) => void; siteSettings: SiteSettings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-layout">
        <div>
          <img className="footer-logo" src={logoAsset('footer', 'WD-infra-enkel-logo-lang.svg')} alt="WD Infra B.V." />
          <p>
            Praktisch infra werk voor bestrating, grondwerk, riolering en
            verhuur vanuit Alblasserdam.
          </p>
        </div>
        <nav className="footer-nav" aria-label="Footernavigatie">
          <h2>Navigatie</h2>
          {footerNavItems.map(([label, href]) => (
            <Link key={label} href={href} onNavigate={navigate}>
              {label}
            </Link>
          ))}
        </nav>
        <div>
          <h2>Contactgegevens</h2>
          <p>
            <a
              className="footer-address-link"
              href={mapsUrl(siteSettings)}
              target="_blank"
              rel="noreferrer"
            >
              {siteSettings.adres}
              <br />
              {siteSettings.postcode} {siteSettings.plaats}
            </a>
            <br />
            <br />
            <a href={phoneHref(siteSettings.telefoonnummer)}>T: {siteSettings.telefoonnummer}</a>
            <br />
            <a href={`mailto:${siteSettings.email}`}>E: {siteSettings.email}</a>
          </p>
          <p className="legal-links">
            <Link href="/algemene-voorwaarden" onNavigate={navigate}>
              Algemene voorwaarden
            </Link>
            <Link href="/privacy-statement" onNavigate={navigate}>
              Privacy statement
            </Link>
          </p>
        </div>
      </div>
      <div className="container copyright">
        <span>&copy; WD Infra B.V. {currentYear}</span>
        <span>
          Gerealiseerd door{' '}
          <a href="https://devtec.nl" target="_blank" rel="noreferrer">
            Devtec
          </a>
        </span>
      </div>
    </footer>
  );
}

function getRouteTitle(path: string, services: Service[], projects: Project[], rentals: RentalItem[]) {
  const serviceMatch = path.match(/^\/dienst\/([^/]+)$/);
  if (serviceMatch) {
    const slug = decodeURIComponent(serviceMatch[1]);
    return services.find((item) => item.slug === slug)?.title || 'Diensten';
  }

  const projectMatch = path.match(/^\/project\/([^/]+)$/);
  if (projectMatch) {
    const slug = decodeURIComponent(projectMatch[1]);
    return projects.find((item) => item.slug === slug)?.title || 'Projecten';
  }

  const rentalMatch = path.match(/^\/verhuur\/([^/]+)$/);
  if (rentalMatch) {
    const slug = decodeURIComponent(rentalMatch[1]);
    return rentals.find((item) => item.slug === slug)?.title || 'Verhuur';
  }

  const routeTitles: Record<string, string> = {
    '/': 'Home',
    '/diensten': 'Diensten',
    '/projecten': 'Projecten',
    '/verhuur': 'Verhuur',
    '/over-ons': 'Over ons',
    '/over-wd-infra': 'Over ons',
    '/werken-bij': 'Werken bij',
    '/contact': 'Contact',
    '/algemene-voorwaarden': 'Algemene voorwaarden',
    '/privacy-statement': 'Privacy statement',
    '/hero-voorbeelden': 'Hero voorbeelden',
  };

  if (path.startsWith('/dienst')) return 'Diensten';
  if (path.startsWith('/project')) return 'Projecten';
  if (path.startsWith('/verhuur')) return 'Verhuur';

  return routeTitles[path] || 'Home';
}

function App() {
  const { path, navigate } = usePath();
  const { projects, projectsLoaded } = useProjects();
  const { services, servicesLoaded } = useServices();
  const { rentals, rentalsLoaded } = useRentals();
  const { settings: siteSettings, settingsLoaded } = useSiteSettings();
  const dataLoaded = settingsLoaded && projectsLoaded && servicesLoaded && rentalsLoaded;

  useEffect(() => {
    document.documentElement.style.setProperty('--wd-mark-logo', `url("${logoAsset('mark', 'WD-infra-enkel-logo.svg')}")`);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    document.title = `${getRouteTitle(path, services, projects, rentals)} - WD Infra`;
  }, [path, projects, rentals, services, settingsLoaded]);

  useEffect(() => {
    document.documentElement.classList.add('js-reveal');
    const reveals = [...document.querySelectorAll('.reveal')];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [path, projects.length, projectsLoaded, services.length, servicesLoaded, rentals.length, rentalsLoaded, settingsLoaded]);

  const page = useMemo(() => {
    if (!dataLoaded) {
      return null;
    }

    const serviceMatch = path.match(/^\/dienst\/([^/]+)$/);
    if (serviceMatch) {
      const serviceSlug = decodeURIComponent(serviceMatch[1]);
      const service = services.find((item) => item.slug === serviceSlug);
      return service ? (
        <ServicePage
          service={service}
          navigate={navigate}
          projects={projects}
          projectsLoaded={projectsLoaded}
          siteSettings={siteSettings}
        />
      ) : (
        <ServicesOverviewPage services={services} servicesLoaded={servicesLoaded} siteSettings={siteSettings} navigate={navigate} />
      );
    }

    const projectMatch = path.match(/^\/project\/([^/]+)$/);
    if (projectMatch) {
      const projectSlug = decodeURIComponent(projectMatch[1]);
      const project = projects.find((item) => item.slug === projectSlug);
      return project ? (
        <ProjectDetailPage project={project} navigate={navigate} />
      ) : (
        <ProjectsPage navigate={navigate} projects={projects} projectsLoaded={projectsLoaded} siteSettings={siteSettings} />
      );
    }

    const rentalMatch = path.match(/^\/verhuur\/([^/]+)$/);
    if (rentalMatch) {
      return <RentalPage navigate={navigate} siteSettings={siteSettings} rentals={rentals} />;
    }

    switch (path) {
      case '/':
        return (
          <HomePage
            navigate={navigate}
            projects={projects}
            projectsLoaded={projectsLoaded}
            services={services}
            servicesLoaded={servicesLoaded}
            siteSettings={siteSettings}
          />
        );
      case '/diensten':
        return <ServicesOverviewPage services={services} servicesLoaded={servicesLoaded} siteSettings={siteSettings} navigate={navigate} />;
      case '/projecten':
        return <ProjectsPage navigate={navigate} projects={projects} projectsLoaded={projectsLoaded} siteSettings={siteSettings} />;
      case '/verhuur':
        return <RentalPage navigate={navigate} siteSettings={siteSettings} rentals={rentals} />;
      case '/over-ons':
      case '/over-wd-infra':
        return <AboutPage navigate={navigate} siteSettings={siteSettings} />;
      case '/werken-bij':
        return <CareersPage navigate={navigate} siteSettings={siteSettings} />;
      case '/contact':
        return <ContactPage siteSettings={siteSettings} />;
      case '/algemene-voorwaarden':
        return <LegalPage type="terms" />;
      case '/privacy-statement':
        return <LegalPage type="privacy" />;
      case '/hero-voorbeelden':
        return <HeroExamplesPage navigate={navigate} />;
      default:
        if (path.startsWith('/dienst')) {
          return <ServicesOverviewPage services={services} servicesLoaded={servicesLoaded} siteSettings={siteSettings} navigate={navigate} />;
        }

        if (path.startsWith('/project')) {
          return <ProjectsPage navigate={navigate} projects={projects} projectsLoaded={projectsLoaded} siteSettings={siteSettings} />;
        }

        if (path.startsWith('/verhuur')) {
          return <RentalPage navigate={navigate} siteSettings={siteSettings} rentals={rentals} />;
        }

        return <HomePage navigate={navigate} projects={projects} projectsLoaded={projectsLoaded} services={services} servicesLoaded={servicesLoaded} siteSettings={siteSettings} />;
    }
  }, [dataLoaded, path, projects, projectsLoaded, rentals, services, servicesLoaded, siteSettings]);

  return (
    <>
      {dataLoaded ? (
        <>
          <Header path={path} navigate={navigate} services={services} siteSettings={siteSettings} />
          <main>{page}</main>
          <Footer navigate={navigate} siteSettings={siteSettings} />
        </>
      ) : (
        <main className="site-loading" aria-label="Website laden" />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

