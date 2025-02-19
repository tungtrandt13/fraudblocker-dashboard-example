import React, { PureComponent } from 'react';
import styles from './Loading.module.scss';

class ReportLoading extends PureComponent {
    render() {
        return (
            <div className={`${styles.container} ${styles.reportLoader}`}>
                <div className={styles.sidebar} />
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.title} />
                        <div className={styles.filter} />
                    </div>
                    
                    <div className={styles.tableStats}>
                        <div className={styles.numbers}>
                            <div className={styles.results} />
                            <div className={styles.downloads} />
                        </div>
                        <div className={styles.table} />
                        <div className={styles.footer} />
                    </div>
                </div>
            </div>
        );
    }
}

export default ReportLoading;