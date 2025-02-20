import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import styles from "./SubMenu.module.scss";
import User from "../../redux/actions/User";
import SubNavLink from "./SubNavLink";

// DomainNavItem Component
const DomainNavItem = ({ domain, onClick }) => (
    <a onClick={() => onClick(domain)} className={styles.subNavItem}>
        <div className={styles.subPlaceholder} />
        <p>{domain.domain_name}</p>
    </a>
);

DomainNavItem.propTypes = {
    domain: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

// Main SubMenuNavItem Component
function SubMenuNavItem({ item, location, accounts, userRole, hasMetaAccess, setDomain, activeDomain }) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const shouldExpand =
                item?.title?.toLowerCase() &&
                (item.title.toLowerCase().includes("setting") || item.title.toLowerCase().includes("advertising"));
            setIsExpanded(shouldExpand);
        }, 1000);

        return () => {
            clearTimeout(timer);
            setIsExpanded(false);
        };
    }, [item?.title]);

    useEffect(() => {
        if (accounts?.data && activeDomain) {
            const totalDomains = accounts.data.domains.length;
            const prevTotalDomains = accounts.data.domains.length - 1;

            if (totalDomains > prevTotalDomains && activeDomain.id !== accounts.data.domains[totalDomains - 1].id) {
                setDomain(accounts.data.domains[totalDomains - 1]);
            }
        }
    }, [accounts?.data?.domains?.length, activeDomain, setDomain]);

    const toggleOptions = () => setIsExpanded((prev) => !prev);

    const renderDomains = () => {
        if (!activeDomain || !accounts?.data?.domains) return null;

        const filteredDomains = accounts.data.domains.filter((domain) => domain.id !== activeDomain.data.id);

        return filteredDomains.map((domain) => <DomainNavItem key={domain.id} domain={domain} onClick={setDomain} />);
    };

    const hasOptions = item.options?.length > 0;
    const isNavActive = location.pathname.includes(item.route) && !hasOptions;
    const includesDomain = location.pathname.includes("domain");
    const parentNavStyle = !hasOptions ? `${styles.navItemTitle} ${styles.withHover}` : styles.navItemTitle;

    const renderSubNavItems = () => {
        if (!hasOptions) return null;

        return item.options.map((link) => {
            if (link.text === "Meta Ads" && !hasMetaAccess) return null;

            const isActive = location.pathname.includes(link.route);
            const disabledForViewer =
                link.protected &&
                (userRole === "Viewer" || (link.blockForRoles && link.blockForRoles.includes(userRole)));
            const commonClassName = `${isActive ? styles.subNavItemActive : styles.subNavItem} ${
                disabledForViewer ? styles.disabledForViewer : ""
            }`;

            if (!link.route) {
                return (
                    <p
                        key={link.text}
                        dangerouslySetInnerHTML={{ __html: link.text }}
                        className={`${styles.subNavItem} ${styles.comingSoon}`}
                    />
                );
            }

            if (link.isExternal) {
                return (
                    <a
                        key={link.route}
                        href={link.route}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={commonClassName}
                    >
                        <p>{link.text}</p>
                    </a>
                );
            }

            return (
                <Link key={link.route} to={link.route} className={commonClassName}>
                    <p>{link.text}</p>
                </Link>
            );
        });
    };

    return (
        <div className={styles.navItem}>
            {item.route === "/logout" ? (
                <a onClick={User.signOut} className={isNavActive ? styles.navItemTitleActive : parentNavStyle}>
                    <item.icon className={styles.icon} />
                    <p>{item.title}</p>
                </a>
            ) : (
                <SubNavLink
                    isDisabled={
                        item.protected &&
                        (userRole === "Viewer" || (item.blockForRoles && item.blockForRoles.includes(userRole)))
                    }
                    item={item}
                    location={location}
                    toggleOptions={toggleOptions}
                    isExpanded={isExpanded}
                />
            )}

            {includesDomain && accounts.data.domains.length > 1 && renderDomains()}

            <div
                className={`${styles.hasMenuItem} ${
                    hasOptions && !isExpanded && styles.removeMenuItemActive
                } ${hasOptions && isExpanded && styles.hasMenuItemActive}`}
            >
                {renderSubNavItems()}
            </div>
        </div>
    );
}

SubMenuNavItem.propTypes = {
    item: PropTypes.shape({
        route: PropTypes.string,
        title: PropTypes.string.isRequired,
        icon: PropTypes.elementType,
        options: PropTypes.arrayOf(
            PropTypes.shape({
                route: PropTypes.string,
                text: PropTypes.string.isRequired,
                isExternal: PropTypes.bool,
                protected: PropTypes.bool,
                blockForRoles: PropTypes.arrayOf(PropTypes.string),
            })
        ),
        protected: PropTypes.bool,
        blockForRoles: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.shape({
            domains: PropTypes.arrayOf(PropTypes.object).isRequired,
        }).isRequired,
    }),
    setDomain: PropTypes.func,
    activeDomain: PropTypes.shape({
        id: PropTypes.string,
        data: PropTypes.object,
    }),
    userRole: PropTypes.string,
    hasMetaAccess: PropTypes.bool,
};

SubMenuNavItem.defaultProps = {
    hasMetaAccess: false,
    accounts: { data: { domains: [] } },
    userRole: "",
};

export default React.memo(SubMenuNavItem);
