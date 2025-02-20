import {
    Dashboard,
    // Stats,
    // Advertising,
    // DetectionRules,
    // IPBlocking,
    // FraudBlockerTracker,
    // GoogleAdsSetup,
    // MetaAdsSetup,
    // Notifications,
    // Domain,
    // EditProfile,
    // NotificationSettings,
    // UserManagement,
    // Password,
    // Subscription,
    // Help,
    // Terms,
    // Overview,
    // Invoices,
    // ConversionTracking,
    // Api
} from "../pages";

// import { DefaultLayout } from '../containers/DefaultLayout';

const routes = [
    {
        path: "/",
        exact: true,
        name: "Default Layout",
        isDefaultLayout: true,
        // component: DefaultLayout
    },
    {
        path: "/dashboard",
        requiresSubscription: true,
        requiresDomain: true,
        exact: true,
        name: "Dashboard",
        component: Dashboard,
    },
    // {
    //     path: '/advertising',
    //     requiresSubscription: true,
    //     requiresDomain: true,
    //     exact: true,
    //     name: 'Advertising',
    //     component: Advertising
    // },
    // {
    //     path: '/stats',
    //     requiresSubscription: true,
    //     requiresDomain: true,
    //     exact: true,
    //     name: 'Stats',
    //     component: Stats
    // },
    // {
    //     path: '/notifications',
    //     exact: true,
    //     name: 'Notifications',
    //     component: Notifications
    // },
    // {
    //     path: '/change-domain',
    //     requiresDomain: true,
    //     exact: true,
    //     name: 'Change Domains',
    //     component: Domain
    // },
    // {
    //     path: '/add-domain',
    //     requiresSubscription: true,
    //     protected: true,
    //     exact: true,
    //     name: 'Add Domains',
    //     blockForRoles: ['Client'],
    //     component: Domain
    // },
    // {
    //     path: '/customizations',
    //     exact: true,
    //     name: 'Customizations',
    //     requiresDomain: true,
    //     requiresSubscription: false, // enable it back after testing
    //     protected: true, // Protected = Viewer Cannot view - only managers and owner
    //     redirect: '/customizations/detection-rules'
    // },
    // {
    //     path: '/customizations/detection-rules',
    //     exact: true,
    //     name: 'Detection Rules',
    //     requiresDomain: true,
    //     requiresSubscription: false, // enable it back after testing
    //     protected: true,
    //     component: DetectionRules
    // },
    // {
    //     path: '/customizations/ip-blocking',
    //     exact: true,
    //     name: 'IP Blocking',
    //     requiresDomain: true,
    //     requiresSubscription: true,
    //     protected: true,
    //     component: IPBlocking
    // },
    // {
    //     path: '/integrations',
    //     exact: true,
    //     name: 'Integrations',
    //     requiresDomain: true,
    //     requiresSubscription: false, // enable it back after testing
    //     protected: true,
    //     redirect: '/integrations/fraud-blocker-tracker'
    // },
    // {
    //     path: '/integrations/fraud-blocker-tracker',
    //     exact: true,
    //     name: 'Fraud Tracker',
    //     requiresDomain: true,
    //     requiresSubscription: false, // enable it back after testing
    //     protected: true,
    //     component: FraudBlockerTracker
    // },
    // {
    //     path: '/integrations/google-ads-setup',
    //     exact: true,
    //     name: 'Google Ads Setup',
    //     requiresDomain: true,
    //     requiresSubscription: true,
    //     protected: true,
    //     component: GoogleAdsSetup
    // },
    // {
    //     path: '/integrations/meta-ads-setup',
    //     exact: true,
    //     name: 'Meta Ads Setup',
    //     requiresDomain: true,
    //     requiresSubscription: true,
    //     protected: true,
    //     component: MetaAdsSetup
    // },
    // {
    //     path: '/integrations/conversion-tracking',
    //     exact: true,
    //     name: 'Conversion Tracking',
    //     requiresDomain: true,
    //     requiresSubscription: false, // enable it back after testing
    //     protected: true,
    //     component: ConversionTracking
    // },
    // {
    //     path: '/account',
    //     exact: true,
    //     name: 'Account',
    //     redirect: '/account/settings/user-management'
    // },
    // {
    //     path: '/account/settings/edit-profile',
    //     exact: true,
    //     name: 'Edit Profile',
    //     component: EditProfile
    // },
    // {
    //     path: '/account/settings/notifications',
    //     exact: true,
    //     name: 'Notification Settings',
    //     component: NotificationSettings
    // },
    // {
    //     path: '/account/settings/user-management',
    //     exact: true,
    //     name: 'User Management',
    //     protected: true,
    //     blockForManager: true,
    //     blockForRoles: ['Manager', 'Client', 'Viewer'],
    //     component: UserManagement
    // },
    // {
    //     path: '/account/settings/password',
    //     exact: true,
    //     name: 'Password Settings',
    //     component: Password
    // },
    // {
    //     path: '/account/billing/invoices',
    //     exact: true,
    //     name: 'Invoices',
    //     protected: true,
    //     blockForRoles: ['Manager', 'Client'],
    //     component: Invoices
    // },
    // {
    //     path: '/account/billing/subscription',
    //     exact: true,
    //     name: 'Subscription Settings',
    //     protected: true,
    //     blockForManager: true,
    //     blockForRoles: ['Manager', 'Client'],
    //     component: Subscription
    // },
    // {
    //     path: '/account/help',
    //     exact: true,
    //     name: 'Account Help',
    //     component: Help
    // },
    // {
    //     path: '/account/api',
    //     exact: true,
    //     protected: true,
    //     name: 'API',
    //     blockForRoles: ['Viewer'],
    //     component: Api
    // },
    // {
    //     path: '/overview',
    //     exact: true,
    //     name: 'Account Overview',
    //     component: Overview
    // },
    // {
    //     path: '/account/terms',
    //     exact: true,
    //     name: 'Terms & Policies',
    //     component: Terms
    // },
    {
        path: "/logout",
        exact: true,
        name: "Logout",
        redirect: "/login",
    },
];

const routesWithSubNav = [
    // '/customizations',
    // '/customizations/detection-rules',
    // '/customizations/ip-blocking',
    // '/integrations',
    // '/integrations/fraud-blocker-tracker',
    // '/integrations/conversion-tracking',
    // '/integrations/google-ads-setup',
    // '/integrations/meta-ads-setup',
    // '/change-domain',
    // '/add-domain',
    // '/account',
    // '/account/settings/edit-profile',
    // '/account/settings/notifications',
    // '/account/settings/user-management',
    // '/account/settings/password',
    // '/account/billing/invoices',
    // '/account/billing/subscription',
    // '/account/help',
    // '/account/terms',
    // '/account/api'
];

export default {
    routes,
    routesWithSubNav,
};
