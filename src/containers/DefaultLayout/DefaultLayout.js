import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import RouteConfig from '../../router/RouteConfig';
import AuthedRoute from '../../router/AuthedRoute';
import styles from './DefaultLayout.module.scss';
import Navigation from '../Navigation/Navigation';
import subMenu from '../SubMenu/submenu-options';
import SubMenu from '../SubMenu/SubMenu';
import { ActiveDomain, Account } from '../../redux/actions';

function DefaultLayout({
    auth,
    accounts,
    activeDomain,
    setDomain: setDomainAction,
    checkSubscription
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const [state, setState] = useState({
        showSubNav: false,
        actOnInvalidSubscription: false,
        actOnNoDomain: false
    });

    // Initial subscription check
    useEffect(() => {
        checkSubscription(accounts);
    }, [checkSubscription, accounts]);

    // Handle sub navigation visibility
    useEffect(() => {
        if (RouteConfig.routesWithSubNav.includes(location.pathname)) {
            setState(prev => ({ ...prev, showSubNav: true }));
        } else {
            setState(prev => ({ ...prev, showSubNav: false }));
        }
    }, [location.pathname]);

    // Handle subscription and domain checks
    useEffect(() => {
        if (!accounts?.isFetching && accounts?.data) {
            // Check subscription
            if (accounts.data.stripe_token && !accounts.subscriptionValid) {
                setState(prev => ({ ...prev, actOnInvalidSubscription: true }));
            }

            // Check domains
            const hasActiveDomains = accounts.data.domains?.some(
                item => !item.is_deleted
            );
            setState(prev => ({ ...prev, actOnNoDomain: !hasActiveDomains }));
        }
    }, [accounts]);

    // Check subscription on route change
    useEffect(() => {
        checkSubscription(accounts);
    }, [location.pathname, checkSubscription, accounts]);

    const getSubMenuOptions = () => {
        const pathMap = {
            '/customizations': subMenu.customizationMenu,
            '/integrations': subMenu.integrationsMenu,
            'domain': subMenu.dashboardMenu,
            'account': subMenu.accountMenu
        };

        const matchedPath = Object.keys(pathMap).find(path =>
            location.pathname.includes(path)
        );
        return matchedPath ? pathMap[matchedPath] : [];
    };

    const getGroupName = () => {
        const groupMap = {
            '/customizations': 'Customizations',
            '/integrations': 'Set Up Your Website',
            'domain': 'Website Menu',
            'account': 'Your Account'
        };

        const matchedPath = Object.keys(groupMap).find(path =>
            location.pathname.includes(path)
        );
        return matchedPath ? groupMap[matchedPath] : '';
    };

    const handleSetDomain = (domain) => {
        setDomainAction(domain);
        checkSubscription(accounts);
    };

    const renderRoutes = () => {
        return RouteConfig.routes.map(route => {
            // Xử lý trường hợp isDefaultLayout
            if (route.isDefaultLayout) {
                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <Routes>
                                {renderChildRoutes()}
                            </Routes>
                        }
                    />
                );
            }

            return renderRoute(route);
        });
    };

    const renderChildRoutes = () => {
        // Render các routes con, bỏ qua route có isDefaultLayout
        return RouteConfig.routes
            .filter(route => !route.isDefaultLayout)
            .map(renderRoute);
    };


    const renderRoute = (route) => {
        return RouteConfig.routes.map(route => {
            // No Domain Redirect
            if (
                state.actOnNoDomain &&
                location.pathname === route.path &&
                route.requiresDomain &&
                !location.pathname.includes('/account/billing/subscription')
            ) {
                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <Navigate
                                to="/account/billing/subscription"
                                state={{ forceAddDomain: true }}
                            />
                        }
                    />
                );
            }

            // Invalid Subscription Redirect
            if (
                state.actOnInvalidSubscription &&
                location.pathname === route.path &&
                route.requiresSubscription
            ) {
                const redirectPath = auth.user.role === 'Viewer'
                    ? '/account/settings/edit-profile'
                    : '/account/billing/subscription';
                const redirectState = auth.user.role === 'Viewer'
                    ? undefined
                    : { invalidSubscription: true, showPlansPopup: true };

                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <Navigate to={redirectPath} state={redirectState} />
                        }
                    />
                );
            }

            // Route Redirects
            if (route.redirect) {
                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<Navigate to={route.redirect} />}
                    />
                );
            }

            // User Management Redirect
            if (
                route.path === location.pathname &&
                route.protected &&
                route.path === '/account/settings/user-management' &&
                ['Viewer', 'Manager', 'Client'].includes(auth.user.role)
            ) {
                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<Navigate to="/account/settings/edit-profile" />}
                    />
                );
            }

            // Protected Route Redirect
            if (
                route.path === location.pathname &&
                route.protected &&
                (auth.user.role === 'Viewer' || (route.blockForRoles && route.blockForRoles.includes(auth.user.role)))
            ) {
                return (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<Navigate to="/dashboard" />}
                    />
                );
            }

            // Regular Route
            return route.component ? (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        <AuthedRoute
                            auth={auth}
                            activeDomain={activeDomain}
                            accounts={accounts}
                            exact={route.exact}
                            name={route.name}
                            component={route.component}
                        />
                    }
                />
            ) : null;
        });
    };

    return (
        <div className={styles.all}>
            <Helmet>
                <title>Fraud Blocker</title>
            </Helmet>

            <Navigation
                setDomain={handleSetDomain}
                location={location}
                navigate={navigate}
            />

            {state.showSubNav && (
                <SubMenu
                    location={location}
                    menu={getSubMenuOptions()}
                    accounts={accounts}
                    hasMetaAccess={true}
                    activeDomain={activeDomain}
                    setDomain={handleSetDomain}
                    userRole={auth.user.role}
                    group={getGroupName()}
                />
            )}

            <Routes>
                {renderRoutes()}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    );
}

DefaultLayout.propTypes = {
    auth: PropTypes.shape({
        user: PropTypes.shape({
            role: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.object,
        isFetching: PropTypes.bool,
        subscriptionValid: PropTypes.bool
    }).isRequired,
    activeDomain: PropTypes.object,
    setDomain: PropTypes.func.isRequired,
    checkSubscription: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    accounts: state.accounts,
    activeDomain: state.activeDomain
});

const mapDispatchToProps = {
    setDomain: ActiveDomain.setDomainActive,
    checkSubscription: Account.checkSubscription
};

export default connect(mapStateToProps, mapDispatchToProps)(DefaultLayout);