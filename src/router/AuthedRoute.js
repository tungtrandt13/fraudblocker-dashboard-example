import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// Components
import Loading from "../containers/Loading/Loading";
import DashboardLoading from "../containers/Loading/DashboardLoading";
import StatsLoading from "../containers/Loading/StatsLoading";
import ReportLoading from "../containers/Loading/ReportLoading";

// Utils
import Validation from "../utils/Validation";

const getLoadingComponent = (pathname) => {
    switch (pathname) {
        case "/dashboard":
            return <DashboardLoading />;
        case "/stats":
            return <StatsLoading />;
        case "/advertising":
            return <ReportLoading />;
        default:
            return <Loading />;
    }
};

const AuthedRoute = ({ component: Component, accounts, auth, activeDomain, ...rest }) => {
    const location = useLocation();
    const { user, isFetching } = auth;
    const { isFetching: accountsFetching, fetchingSubscription, subscription, data: accountsData } = accounts;

    // Show loading states
    if (isFetching || accountsFetching || fetchingSubscription) {
        return getLoadingComponent(location.pathname);
    }

    // Redirect to login if no user
    if (!user) {
        return <Navigate to={`/login?destination=${location.pathname}`} replace />;
    }

    // Check user validation
    if (!Validation.userHasAllRequiredFields(user, accountsData, subscription)) {
        return <Navigate to="/register" replace />;
    }

    // Check domain if required (nếu route cần domain, thêm vào RouteConfig)
    if (rest.requiresDomain && !activeDomain?.id) {
        return <Navigate to="/account/billing/subscription" state={{ forceAddDomain: true }} />;
    }

    // Check subscription if required
    if (rest.requiresSubscription && !subscription?.valid) {
        return <Navigate to="/account/billing/subscription" state={{ invalidSubscription: true }} />;
    }

    // Render the protected component
    return <Component {...rest} />;
};

AuthedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
    auth: PropTypes.shape({
        user: PropTypes.object,
        isFetching: PropTypes.bool.isRequired,
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.object,
        isFetching: PropTypes.bool.isRequired,
        fetchingSubscription: PropTypes.bool.isRequired,
        subscription: PropTypes.object,
    }).isRequired,
    activeDomain: PropTypes.shape({
        id: PropTypes.string,
    }),
    requiresDomain: PropTypes.bool,
    requiresSubscription: PropTypes.bool,
};

export default AuthedRoute;
