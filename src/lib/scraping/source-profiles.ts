export interface SourceProfile {
  homepageUrl?: string
  listingUrl?: string
  rssUrl?: string
  sitemapUrl?: string
  searchUrl?: string
  listingItemSelector?: string
  detailPageLinkSelector?: string
  paginationSelector?: string
  itemTitleSelectors?: string[]
  itemDescriptionSelectors?: string[]
  itemDateSelectors?: string[]
  itemUrlSelectors?: string[]
  detailPageRequired?: boolean
  opportunityUrlPatterns?: string[]
  exclusionPatterns?: string[]
}

export const SOURCE_PROFILES: Record<string, SourceProfile> = {
  'daad.de': {
    homepageUrl: 'https://www.daad.de',
    listingUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    sitemapUrl: 'https://www.daad.de/sitemap.xml',
    searchUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
  },
  'chevening.org': {
    homepageUrl: 'https://www.chevening.org',
    listingUrl: 'https://www.chevening.org/scholarships/',
    sitemapUrl: 'https://www.chevening.org/sitemap.xml',
    searchUrl: 'https://www.chevening.org/scholarships/',
    opportunityUrlPatterns: ['/scholarships','/awards','/news'],
    paginationSelector: '.pagination a[rel="next"], .next',
  },
  'fulbright.org': {
    homepageUrl: 'https://www.fulbright.org',
    rssUrl: 'https://fulbright.org/feed/',
    listingUrl: 'https://fulbright.org/',
    opportunityUrlPatterns: ['/programs','/grants','/opportunities'],
  },
  'gatescambridge.org': {
    homepageUrl: 'https://www.gatescambridge.org',
    sitemapUrl: 'https://www.gatescambridge.org/sitemap.xml',
    listingUrl: 'https://www.gatescambridge.org/',
  },
  'rhodeshouse.ox.ac.uk': {
    homepageUrl: 'https://www.rhodeshouse.ox.ac.uk',
    sitemapUrl: 'https://www.rhodeshouse.ox.ac.uk/sitemap.xml',
    listingUrl: 'https://www.rhodeshouse.ox.ac.uk/scholarships/',
  },
  'mastercardfdn.org': {
    homepageUrl: 'https://www.mastercardfdn.org',
    listingUrl: 'https://mastercardfdn.org/en/',
  },
  'scholarship-positions.com': {
    homepageUrl: 'https://www.scholarship-positions.com',
    listingUrl: 'https://scholarship-positions.com/category/scholarships/',
    rssUrl: 'https://scholarship-positions.com/feed/',
    // Keep generic HTML extraction; tighten URL matching so we don't waste fetch budget
    // on category navigation pages and irrelevant posts.
    opportunityUrlPatterns: [
      '/scholarship-',
      '/scholarships/',
      '/scholarship/',
      '/202',
    ],
    exclusionPatterns: [
      '/category/',
      '/tag/',
      '/page/',
      '/author/',
    ],
  },
  'scholars4dev.com': {
    homepageUrl: 'https://www.scholars4dev.com',
    // Prefer RSS if present, but ensure the listing page is the canonical category view.
    rssUrl: 'https://www.scholars4dev.com/feed',
    listingUrl: 'https://www.scholars4dev.com/scholarship/',
    // Tighten match: avoid /category/ landing pages; focus on actual scholarship detail slugs.
    opportunityUrlPatterns: ['/scholarship/','/scholarships/','/202'],
    exclusionPatterns: ['/category/','/tag/','/page/','/author/'],
  },
  'afterschoolafrica.com': {
    homepageUrl: 'https://afterschoolafrica.com',
    listingUrl: 'https://afterschoolafrica.com/category/scholarships/',
  },
  'opportunitiespedia.com': {
    homepageUrl: 'https://www.opportunitiespedia.com',
    rssUrl: 'https://opportunitiespedia.com/feed/',
    sitemapUrl: 'https://opportunitiespedia.com/sitemap_index.xml',
    listingUrl: 'https://opportunitiespedia.com/category/scholarships/',
    opportunityUrlPatterns: ['/category/','/opportunity/','/scholarship/'],
  },
  'linkedin.com': {
    homepageUrl: 'https://www.linkedin.com/jobs',
    listingUrl: 'https://www.linkedin.com/jobs/search/',
    searchUrl: 'https://www.linkedin.com/jobs/search/',
    opportunityUrlPatterns: ['/jobs/view', '/jobs/search', '/jobs/'],
    exclusionPatterns: ['/company/','/school/'],
  },
  'indeed.com': {
    homepageUrl: 'https://www.indeed.com',
    listingUrl: 'https://www.indeed.com/jobs?q=&l=',
    searchUrl: 'https://www.indeed.com/jobs?q=&l=',
    opportunityUrlPatterns: ['/rc/clk?','/viewjob'],
  },
  'glassdoor.com': {
    homepageUrl: 'https://www.glassdoor.com',
    listingUrl: 'https://www.glassdoor.com/Job/jobs.htm',
    searchUrl: 'https://www.glassdoor.com/Job/jobs.htm',
  },
  'monster.com': {
    homepageUrl: 'https://www.monster.com',
    sitemapUrl: 'https://www.monster.com/sitemaps/psp/psp-sitemap-index.xml',
    searchUrl: 'https://www.monster.com/jobs',
  },
  'careerbuilder.com': {
    homepageUrl: 'https://www.careerbuilder.com',
    sitemapUrl: 'https://www.careerbuilder.com/sitemaps/psp/psp-sitemap-index.xml',
    searchUrl: 'https://www.careerbuilder.com/jobs',
  },
  'ziprecruiter.com': {
    homepageUrl: 'https://www.ziprecruiter.com',
    listingUrl: 'https://www.ziprecruiter.com/candidate/search?search=',
    searchUrl: 'https://www.ziprecruiter.com/candidate/search?search=',
  },
  'simplyhired.com': {
    homepageUrl: 'https://www.simplyhired.com',
    sitemapUrl: 'https://www.simplyhired.com/sitemap/viewjob/sitemap_index.xml',
    searchUrl: 'https://www.simplyhired.com/search?q=',
  },
  'angel.co': {
    homepageUrl: 'https://www.angel.co',
    listingUrl: 'https://angel.co/jobs',
    searchUrl: 'https://angel.co/jobs',
  },
  'un.org': {
    homepageUrl: 'https://www.un.org',
    listingUrl: 'https://careers.un.org/lbw/home.aspx?viewtype=SJ',
    searchUrl: 'https://careers.un.org/lbw/home.aspx?viewtype=SJ',
  },
  'undp.org': {
    homepageUrl: 'https://www.undp.org',
    // UNDP jobs list moved across page variants; use the jobs root as the most stable entry.
    listingUrl: 'https://www.undp.org/careers',
    sitemapUrl: 'https://www.undp.org/sitemap.xml',
    searchUrl: 'https://www.undp.org/careers',
    // UNDP career detail pages typically include '/careers/' or '/jobs/' in the path.
    opportunityUrlPatterns: ['/careers/','/jobs/','/opportunities/'],
    exclusionPatterns: ['/sitemap','/search','/careers/locations'],
  },
  'fundsforngos.org': {
    homepageUrl: 'https://www.fundsforngos.org',
    listingUrl: 'https://www.fundsforngos.org/our-categories/grants-fellowship/',
    opportunityUrlPatterns: ['/grants/','/fellowship/','/apply/'],
  },
  'gatesfoundation.org': {
    homepageUrl: 'https://www.gatesfoundation.org',
    sitemapUrl: 'https://www.gatesfoundation.org/sitemap_index.xml',
    searchUrl: 'https://www.gatesfoundation.org/search',
  },
  'afdb.org': {
    homepageUrl: 'https://www.afdb.org',
    listingUrl: 'https://www.afdb.org/en/topics-and-sectors/grants',
    sitemapUrl: 'https://www.afdb.org/sitemap.xml',
    opportunityUrlPatterns: ['/grants','/projects','/opportunities'],
  },
  'worldbank.org': {
    homepageUrl: 'https://www.worldbank.org',
    sitemapUrl: 'https://www.worldbank.org/sitemap.xml',
    listingUrl: 'https://www.worldbank.org/en/search?q=grant',
    searchUrl: 'https://www.worldbank.org/en/search',
    opportunityUrlPatterns: ['/projects', '/en/projects', '/en/news'],
    exclusionPatterns: ['/topics', '/research'],
  },
  'grants.gov': {
    homepageUrl: 'https://www.grants.gov',
    listingUrl: 'https://www.grants.gov/web/grants/search-grants.html',
    searchUrl: 'https://www.grants.gov/web/grants/search-grants.html',
  },
  'usaid.gov': {
    homepageUrl: 'https://www.usaid.gov',
    listingUrl: 'https://www.usaid.gov/work-usa/grants',
    sitemapUrl: 'https://www.usaid.gov/sitemap.xml',
  },
  'sida.se': {
    homepageUrl: 'https://www.sida.se',
    sitemapUrl: 'https://sida.se/sitemap.xml',
    listingUrl: 'https://www.sida.se/en/grants/',
  },
  'giz.de': {
    homepageUrl: 'https://www.giz.de',
    listingUrl: 'https://www.giz.de/en/jobs',
    searchUrl: 'https://www.giz.de/en/jobs',
  },
}

export function getSourceProfile(sourceUrl: string): SourceProfile | undefined {
  try {
    const url = new URL(sourceUrl)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()
    return SOURCE_PROFILES[sourceUrl] || SOURCE_PROFILES[url.origin] || SOURCE_PROFILES[hostname]
  } catch {
    return SOURCE_PROFILES[sourceUrl]
  }
}
