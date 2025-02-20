import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

import styles from "./Navigation.module.scss";
import menu from "./menu-options";
import NavItem from "./NavItem";
import Dropdown from "../../components/Dropdown/Dropdown";
import { ReactComponent as MainLogo } from "../../assets/main-logo.svg";
import CurrentUserBox from "../CurrentUserBox/CurrentUserBox";
import OverviewIcon from "../../assets/overview-icon.svg";

const dropdownStyles = {
    dropdownContainer: {
        borderRadius: "5px",
    },
    dropdownLabel: {
        fontSize: "11px",
        color: "#2b2c33",
    },
};

function Navigation({ auth, accounts, activeDomain, location, history, setDomain }) {
    const [state, setState] = useState({
        domainOptions: [],
        showAddDomainModal: false,
        showDomainSuccessModal: false,
    });

    const setDomainsDropdownData = () => {
        if (!accounts?.data?.domains) return;

        const optionsDefault = accounts.data.domains
            .sort((a, b) => {
                const domainA = a.domain_name.toLowerCase();
                const domainB = b.domain_name.toLowerCase();
                return domainA.localeCompare(domainB);
            })
            .filter((item) => !item.is_deleted)
            .map((item) => ({
                value: item.id,
                label: item.domain_name,
            }));

        setState((prev) => ({
            ...prev,
            domainOptions: optionsDefault,
        }));
    };

    // Initial domains setup
    useEffect(() => {
        if (accounts?.data?.domains?.length) {
            setDomainsDropdownData();
        }
    }, [accounts?.data?.domains]);

    // Update domains when accounts change
    useEffect(() => {
        const shouldUpdateDomains =
            accounts?.data?.domains?.length &&
            state.domainOptions.length !== accounts.data.domains.filter((dom) => !dom.is_deleted).length;

        if (shouldUpdateDomains) {
            setDomainsDropdownData();
        }
    }, [accounts?.data?.domains, state.domainOptions.length]);

    const handleDomainChange = (val) => {
        const selectedDomain = accounts.data.domains.find((item) => item.id === val.value);
        if (selectedDomain) {
            setDomain(selectedDomain);
        }
    };

    const toggleDomainSuccessModal = () => {
        setState((prev) => ({
            ...prev,
            showDomainSuccessModal: !prev.showDomainSuccessModal,
            showAddDomainModal: false,
        }));
    };

    const renderNavItems = () => {
        return menu.navItems.map((item) => (
            <NavItem
                key={item.title}
                item={item}
                userRole={auth.user.role}
                activeDomain={activeDomain}
                isDisabled={
                    !!(
                        item.protected &&
                        (auth.user.role === "Viewer" ||
                            (item.blockForRoles && item.blockForRoles.includes(auth.user.role)))
                    )
                }
                location={location}
                history={history}
                isExternal={item.isExternal}
            />
        ));
    };

    return (
        <div className={styles.vertical}>
            <div className={styles.logoWrap}>
                <MainLogo className={styles.logo} />
            </div>

            <div className={styles.externalMenu}>
                <div className={styles.menuLabel}>All Websites</div>
                <Link className={styles.navItemTitle} to="/overview">
                    <img className={styles.overviewMenuIcon} src={OverviewIcon} alt="Overview" />
                    <p>Overview</p>
                </Link>
            </div>

            <section className={styles.navBlock}>
                <Dropdown
                    containerStyle={dropdownStyles.dropdownContainer}
                    labelStyle={dropdownStyles.dropdownLabel}
                    selectClass={styles.dropdown}
                    label="Single Website"
                    name="activeDomain"
                    onOptionChange={handleDomainChange}
                    value={
                        activeDomain?.data
                            ? {
                                  value: activeDomain.data.id,
                                  label: activeDomain.data.domain_name,
                              }
                            : null
                    }
                    options={state.domainOptions}
                />
            </section>

            {renderNavItems()}

            {/* {auth.user && (
                <CurrentUserBox
                    user={auth.user}
                    history={history}
                    activeDomain={activeDomain}
                    accounts={accounts}
                />
            )} */}
        </div>
    );
}

Navigation.propTypes = {
    auth: PropTypes.shape({
        user: PropTypes.object,
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.shape({
            domains: PropTypes.array,
        }),
    }),
    activeDomain: PropTypes.object,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    setDomain: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
    auth: state.auth,
    accounts: state.accounts,
    activeDomain: state.activeDomain,
});

export default connect(mapStateToProps)(Navigation);
