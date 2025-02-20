import { ReactComponent as Analytics } from "../../assets/analytics.svg";
import { ReactComponent as YourAccount } from "../../assets/my-account.svg";
import { ReactComponent as Support } from "../../assets/support-icon.svg";
import { ReactComponent as Setups } from "../../assets/setups-icon.svg";

const navItems = [
    {
        title: "Analytics",
        icon: Analytics,
        options: [
            {
                text: "Dashboard",
                route: "/dashboard",
            },
            {
                text: "Fraud Score",
                route: "/stats",
            },
            {
                text: "Reports",
                route: "/advertising",
            },
        ],
    },
    {
        title: "Tools",
        icon: Setups,
        protected: true,
        isLast: true,
        options: [
            {
                text: "Customizations",
                route: "/customizations",
                protected: true,
                hasSubNav: true,
            },
            {
                text: "Setup",
                route: "/integrations",
                protected: true,
                hasSubNav: true,
            },
            {
                text: "Add Website",
                route: "/add-domain",
                protected: true,
                blockForRoles: ["Client"],
            },
        ],
    },
    {
        title: "Your Account",
        icon: YourAccount,
        route: "/account",
        options: [],
        hasBadge: false,
        hasSubNav: true,
    },
    {
        title: "Help",
        icon: Support,
        route: "https://help.fraudblocker.com/en/collections/1818202-help-and-answers",
        isExternal: true,
        options: [],
        isLast: true,
    },
];

export default {
    navItems,
};
