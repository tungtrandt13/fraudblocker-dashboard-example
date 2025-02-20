import React from 'react';
import PropTypes from 'prop-types';
import Popover from '@mui/material/Popover';
import Constants from '../../utils/Constants';
import styles from './IpPopup.module.scss';
import ABOUT_DATA_ICON from '../../assets/aboutdata.svg';

const { countryNameMapping } = Constants;

const FRAUD_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    CLEAN: 'clean'
};

const getFraudLevel = (avg) => {
    if (avg >= 7) return FRAUD_LEVELS.HIGH;
    if (avg > 3) return FRAUD_LEVELS.MEDIUM;
    if (avg > 0) return FRAUD_LEVELS.LOW;
    return FRAUD_LEVELS.CLEAN;
};

const RiskStatistic = ({ label, riskPoints }) => (
    <div>
        <article className={styles.label}>{label}</article>
        <article className={`${styles.value} ${styles[getFraudLevel(riskPoints)]}`}>
            {getFraudLevel(riskPoints)}
        </article>
    </div>
);

RiskStatistic.propTypes = {
    label: PropTypes.string.isRequired,
    riskPoints: PropTypes.number.isRequired
};

const IpPopup = ({ details, targetElem, handlePopoverClose, isOpen }) => {
    const riskContributors = details?.riskContributors ? JSON.parse(details.riskContributors) : null;

    const handleMouseLeave = () => {
        setTimeout(() => handlePopoverClose(), 100);
    };

    if (!details) return null;

    return (
        <Popover
            id="ip-popup"
            className={styles.ipPopover}
            open={isOpen}
            anchorEl={targetElem}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
        >
            <div className={styles.ipPopupContainer} onMouseLeave={handleMouseLeave}>
                <div className={styles.ipPopupContent}>
                    <table cellSpacing={0}>
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>Location</th>
                                <th>Fraud Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={styles.boldValue}>{details.ip}</td>
                                <td>
                                    {details.country && (
                                        <>
                                            <img
                                                className={styles.flagIcon}
                                                src={`flags/${details.country.toLowerCase()}.svg`}
                                                alt={details.country}
                                            />
                                            {countryNameMapping[details.country] || details.country}
                                        </>
                                    )}
                                </td>
                                <td className={styles.boldValue}>
                                    {details.riskScore.toFixed(1)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {riskContributors && (
                        <div className={styles.stats}>
                            <div className={styles.leftStats}>
                                <RiskStatistic 
                                    label="VPN / Datacenter" 
                                    riskPoints={riskContributors.dcRiskPoints}
                                />
                                <RiskStatistic 
                                    label="Risky Device" 
                                    riskPoints={riskContributors.deviceRiskPoints}
                                />
                                <RiskStatistic 
                                    label="Excessive Clicks" 
                                    riskPoints={riskContributors.fastClickersRiskPoints}
                                />
                                <RiskStatistic 
                                    label="Poor IP History" 
                                    riskPoints={riskContributors.historicalClicksRiskPoints}
                                />
                            </div>
                            <div className={styles.rightStats}>
                                <RiskStatistic 
                                    label="Accidental Clicks" 
                                    riskPoints={riskContributors.accidentalClicksRiskPoints}
                                />
                                <RiskStatistic 
                                    label="Abuse / Very High Risk" 
                                    riskPoints={riskContributors.headlessBrowserRiskPoints}
                                />
                                <RiskStatistic 
                                    label="Risky Geo" 
                                    riskPoints={riskContributors.geoRiskPoints}
                                />
                                <div>
                                    <article className={styles.label}>Other Risk</article>
                                    <article className={`${styles.value} ${styles.clean}`}>
                                        clean
                                    </article>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.aboutLink}>
                        <a
                            href="https://help.fraudblocker.com/en/articles/8127810-what-is-the-ip-clarity-data"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img src={ABOUT_DATA_ICON} alt="about" />
                            About This Data
                        </a>
                    </div>
                </div>
            </div>
        </Popover>
    );
};

IpPopup.propTypes = {
    details: PropTypes.shape({
        ip: PropTypes.string,
        country: PropTypes.string,
        riskScore: PropTypes.number,
        riskContributors: PropTypes.string
    }),
    targetElem: PropTypes.any,
    isOpen: PropTypes.bool,
    handlePopoverClose: PropTypes.func.isRequired
};

export default IpPopup;