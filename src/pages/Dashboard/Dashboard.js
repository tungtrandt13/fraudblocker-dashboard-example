import React, { useEffect } from 'react';
import AnalyticsDashboard from '../../containers/Dashboard/Dashboard';
import PropTypes from 'prop-types';

const Dashboard = (props) => {
    console.log('Dashboard Props:', props);

    useEffect(() => {
        const favicon = document.getElementById('favicon');
        if (favicon) {
            favicon.href = 'favicon.ico';
        }
    }, []);

    return <AnalyticsDashboard />;
};

Dashboard.propTypes = {
    auth: PropTypes.object,
    activeDomain: PropTypes.object,
    accounts: PropTypes.object
};

export default React.memo(Dashboard);