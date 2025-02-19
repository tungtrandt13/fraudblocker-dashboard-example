import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PropTypes from 'prop-types';

// Components
import Loading from '../containers/Loading/Loading';
import DashboardLoading from '../containers/Loading/DashboardLoading';
import StatsLoading from '../containers/Loading/StatsLoading';
import ReportLoading from '../containers/Loading/ReportLoading';

// Utils
import Validation from '../utils/Validation';

const getLoadingComponent = (pathname) => {
    switch (pathname) {
        case '/dashboard':
            return <DashboardLoading />;
        case '/stats':
            return <StatsLoading />;
        case '/advertising':
            return <ReportLoading />;
        default:
            return <Loading />;
    }
};

const AuthedRoute = ({
    component: Component,
    accounts,
    auth,
    ...rest
}) => {
    const { user, isFetching } = auth;
    const {
        isFetching: accountsFetching,
        fetchingSubscription,
        subscription,
        data: accountsData
    } = accounts;

    // Show loading states
    if (isFetching || accountsFetching || fetchingSubscription) {
        return getLoadingComponent(rest.location.pathname);
    }

    // Redirect to login if no user
    if (!user) {
        return (
            <Navigate 
                to={`/login?destination=${rest.location.pathname}`}
                replace
            />
        );
    }

    // Check user validation
    if (!Validation.userHasAllRequiredFields(user, accountsData, subscription)) {
        return <Navigate to="/register" replace />;
    }

    // Render the protected component
    return (
        <Routes>
            <Route
                {...rest}
                element={<Component />}
            />
        </Routes>
    );
};

AuthedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
    auth: PropTypes.shape({
        user: PropTypes.object,
        isFetching: PropTypes.bool.isRequired
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.object,
        isFetching: PropTypes.bool.isRequired,
        fetchingSubscription: PropTypes.bool.isRequired,
        subscription: PropTypes.object
    }).isRequired
};

export default AuthedRoute;