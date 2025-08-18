// Application routes configuration
export const routes = {
  // Public routes
  home: '/',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  howItWorks: '/howitworks',
  
  // Authentication routes
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forget',
  callback: '/auth/callback',

   // Stripe checkout routes (NEW ✅)
  checkoutSuccess: '/checkout/success',
  checkoutCancel: '/checkout/cancel',
  
  // User routes
  dashboard: '/dashboard',
  profile: '/profile',
  updateProfile: '/updateProfile',
  completeProfile: '/complete-profile',
  changePassword: '/change-password',
  
  // Game routes
  quiz: '/quiz',
  league: '/league',
  liveCompetition: '/livecompetition',
  
  // Gamification routes
  leaderboard: '/leaderboard',
  stats: '/stats',
  
  // Content routes
  sportsArticles: '/sports-articles',
  articleView: '/articleview',
  
  // Legal routes
  policy: '/policy',
  termsOfService: '/termsofservice',
  cookiePolicy: '/cookiepolicy',
  disclaimer: '/disclaimer',
  fairPlayPolicy: '/fairplaypolicy',
  trustAndSafety: '/trustandsafety',
  refundPayoutPolicy: '/refundpayoutpolicy',
  personalData: '/personaldata',
  
  // Admin routes
  adminDashboard: '/admindashboard',
} as const;

// Route groups for navigation
export const routeGroups = {
  public: [
    routes.home,
    routes.about,
    routes.contact,
    routes.faq,
    routes.howItWorks,
  ],
  auth: [
    routes.login,
    routes.signup,
    routes.forgotPassword,
  ],
  user: [
    routes.dashboard,
    routes.profile,
    routes.updateProfile,
    routes.stats,
  ],
  games: [
    routes.quiz,
    routes.league,
    routes.liveCompetition,
    routes.leaderboard,
  ],
  content: [
    routes.sportsArticles,
    routes.articleView,
  ],
  legal: [
    routes.policy,
    routes.termsOfService,
    routes.cookiePolicy,
    routes.disclaimer,
    routes.fairPlayPolicy,
    routes.trustAndSafety,
    routes.refundPayoutPolicy,
    routes.personalData,
  ],
} as const;

// Protected routes that require authentication
export const protectedRoutes = [
  routes.dashboard,
  routes.profile,
  routes.updateProfile,
  routes.completeProfile,
  routes.changePassword,
  routes.quiz,
  routes.league,
  routes.liveCompetition,
  routes.leaderboard,
  routes.stats,
  routes.adminDashboard,
] as const;

// Public routes that don't require authentication
export const publicRoutes = [
  routes.home,
  routes.about,
  routes.contact,
  routes.faq,
  routes.howItWorks,
  routes.login,
  routes.signup,
  routes.forgotPassword,
  routes.callback,
  routes.sportsArticles,
  routes.articleView,
  ...routeGroups.legal,
] as const;

export type RouteKey = keyof typeof routes;
export type Route = typeof routes[RouteKey];
