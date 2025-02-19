const dashboardMenu = [{
    title: '+ Add Website',
    route: {
        pathname: '/add-domain',
        state: {
            modal: true
        }
    },
    protected: true
}];

const accountMenu = [{
        title: 'Settings',
        options: [{
                text: 'User Management',
                route: '/account/settings/user-management',
                protected: true,
                blockForManager: true,
                blockForRoles: ['Manager', 'Client', 'Viewer']
            },
            {
                text: 'Notifications',
                route: '/account/settings/notifications'
            },
            {
                text: 'Edit Profile',
                route: '/account/settings/edit-profile'
            },
            {
                text: 'Password',
                route: '/account/settings/password'
            }
        ]
    },
    {
        title: 'API',
        route: '/account/api',
        protected: true,
        blockForRoles: ['Viewer']
    },
    {
        title: 'Billing',
        protected: true,
        options: [{
                text: 'Subscription',
                route: '/account/billing/subscription',
                protected: true,
                blockForRoles: ['Client'],
            },
            {
                text: 'Invoices',
                route: '/account/billing/invoices',
                protected: true,
                blockForRoles: ['Client'],
            }
        ]
    },
    {
        title: 'Legal',
        options: [{
                text: 'Terms of Service',
                route: 'https://fraudblocker.com/terms',
                isExternal: true
            },
            {
                text: 'Privacy Policy',
                route: 'https://fraudblocker.com/privacy',
                isExternal: true
            },
            {
                text: 'Cookie Policy',
                route: 'https://fraudblocker.com/cookies',
                isExternal: true
            }
        ]
    }
];

const customizationMenu = [{
        title: 'Detection Rules',
        route: '/customizations/detection-rules',
        options: []
    },
    {
        title: 'IP Blocking',
        route: '/customizations/ip-blocking',
        options: []
    }
];

const integrationsMenu = [{
        title: 'Fraud Tracker',
        route: '/integrations/fraud-blocker-tracker',
        options: []
    },
    {
        title: 'Advertising Setup',
        options: [{
                text: 'Google Ads',
                route: '/integrations/google-ads-setup'
            },
            {
                text: 'Meta Ads',
                route: '/integrations/meta-ads-setup'
            }
        ]
    },
    {
        title: 'Conversion Tracking',
        route: '/integrations/conversion-tracking',
        options: []
    }
];

export default {
    dashboardMenu,
    accountMenu,
    customizationMenu,
    integrationsMenu
};