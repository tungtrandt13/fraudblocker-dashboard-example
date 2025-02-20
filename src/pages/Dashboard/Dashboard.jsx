import React, {
    useEffect
} from 'react';
import AnalyticsDashboard from '../../containers/Dashboard/Dashboard';

const Dashboard = () => {
    useEffect(() => {
        document.getElementById('favicon').href = 'favicon.ico';
    }, []); // Empty dependency array ensures this effect runs only once on mount

    return <AnalyticsDashboard />;
};

export default Dashboard;