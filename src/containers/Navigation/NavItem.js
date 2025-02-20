import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";

import ArrowRight from "../../assets/dropdown-arrow.svg";
import Exclamation from "../../assets/exclamation.png";
import AddDomainSuccessModal from '../AddDomainSuccessModal/AddDomainSuccessModal';
import AddDomainModal from '../AddDomainModal/AddDomainModal';
import styles from "./Navigation.module.scss";

function NavItem({
    item,
    location,
    isDisabled = false,
    unread = 0,
    history,
    isExternal = false,
    activeDomain,
    userRole,
}) {
    const [state, setState] = useState({
        showAddDomainModal: false,
        showDomainSuccessModal: false,
    });

    const handleAddDomain = () => {
        setState((prev) => ({
            ...prev,
            showAddDomainModal: true,
        }));
    };

    const toggleDomainSuccessModal = () => {
        setState((prev) => ({
            ...prev,
            showDomainSuccessModal: !prev.showDomainSuccessModal,
            showAddDomainModal: false,
        }));
    };

    const closeDomainModal = () => {
        setState((prev) => ({
            ...prev,
            showAddDomainModal: false,
        }));
    };

    const handleMenuClick = (route) => {
        if (route === "/add-domain") {
            handleAddDomain();
        }
    };

    const renderNavLink = () => {
        const navContent = (
            <>
                <item.icon className={styles.icon} />
                <p>{item.title}</p>
                {item.hasSubNav && <img className={styles.rightArrow} src={ArrowRight} alt="expand" />}
                {item.hasBadge && <span className={styles.badge}>{unread}</span>}
            </>
        );

        const linkClassName = `${styles.navItemTitle} ${isDisabled ? styles.disabledForViewer : ""}`;

        if (isExternal) {
            return (
                <a className={linkClassName} href={item.route || "/"} target="_blank" rel="noopener noreferrer">
                    {navContent}
                </a>
            );
        }

        return (
            <Link className={linkClassName} to={item.route || item.options[0]?.route || "/"}>
                {navContent}
            </Link>
        );
    };

    const renderSubNavItems = () => {
        if (!item.options?.length) return null;

        return (
            <div className={styles.subNavBlock}>
                {item.options.map((link) => {
                    const isActive = location.pathname.includes(link.route);
                    const isLinkDisabled = !!(
                        link.protected &&
                        (userRole === "Viewer" || (link.blockForRoles && link.blockForRoles.includes(userRole)))
                    );

                    return (
                        <Link
                            key={link.route}
                            className={`${styles.subNavItem} ${
                                isActive ? styles.subNavItemActive : ""
                            } ${isDisabled || isLinkDisabled ? styles.disabledForViewer : ""}`}
                            to={link.route === "/add-domain" ? location.pathname : link.route}
                            onClick={() => handleMenuClick(link.route)}
                        >
                            {link.text === "Customizations" && activeDomain?.data?.monitoring_only ? (
                                <Tooltip>
                                    <Tooltip.Button className="flex items-center">
                                        Customizations{" "}
                                        <img className={styles.monitoringWarning} src={Exclamation} alt="warning" />
                                    </Tooltip.Button>
                                    <Tooltip.Panel className="z-10 p-2 text-sm bg-white rounded shadow-lg">
                                        'Monitoring only' mode is enabled. Turn off in your Customizations.
                                    </Tooltip.Panel>
                                </Tooltip>
                            ) : (
                                link.text
                            )}
                            {link.hasSubNav && <img className={styles.rightArrow} src={ArrowRight} alt="expand" />}
                        </Link>
                    );
                })}
            </div>
        );
    };

    const isNavActive = location.pathname.includes(item.route);

    return (
        <div
            className={`${styles.navItem} ${
                item.isLast ? styles.navBorder : ""
            } ${isNavActive ? styles.navItemActive : ""}`}
        >
            {renderNavLink()}
            {renderSubNavItems()}

            <AddDomainModal
                onSuccess={toggleDomainSuccessModal}
                onCancel={closeDomainModal}
                isOpen={state.showAddDomainModal}
            />

            <AddDomainSuccessModal
                isOpen={state.showDomainSuccessModal}
                toggleModal={toggleDomainSuccessModal}
                history={history}
            />
        </div>
    );
}

NavItem.propTypes = {
    item: PropTypes.shape({
        title: PropTypes.string.isRequired,
        route: PropTypes.string,
        icon: PropTypes.elementType.isRequired,
        options: PropTypes.arrayOf(
            PropTypes.shape({
                text: PropTypes.string.isRequired,
                route: PropTypes.string.isRequired,
                protected: PropTypes.bool,
                blockForRoles: PropTypes.arrayOf(PropTypes.string),
                hasSubNav: PropTypes.bool,
            })
        ).isRequired,
        hasSubNav: PropTypes.bool,
        hasBadge: PropTypes.bool,
        isLast: PropTypes.bool,
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
    }).isRequired,
    history: PropTypes.object,
    isDisabled: PropTypes.bool,
    unread: PropTypes.number,
    isExternal: PropTypes.bool,
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            monitoring_only: PropTypes.bool,
        }),
    }),
    userRole: PropTypes.string,
};

export default NavItem;
