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
  'unicef.org': {
    homepageUrl: 'https://www.unicef.org',
    listingUrl: 'https://jobs.unicef.org/en-us/listing/',
    opportunityUrlPatterns: ['/job/'],
  },
  'who.int': {
    homepageUrl: 'https://www.who.int',
    listingUrl: 'https://www.who.int/careers/process/v_listing/en/',
    searchUrl: 'https://careers.who.int/careersection/ex/joblist.ftl',
  },
  'reliefweb.int': {
    homepageUrl: 'https://reliefweb.int',
    listingUrl: 'https://reliefweb.int/jobs',
    opportunityUrlPatterns: ['/jobs/'],
  },
  'rescue.org': {
    homepageUrl: 'https://www.rescue.org',
    listingUrl: 'https://rescue.csod.com/ux/ats/careersite/1/home?c=rescue',
  },
  'nrc.no': {
    homepageUrl: 'https://www.nrc.no',
    listingUrl: 'https://ekum.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/',
  },
  'drc.ngo': {
    homepageUrl: 'https://drc.ngo',
    listingUrl: 'https://job.drc.ngo/jobs/',
  },
  'savethechildren.net': {
    homepageUrl: 'https://www.savethechildren.net',
    listingUrl: 'https://stc.taleo.net/careersection/ex/joblist.ftl',
  },
  'worldvision.org': {
    homepageUrl: 'https://www.worldvision.org',
    listingUrl: 'https://worldvision.wd1.myworkdayjobs.com/WorldVisionInternational',
  },
  'plan-international.org': {
    homepageUrl: 'https://plan-international.org',
    listingUrl: 'https://jobs.plan-international.org/',
  },
  'mercycorps.org': {
    homepageUrl: 'https://www.mercycorps.org',
    listingUrl: 'https://www.mercycorps.org/careers',
  },
  'devex.com': {
    homepageUrl: 'https://www.devex.com',
    listingUrl: 'https://www.devex.com/jobs/search',
    opportunityUrlPatterns: ['/jobs/'],
  },
  'impactpool.org': {
    homepageUrl: 'https://www.impactpool.org',
    listingUrl: 'https://www.impactpool.org/jobs',
    opportunityUrlPatterns: ['/jobs/'],
  },
  'epso.europa.eu': {
    homepageUrl: 'https://epso.europa.eu',
    listingUrl: 'https://epso.europa.eu/en/job-opportunities/open-for-application',
  },
  'imf.org': {
    homepageUrl: 'https://www.imf.org',
    listingUrl: 'https://imf.wd1.myworkdayjobs.com/IMF',
  },
  'au.int': {
    homepageUrl: 'https://au.int',
    listingUrl: 'https://careers.au.int/',
  },
  'ajira.go.tz': {
    homepageUrl: 'http://portal.ajira.go.tz',
    listingUrl: 'http://portal.ajira.go.tz/index.php/advert/index',
    opportunityUrlPatterns: ['/advert/display/'],
  },
  'brightermonday.co.tz': {
    homepageUrl: 'https://www.brightermonday.co.tz',
    listingUrl: 'https://www.brightermonday.co.tz/jobs',
    opportunityUrlPatterns: ['/listings/'],
  },
  'zoomtanzania.com': {
    homepageUrl: 'https://www.zoomtanzania.com',
    listingUrl: 'https://www.zoomtanzania.com/jobs',
  },
  'crdbbank.co.tz': {
    homepageUrl: 'https://crdbbank.co.tz',
    listingUrl: 'https://crdbbank.co.tz/careers/',
  },
  'nmbbank.co.tz': {
    homepageUrl: 'https://www.nmbbank.co.tz',
    listingUrl: 'https://www.nmbbank.co.tz/careers/',
  },
  'vodacom.co.tz': {
    homepageUrl: 'https://www.vodacom.co.tz',
    listingUrl: 'https://vodacom.taleo.net/careersection/2/joblist.ftl',
  },
  'tanzajob.com': {
    homepageUrl: 'https://www.tanzajob.com',
    listingUrl: 'https://www.tanzajob.com/jobs',
    listingItemSelector: '.job-listing, .job-item, article',
    itemTitleSelectors: ['.job-title', 'h2 a', 'h3 a'],
    itemDescriptionSelectors: ['.job-description', '.summary', '.excerpt'],
    itemDateSelectors: ['.posted', 'time', '.date'],
    itemUrlSelectors: ['.job-title a', 'h2 a', 'h3 a'],
    detailPageRequired: true,
    opportunityUrlPatterns: ['/job/', '/jobs/'],
    exclusionPatterns: ['/category/', '/tag/', '/page/'],
  },
  'jobweb.co.tz': {
    homepageUrl: 'https://www.jobweb.co.tz',
    listingUrl: 'https://www.jobweb.co.tz/jobs',
    listingItemSelector: '.job-listing, .job-item, article',
    itemTitleSelectors: ['.job-title', 'h2 a', 'h3 a'],
    itemDescriptionSelectors: ['.job-description', '.summary', '.excerpt'],
    itemDateSelectors: ['.posted', 'time', '.date'],
    itemUrlSelectors: ['.job-title a', 'h2 a', 'h3 a'],
    detailPageRequired: true,
    opportunityUrlPatterns: ['/job/', '/jobs/'],
    exclusionPatterns: ['/category/', '/tag/', '/page/'],
  },
  'chevening.org': {
    homepageUrl: 'https://www.chevening.org',
    listingUrl: 'https://www.chevening.org/scholarships/',
    sitemapUrl: 'https://www.chevening.org/sitemap.xml',
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
  'ox.ac.uk': {
    homepageUrl: 'https://www.ox.ac.uk',
    sitemapUrl: 'https://www.ox.ac.uk/sitemap.xml',
    listingUrl: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/scholarships-a-z',
  },
  'cambridge.org': {
    homepageUrl: 'https://www.cambridge.org',
    listingUrl: 'https://www.cambridge.org/scholarships',
  },
  'lse.ac.uk': {
    homepageUrl: 'https://www.lse.ac.uk',
    sitemapUrl: 'https://www.lse.ac.uk/sitemap.xml',
    listingUrl: 'https://www.lse.ac.uk/study-at-lse/Scholarships',
  },
  'ucl.ac.uk': {
    homepageUrl: 'https://www.ucl.ac.uk',
    sitemapUrl: 'https://www.ucl.ac.uk/sitemap.xml',
    listingUrl: 'https://www.ucl.ac.uk/scholarships/',
  },
  'imperial.ac.uk': {
    homepageUrl: 'https://www.imperial.ac.uk',
    sitemapUrl: 'https://www.imperial.ac.uk/sitemap.xml',
    listingUrl: 'https://www.imperial.ac.uk/study/fees-and-funding/scholarships/',
  },
  'ed.ac.uk': {
    homepageUrl: 'https://www.ed.ac.uk',
    sitemapUrl: 'https://www.ed.ac.uk/sitemap.xml',
    listingUrl: 'https://www.ed.ac.uk/student-funding/search',
  },
  'harvard.edu': {
    homepageUrl: 'https://www.harvard.edu',
    sitemapUrl: 'https://www.harvard.edu/sitemap.xml',
    listingUrl: 'https://www.harvard.edu/scholarships/',
  },
  'mit.edu': {
    homepageUrl: 'https://www.mit.edu',
    sitemapUrl: 'https://www.mit.edu/sitemap.xml',
    listingUrl: 'https://www.mit.edu/scholarships/',
  },
  'stanford.edu': {
    homepageUrl: 'https://www.stanford.edu',
    sitemapUrl: 'https://www.stanford.edu/sitemap.xml',
    listingUrl: 'https://www.stanford.edu/scholarships/',
  },
  'princeton.edu': {
    homepageUrl: 'https://www.princeton.edu',
    sitemapUrl: 'https://www.princeton.edu/sitemap.xml',
    listingUrl: 'https://www.princeton.edu/admission-aid/affordability/',
  },
  'columbia.edu': {
    homepageUrl: 'https://www.columbia.edu',
    sitemapUrl: 'https://www.columbia.edu/sitemap.xml',
    listingUrl: 'https://www.columbia.edu/scholarships/',
  },
  'yale.edu': {
    homepageUrl: 'https://www.yale.edu',
    sitemapUrl: 'https://www.yale.edu/sitemap.xml',
    listingUrl: 'https://www.yale.edu/scholarships/',
  },
  'berkeley.edu': {
    homepageUrl: 'https://www.berkeley.edu',
    sitemapUrl: 'https://www.berkeley.edu/sitemap.xml',
    listingUrl: 'https://www.berkeley.edu/scholarships/',
  },
  'sydney.edu.au': {
    homepageUrl: 'https://www.sydney.edu.au',
    sitemapUrl: 'https://www.sydney.edu.au/sitemap.xml',
    listingUrl: 'https://www.sydney.edu.au/scholarships/',
  },
  'unimelb.edu.au': {
    homepageUrl: 'https://www.unimelb.edu.au',
    sitemapUrl: 'https://www.unimelb.edu.au/sitemap.xml',
    listingUrl: 'https://www.unimelb.edu.au/scholarships/',
  },
  'anu.edu.au': {
    homepageUrl: 'https://www.anu.edu.au',
    sitemapUrl: 'https://www.anu.edu.au/sitemap.xml',
    listingUrl: 'https://www.anu.edu.au/scholarships/',
  },
  'utoronto.ca': {
    homepageUrl: 'https://www.utoronto.ca',
    sitemapUrl: 'https://www.utoronto.ca/sitemap.xml',
    listingUrl: 'https://www.utoronto.ca/scholarships/',
  },
  'ubc.ca': {
    homepageUrl: 'https://www.ubc.ca',
    sitemapUrl: 'https://www.ubc.ca/sitemap.xml',
    listingUrl: 'https://www.ubc.ca/scholarships/',
  },
  'mcgill.ca': {
    homepageUrl: 'https://www.mcgill.ca',
    sitemapUrl: 'https://www.mcgill.ca/sitemap.xml',
    listingUrl: 'https://www.mcgill.ca/scholarships/',
  },
  'nus.edu.sg': {
    homepageUrl: 'https://www.nus.edu.sg',
    sitemapUrl: 'https://www.nus.edu.sg/sitemap.xml',
    listingUrl: 'https://www.nus.edu.sg/scholarships/',
  },
  'ntu.edu.sg': {
    homepageUrl: 'https://www.ntu.edu.sg',
    sitemapUrl: 'https://www.ntu.edu.sg/sitemap.xml',
    listingUrl: 'https://www.ntu.edu.sg/scholarships/',
  },
  'u-tokyo.ac.jp': {
    homepageUrl: 'https://www.u-tokyo.ac.jp',
    sitemapUrl: 'https://www.u-tokyo.ac.jp/sitemap.xml',
    listingUrl: 'https://www.u-tokyo.ac.jp/en/admissions/scholarships/',
  },
  'kaist.ac.kr': {
    homepageUrl: 'https://www.kaist.ac.kr',
    listingUrl: 'https://www.kaist.ac.kr/scholarships/',
  },
  'snu.ac.kr': {
    homepageUrl: 'https://www.snu.ac.kr',
    listingUrl: 'https://www.snu.ac.kr/scholarships/',
  },
  'ethz.ch': {
    homepageUrl: 'https://www.ethz.ch',
    sitemapUrl: 'https://www.ethz.ch/sitemap.xml',
    listingUrl: 'https://www.ethz.ch/en/studies/financing/scholarships.html',
  },
  'epfl.ch': {
    homepageUrl: 'https://www.epfl.ch',
    sitemapUrl: 'https://www.epfl.ch/sitemap.xml',
    listingUrl: 'https://www.epfl.ch/education/studying-at-epfl/scholarships/',
  },
  'tudelft.nl': {
    homepageUrl: 'https://www.tudelft.nl',
    sitemapUrl: 'https://www.tudelft.nl/sitemap.xml',
    listingUrl: 'https://www.tudelft.nl/en/education/programmes/scholarships/',
  },
  'kuleuven.be': {
    homepageUrl: 'https://www.kuleuven.be',
    listingUrl: 'https://www.kuleuven.be/english/scholarships/',
  },
  'polimi.it': {
    homepageUrl: 'https://www.polimi.it',
    listingUrl: 'https://www.polimi.it/en/scholarships/',
  },
  'uio.no': {
    homepageUrl: 'https://www.uio.no',
    sitemapUrl: 'https://www.uio.no/sitemap.xml',
    listingUrl: 'https://www.uio.no/english/studies/financing/scholarships/',
  },
  'kth.se': {
    homepageUrl: 'https://www.kth.se',
    sitemapUrl: 'https://www.kth.se/sitemap.xml',
    listingUrl: 'https://www.kth.se/en/studies/master/scholarships',
  },
  'helsinki.fi': {
    homepageUrl: 'https://www.helsinki.fi',
    sitemapUrl: 'https://www.helsinki.fi/sitemap.xml',
    listingUrl: 'https://www.helsinki.fi/en/admissions-and-education/scholarships',
  },
  'aalto.fi': {
    homepageUrl: 'https://www.aalto.fi',
    sitemapUrl: 'https://www.aalto.fi/sitemap.xml',
    listingUrl: 'https://www.aalto.fi/en/services/scholarships',
  },
  'sorbonne.fr': {
    homepageUrl: 'https://www.sorbonne.fr',
    listingUrl: 'https://www.sorbonne.fr/en/scholarships/',
  },
  'campusfrance.org': {
    homepageUrl: 'https://www.campusfrance.org',
    sitemapUrl: 'https://www.campusfrance.org/sitemap.xml',
    listingUrl: 'https://www.campusfrance.org/en/scholarships',
  },
  'study-in.de': {
    homepageUrl: 'https://www.study-in.de',
    listingUrl: 'https://www.study-in.de/en/plan-your-studies/funding/scholarships/',
  },
  'studyinjapan.go.jp': {
    homepageUrl: 'https://www.studyinjapan.go.jp',
    listingUrl: 'https://www.studyinjapan.go.jp/en/planning/scholarships/',
  },
  'studyinkorea.go.kr': {
    homepageUrl: 'https://www.studyinkorea.go.kr',
    listingUrl: 'https://www.studyinkorea.go.kr/en/sub/gks/allm_scholarship.do',
  },
  'studyinaustralia.gov.au': {
    homepageUrl: 'https://www.studyinaustralia.gov.au',
    listingUrl: 'https://www.studyinaustralia.gov.au/english/study/scholarships',
  },
  'studyinchina.com': {
    homepageUrl: 'https://www.studyinchina.com',
    listingUrl: 'https://www.studyinchina.com/scholarships/',
  },
  'studyinturkiye.gov.tr': {
    homepageUrl: 'https://www.studyinturkiye.gov.tr',
    listingUrl: 'https://www.studyinturkiye.gov.tr/StudyinTurkey/Home/GetScholarshipList',
  },
  'studyinhungary.hu': {
    homepageUrl: 'https://www.studyinhungary.hu',
    listingUrl: 'https://www.studyinhungary.hu/scholarships/',
  },
  'educanada.ca': {
    homepageUrl: 'https://www.educanada.ca',
    listingUrl: 'https://www.educanada.ca/scholarships/',
  },
  'britishcouncil.org': {
    homepageUrl: 'https://www.britishcouncil.org',
    sitemapUrl: 'https://www.britishcouncil.org/sitemap.xml',
    listingUrl: 'https://www.britishcouncil.org/study-work-abroad/scholarships',
  },
  'scholarshipamerica.org': {
    homepageUrl: 'https://www.scholarshipamerica.org',
    sitemapUrl: 'https://www.scholarshipamerica.org/sitemap.xml',
    listingUrl: 'https://www.scholarshipamerica.org/find-scholarships/',
  },
  'fastweb.com': {
    homepageUrl: 'https://www.fastweb.com',
    listingUrl: 'https://www.fastweb.com/scholarships',
  },
  'scholarships.com': {
    homepageUrl: 'https://www.scholarships.com',
    listingUrl: 'https://www.scholarships.com/scholarships/',
  },
  'chegg.com': {
    homepageUrl: 'https://www.chegg.com',
    listingUrl: 'https://www.chegg.com/scholarships',
  },
  'mastersportal.com': {
    homepageUrl: 'https://www.mastersportal.com',
    sitemapUrl: 'https://www.mastersportal.com/sitemap.xml',
    listingUrl: 'https://www.mastersportal.com/scholarships/',
  },
  'hest.or.tz': {
    homepageUrl: 'https://www.hest.or.tz',
    listingUrl: 'https://www.hest.or.tz/loan-application/',
  },
  'mext.go.jp': {
    homepageUrl: 'https://www.mext.go.jp',
    listingUrl: 'https://www.mext.go.jp/en/',
  },
  'isdb.org': {
    homepageUrl: 'https://www.isdb.org',
    sitemapUrl: 'https://www.isdb.org/sitemap.xml',
    listingUrl: 'https://www.isdb.org/scholarships',
  },
  'adb.org': {
    homepageUrl: 'https://www.adb.org',
    sitemapUrl: 'https://www.adb.org/sitemap.xml',
    listingUrl: 'https://www.adb.org/scholarships',
  },
  'csc.edu.cn': {
    homepageUrl: 'https://www.csc.edu.cn',
    listingUrl: 'https://www.csc.edu.cn/scholarships/',
  },
  'scholarshipsafrica.com': {
    homepageUrl: 'https://www.scholarshipsafrica.com',
    listingUrl: 'https://www.scholarshipsafrica.com/scholarships/',
  },
  'opportunitiesforyouth.org': {
    homepageUrl: 'https://www.opportunitiesforyouth.org',
    listingUrl: 'https://www.opportunitiesforyouth.org/category/scholarships/',
  },
  'opportunitydesk.org': {
    homepageUrl: 'https://www.opportunitydesk.org',
    listingUrl: 'https://www.opportunitydesk.org/category/scholarships/',
  },
  'worldscholarshipforum.com': {
    homepageUrl: 'https://www.worldscholarshipforum.com',
    listingUrl: 'https://www.worldscholarshipforum.com/scholarships/',
  },
  'studyabroad.com': {
    homepageUrl: 'https://www.studyabroad.com',
    listingUrl: 'https://www.studyabroad.com/scholarships/',
  },
  'iefa.org': {
    homepageUrl: 'https://www.iefa.org',
    listingUrl: 'https://www.iefa.org/scholarships/',
  },
  'kgspinew.com': {
    homepageUrl: 'https://www.kgspinew.com',
    listingUrl: 'https://www.kgspinew.com/scholarships/',
  },
  'yesprogram.org': {
    homepageUrl: 'https://www.yesprogram.org',
    listingUrl: 'https://www.yesprogram.org/apply/',
  },
  'worldbank.org': {
    sitemapUrl: 'https://www.worldbank.org/sitemap.xml',
    listingUrl: 'https://www.worldbank.org/en/search?q=scholarship',
  },
  'unesco.org': {
    homepageUrl: 'https://www.unesco.org',
    sitemapUrl: 'https://www.unesco.org/sitemap.xml',
    listingUrl: 'https://www.unesco.org/en/scholarships',
  },
  'mastercardfdn.org': {
    homepageUrl: 'https://www.mastercardfdn.org',
    listingUrl: 'https://mastercardfdn.org/scholarships/',
  },
  'uct.ac.za': {
    homepageUrl: 'https://www.uct.ac.za',
    sitemapUrl: 'https://www.uct.ac.za/sitemap.xml',
    listingUrl: 'https://www.uct.ac.za/scholarships/',
  },
  'wits.ac.za': {
    homepageUrl: 'https://www.wits.ac.za',
    sitemapUrl: 'https://www.wits.ac.za/sitemap.xml',
    listingUrl: 'https://www.wits.ac.za/scholarships/',
  },
  'sun.ac.za': {
    homepageUrl: 'https://www.sun.ac.za',
    sitemapUrl: 'https://www.sun.ac.za/sitemap.xml',
    listingUrl: 'https://www.sun.ac.za/scholarships/',
  },
  'up.ac.za': {
    homepageUrl: 'https://www.up.ac.za',
    sitemapUrl: 'https://www.up.ac.za/sitemap.xml',
    listingUrl: 'https://www.up.ac.za/scholarships/',
  },
  'uonbi.ac.ke': {
    homepageUrl: 'https://www.uonbi.ac.ke',
    listingUrl: 'https://www.uonbi.ac.ke/scholarships/',
  },
  'ku.ac.ke': {
    homepageUrl: 'https://www.ku.ac.ke',
    listingUrl: 'https://www.ku.ac.ke/scholarships/',
  },
  'mak.ac.ug': {
    homepageUrl: 'https://www.mak.ac.ug',
    listingUrl: 'https://www.mak.ac.ug/scholarships/',
  },
  'udsm.ac.tz': {
    homepageUrl: 'https://www.udsm.ac.tz',
    listingUrl: 'https://www.udsm.ac.tz/scholarships/',
  },
  'unilag.edu.ng': {
    homepageUrl: 'https://www.unilag.edu.ng',
    listingUrl: 'https://www.unilag.edu.ng/scholarships/',
  },
  'oas.org': {
    homepageUrl: 'https://www.oas.org',
    sitemapUrl: 'https://www.oas.org/sitemap.xml',
    listingUrl: 'https://www.oas.org/en/topics/scholarships',
  },
}

export function getSourceProfile(sourceUrl: string): SourceProfile | undefined {
  try {
    const url = new URL(sourceUrl)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

    const directMatch =
      SOURCE_PROFILES[sourceUrl] ||
      SOURCE_PROFILES[url.origin] ||
      SOURCE_PROFILES[hostname]

    if (directMatch) return directMatch

    const parts = hostname.split('.')
    if (parts.length > 2) {
      return SOURCE_PROFILES[parts.slice(1).join('.')] || SOURCE_PROFILES[parts.slice(-2).join('.')]
    }

    return undefined
  } catch {
    return SOURCE_PROFILES[sourceUrl]
  }
}
