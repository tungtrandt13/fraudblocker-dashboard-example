import React, { PureComponent } from "react";
import styles from "./Loading.module.scss";

class StatsLoading extends PureComponent {
    render() {
        return (
            <div className={`${styles.container} ${styles.statsLoader}`}>
                <div className={styles.sidebar} />
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.title} />
                        <div className={styles.filter} />
                    </div>

                    <div className={styles.chart}>
                        <div className={styles.graph}>
                            <div className={styles.title} />
                            <div className={styles.rainbow} />
                            <div className={styles.bottom}>
                                <div />
                                <div />
                                <div />
                            </div>
                        </div>

                        <div className={styles.border} />

                        <div className={styles.progress}>
                            <div className={styles.title} />
                            <div className={styles.bars}>
                                <div />
                                <div />
                                <div />
                                <div />
                                <div />
                            </div>
                            <div className={styles.vpn}>
                                <div className={styles.enable} />
                                <div className={styles.settings} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableStats}>
                        <div className={styles.numbers}>
                            <div className={styles.title} />
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

export default StatsLoading;
