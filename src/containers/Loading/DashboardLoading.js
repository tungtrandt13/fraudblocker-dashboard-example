import React, {
    PureComponent
} from 'react';
import styles from './Loading.module.scss';

class DashboardLoading extends PureComponent {
    render() {
        return ( <
            div className = {
                `${styles.container} ${styles.dashboardLoader}`
            } >
            <
            div className = {
                styles.sidebar
            }
            /> <
            div className = {
                styles.content
            } >
            <
            div className = {
                styles.header
            } >
            <
            div className = {
                styles.title
            }
            /> <
            div className = {
                styles.filter
            }
            /> <
            /div> <
            div className = {
                styles.stats
            } >
            <
            div className = {
                styles.stats1
            }
            /> <
            div className = {
                styles.stats2
            }
            /> <
            div className = {
                styles.stats3
            }
            /> <
            /div> <
            div className = {
                styles.chart
            }
            /> <
            div className = {
                styles.bottomStats
            }
            /> <
            /div> <
            /div>
        );
    }
}

export default DashboardLoading;