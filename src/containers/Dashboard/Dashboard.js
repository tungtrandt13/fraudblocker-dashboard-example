import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tooltip';
import moment from 'moment';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ActiveDomain from '../../redux/actions/ActiveDomain';
import AdSelector from '../../components/AdSelector/AdSelector';
import styles from './Dashboard.module.scss';

import NoteIcon from '../../assets/image.png';
import EMPTY_REPORT from '../../assets/empty2.svg';
import TOOLTIP from '../../assets/tooltip.svg';
import ANALYZING from '../../assets/analyze.svg';
import BlockedIPs from '../../assets/blocked-i-ps.svg';
import TotalSaved from '../../assets/total-saved.svg';
import FraudScore from '../../assets/fraud-score.svg';
import OrganicVisitors from '../../assets/eye-view.svg';
import VisitorsAdvertising from '../../assets/visitors-ads.svg';
import FraudDetectionRate from '../../assets/fraud-detection.svg';
import AdsClickRate from '../../assets/ads-click.svg';
import Data from '../../api/Data';
import Constants from '../../utils/Constants';
import Utils from '../../utils/Utils';
import Chart from '../../components/Chart/Chart';
import Input from '../../components/Input/Input';
import DatesSelector from '../DatesSelector/DatesSelector';

// Constants
const { roundAmount } = Constants;

const customStyles = {
    totalSavedFeatured: { marginRight: 30, marginLeft: 30 },
    frontSubFeatured: { marginRight: 15 },
    middleSubFeatured: { marginRight: 15, marginLeft: 15 },
    endSubFeatured: { marginLeft: 15 },
    cpcContainer: {
        display: 'inline-block',
        width: '85px',
        padding: '12px 0 20px',
        position: 'static'
    },
    cpcInput: {
        width: '50px',
        borderRadius: '0px',
        padding: '2px 6px'
    },
    cpcLabel: {
        fontSize: '14px',
        color: '#4a4a4a'
    },
    cpcError: {
        position: 'absolute',
        bottom: '28px'
    }
};

const DEFAULT_SUMMARY = {
    clicks: 0,
    avgRiskFromAds: 0,
    avgRiskOrganic: 0,
    avgRiskTotal: 0,
    visitorsFromAds: 0,
    organicVisitors: 0,
    blockedClicks: 0,
    percentBlocked: 0,
    visitors: 0,
    blockedIPsFromAds: 0,
    blockedIPsOrganic: 0,
    blockedIPs: 0,
    invalidTrafficRate: 0
};

const Dashboard = ({ auth, accounts, activeDomain, updateDomain }) => {
    const activeDomainData = useSelector(state => state.activeDomain?.data);
    const authData = useSelector(state => state.auth);

    const [state, setState] = useState({
        blockedIPs: { total: 1253, image: BlockedIPs },
        totalSaved: { total: 950, image: TotalSaved },
        fraudScore: { total: 4.6, image: FraudScore },
        fetchingOrganic: true,
        fetchingSummary: true,
        fetchingChart: true,
        adType: 'gclid',
        startDate: null,
        endDate: null,
        errors: {},
        chartErrors: {},
        organicStats: {},
        summary: DEFAULT_SUMMARY,
        chart: [],
        cpc: 2,
        editing: false
    });

    const {
        blockedIPs,
        totalSaved,
        fraudScore,
        summary,
        chart,
        editing,
        cpc,
        fetchingChart,
        fetchingOrganic,
        fetchingSummary,
        organicStats,
        adType
    } = state;

    useEffect(() => {
        fetchData({
            startDate: localStorage.getItem('start_date') ||
                moment().subtract(3, 'days').format('YYYYMMDD'),
            endDate: localStorage.getItem('end_date') ||
                moment().format('YYYYMMDD')
        });

        const conversionRates = accounts?.conversionRates || [];
        setState(prev => ({
            ...prev,
            cpc: roundAmount(
                Utils.convertToCurrencyNumeric(
                    conversionRates,
                    activeDomainData?.cpc || 2,
                    authData.user.currency,
                    true
                )
            )
        }));
    }, [activeDomainData, accounts, authData.user.currency]);

    const prepareChartData = useCallback((data) => {
        const chartData = data.map(item => ({
            name: moment(item.date.value, 'YYYY-MM-DD').format('MMM DD'),
            uv: item.visitorsFromAds || 0,
            pv: item.blockedIPsFromAds || 0
        }));

        setState(prev => ({
            ...prev,
            chart: chartData,
            chartErrors: {}
        }));
    }, []);

    const fetchData = useCallback(async (body) => {
        try {
            // if (!activeDomainData?.id) return;

            const { timezone } = authData.user;
            setState(prev => ({
                ...prev,
                startDate: body.startDate || prev.startDate,
                endDate: body.endDate || prev.endDate,
                adType: body.adType || prev.adType,
                fetchingOrganic: true,
                fetchingSummary: true,
                fetchingChart: true,
            }));

            const query = {
                startDate: moment(body.startDate || state.startDate, 'YYYYMMDD')
                    .format('YYYY-MM-DD'),
                endDate: moment(body.endDate || state.endDate, 'YYYYMMDD')
                    .format('YYYY-MM-DD'),
                sid: activeDomainData.id,
                isAggressive: activeDomainData.aggressive_blocking,
                timezone: Utils.sanitizeTimezoneString(
                    timezone || '(GMT-07:00) America/Los_Angeles'
                ),
                adType: (body.adType || state.adType) === 'all'
                    ? undefined
                    : body.adType || state.adType,
            };

            await Promise.all([
                fetchOrganicStats(query),
                fetchDashboardSummary(query),
                fetchChartData(query)
            ]);
        } catch (error) {
            console.error(error);
            setState(prev => ({ ...prev, errors: error }));
        }
    }, [activeDomainData, authData.user, state.startDate, state.endDate, state.adType]);

    const fetchOrganicStats = async (query) => {
        try {
            const result = await Data.getOrganicStats(query);
            setState(prev => ({
                ...prev,
                organicStats: result && !result.errno && result.length
                    ? result[0]
                    : {},
                fetchingOrganic: false
            }));
        } catch (error) {
            console.error("Error fetching organic stats:", error);
            setState(prev => ({
                ...prev,
                errors: error,
                fetchingOrganic: false
            }));
        }
    };

    const fetchDashboardSummary = async (query) => {
        try {
            const result = await Data.getDashboardSummary(query);
            if (result && !result.errno && result.length) {
                setState(prev => ({
                    ...prev,
                    summary: result[0],
                    errors: {}
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    summary: DEFAULT_SUMMARY,
                    errors: {}
                }));
            }
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            setState(prev => ({
                ...prev,
                errors: error
            }));
        } finally {
            setState(prev => ({
                ...prev,
                fetchingSummary: false
            }));
        }
    };

    const fetchChartData = async (query) => {
        try {
            const result = await Data.getDashboardChart(query);
            console.log('CHART', result);
            if (result && !result.errno && result.length) {
                prepareChartData(result);
            } else {
                setState(prev => ({
                    ...prev,
                    chart: [],
                    chartErrors: {}
                }));
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
            setState(prev => ({
                ...prev,
                chartErrors: error
            }));
        } finally {
            setState(prev => ({
                ...prev,
                fetchingChart: false
            }));
        }
    };

    const isValidCPC = useCallback((value) => {
        return (value || value === 0 || value === '0') && !Number.isNaN(value);
    }, []);

    const handleCPC = useCallback((evt) => {
        setState(prev => ({ ...prev, cpc: evt.target.value }));
    }, []);

    const enableEdit = useCallback(async () => {
        if (!editing) {
            setState(prev => ({ ...prev, editing: true }));
            return;
        }

        if (isValidCPC(cpc)) {
            const conversionRates = accounts?.conversionRates || [];
            await updateDomain(activeDomainData.id, {
                id: activeDomainData.id,
                cpc: parseFloat(
                    Utils.convertToUSD(conversionRates, cpc, authData.user.currency, true)
                )
            });
            setState(prev => ({ ...prev, editing: false }));
        }
    }, [editing, cpc, accounts, authData.user.currency, activeDomainData, updateDomain]);

    const currency = useMemo(() =>
        authData.user?.currency || 'USD',
        [authData.user]
    );

    const conversionRates = useMemo(() =>
        accounts?.conversionRates || [],
        [accounts]
    );

    const connected = useMemo(() =>
        activeDomainData?.google_ads_token,
        [activeDomainData]
    );

    const LoadingStats = () => (
        <div className={styles.statsLoading}>
            <div className={styles.stats1} />
            <div className={styles.stats2} />
            <div className={styles.stats3} />
        </div>
    );

    const TooltipContent = ({ id, children }) => (
        <Tooltip
            id={id}
            className={styles.tooltipContent}
            delayHide={500}
            delayUpdate={500}
            effect="solid"
            multiline={true}
        >
            {children}
        </Tooltip>
    );

    const FeaturedCard = ({ icon, title, value, subtext, link, tooltipId, tooltipContent }) => (
        <div className={styles.featured}>
            <div className={styles.featuredInner}>
                <div className={styles.featureIcon}>
                    <img src={icon} alt={title} className={styles.smallFeatureIcon} />
                </div>
                <div className={styles.featuredDescriptions}>
                    <p className={styles.featuredTitle}>
                        {title}
                        {tooltipId && (
                            <a data-tooltip-id={tooltipId}>
                                <img className={styles.tooltip} src={TOOLTIP} alt="info" />
                            </a>
                        )}
                    </p>
                    <p className={styles.featuredTotal}>{value}</p>
                    <p>{subtext}</p>
                    {link && (
                        <p>
                            <Link className={styles.link} to={link.to}>
                                {link.text}
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    const ChartSection = ({
        chart,
        connected,
        summary,
        adType
    }) => (
        <div className={styles.chartContainer}>
            <div className={styles.legendContainer}>
                <div className={styles.legend}>
                    <div className={styles.blockedIPsMask} />
                    <p className={styles.legendText}>Invalid Clicks</p>
                </div>
                <div className={styles.legend}>
                    <div className={styles.visitorsFromAdsMask} />
                    <p className={styles.legendText}>Visits From Ads</p>
                </div>
            </div>

            {chart && chart.length && chart.some(item => item.uv || item.pv) ? (
                <Chart data={chart} />
            ) : !summary.clicks && connected ? (
                <div className={styles.emptyState}>
                    <img src={ANALYZING} alt="analyzing" />
                    <div className={styles.emptyStateText}>
                        {adType === 'msclkid'
                            ? "We do not currently detect any visitors to your website from Microsoft Ads."
                            : "Your Google Ads account is connected and we are analyzing your data.\nCome back soon."
                        }
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <img src={EMPTY_REPORT} alt="no data" />
                    <div className={styles.emptyStateText}>
                        No traffic from advertising detected.
                        <br />
                        <Link to="/integrations">
                            Verify your Fraud Tracker installation.
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.wrapper}>
            <Tooltip 
                id="blockedIps" 
                className={styles.tooltipContent}
            >
                <div>
                    This represents the clicks from your advertising campaigns that were 
                    determined to be invalid, or fraudulent, based on our scoring criteria.
                </div>
            </Tooltip>
    
            <Tooltip 
                effect="solid"
                delayHide={500}
                delayUpdate={500}
                id="totalSaved"
                multiline={true}
                className={styles.tooltipContent}
            >
                <div>
                    This is your estimated savings during the period you selected based on the percent of
                    invalid, or fraudulent, traffic we detected.
                    <a 
                        href="https://help.fraudblocker.com/en/articles/10055556-how-is-savings-calculated"
                        rel="noopener noreferrer" 
                        target="_blank"
                    >
                        Learn more.
                    </a>
                </div>
            </Tooltip>
    
            {/* {!accounts.subscriptionValid && <div className={styles.overlay} />} */}
            
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Dashboard</h1>
                </div>
    
                <div className={styles.topFiltersWrap}>
                    <AdSelector 
                        showAll={false}
                        handleAdChange={fetchData}
                    />
                    <DatesSelector 
                        handleDateChange={fetchData}
                    />
                </div>
    
                {adType === 'msclkid' && (
                    <div className={styles.info}>
                        <div>
                            <img src={NoteIcon} alt="alert" />
                            IPs cannot be blocked automatically for Microsoft Ads.{' '}
                            <a 
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://help.fraudblocker.com/en/articles/8224653-can-i-protect-my-microsoft-ads-campaigns"
                            >
                                Learn More
                            </a>
                            .
                        </div>
                    </div>
                )}
    
                {!fetchingSummary ? (
                    <div className={styles.featuredContainer}>
                        <div className={styles.featured}>
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img 
                                        className={styles.smallFeatureIcon}
                                        src={blockedIPs.image}
                                    />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}>
                                        Invalid Clicks{' '}
                                        <a data-tip data-for="blockedIps">
                                            <img 
                                                className={styles.tooltip}
                                                src={TOOLTIP}
                                            />
                                        </a>
                                    </p>
                                    <p className={styles.featuredTotal}>
                                        {(summary.blockedClicks || 0).toLocaleString('en-US', {
                                            maximumFractionDigits: 1
                                        })}
                                    </p>
                                    <p>{summary.percentBlocked || 0}% of ad visitors</p>
                                    <p>
                                        <Link className={styles.link} to="/stats">
                                            View Score Details
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
    
                        <div 
                            style={customStyles.totalSavedFeatured}
                            className={styles.featured}
                        >
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img src={totalSaved.image} />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}>
                                        {editing ? 'Edit CPC Cost' : 'Estimated Savings'}
                                        {!editing && (
                                            <a data-tip data-for="totalSaved">
                                                <img 
                                                    className={styles.tooltip}
                                                    src={TOOLTIP}
                                                />
                                            </a>
                                        )}
                                    </p>
                                    
                                    {!editing && (
                                        <p className={styles.featuredTotal}>
                                            {Utils.convertToCurrency(
                                                conversionRates,
                                                Math.round(Utils.calculateSavedAmount(
                                                    summary.clicks, 
                                                    summary.percentBlocked, 
                                                    (activeDomainData.cpc || 2)
                                                )),
                                                currency
                                            )}
                                        </p>
                                    )}
                                    
                                    {!editing && (
                                        <p>
                                            Based on{' '}
                                            {Utils.convertToCurrency(
                                                conversionRates,
                                                activeDomainData.cpc || 2,
                                                currency,
                                                true,
                                                true
                                            )}{' '}
                                            CPC avg.
                                        </p>
                                    )}
                                    
                                    {editing && (
                                        <>
                                            <Input 
                                                style={customStyles.cpcInput}
                                                containerStyle={customStyles.cpcContainer}
                                                name="cpc"
                                                onChange={handleCPC}
                                                value={cpc}
                                                error={!isValidCPC(cpc) ? 'Enter a numeric value' : ''}
                                                errorStyle={customStyles.cpcError}
                                            />
                                            <span style={customStyles.cpcLabel}>CPC Cost</span>
                                        </>
                                    )}
                                    
                                    <div className={styles.cpcCurrencyWrap}>
                                        <p 
                                            className={styles.link}
                                            onClick={enableEdit}
                                        >
                                            {editing ? 'Save CPC value' : 'Edit CPC value'}
                                        </p>
                                        <p className={styles.link}>
                                            <Link to="/account/settings/edit-profile">
                                                Change currency
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div className={styles.featured}>
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img src={fraudScore.image} />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}>Fraud Score</p>
                                    <p className={styles.featuredTotal}>
                                        {Utils.calcFraudScore(summary.percentBlocked, 1)}
                                    </p>
                                    <p>Out of 10</p>
                                    <p>
                                        <Link className={styles.link} to="/stats">
                                            View score details
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.featuredContainer}>
                        <div className={styles.statsLoading}>
                            <div className={styles.stats1} />
                            <div className={styles.stats2} />
                            <div className={styles.stats3} />
                        </div>
                    </div>
                )}
    
                {!fetchingChart ? (
                    <ChartSection
                        chart={chart}
                        connected={connected} 
                        summary={summary}
                        adType={adType}
                    />
                ) : (
                    <div className={styles.chartLoading} />
                )}
    
                {!fetchingOrganic && !fetchingSummary ? (
                    <div className={styles.featuredContainer}>
                        <div 
                            style={customStyles.frontSubFeatured}
                            className={styles.subFeatured}
                        >
                            <img src={OrganicVisitors} />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {(organicStats.allViews || 0).toLocaleString('en-US', {
                                        maximumFractionDigits: 1
                                    })}
                                </p>
                                <p>Total Visitors</p>
                            </div>
                        </div>
    
                        <div className={styles.divider} />
    
                        <div 
                            style={customStyles.middleSubFeatured}
                            className={styles.subFeatured}
                        >
                            <img src={VisitorsAdvertising} />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {(summary.clicks || 0).toLocaleString('en-US', {
                                        maximumFractionDigits: 1
                                    })}
                                </p>
                                <p>Visits From Ads</p>
                            </div>
                        </div>
    
                        <div className={styles.divider} />
    
                        <div 
                            style={customStyles.middleSubFeatured}
                            className={styles.subFeatured}
                        >
                            <img src={FraudDetectionRate} />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {organicStats.allViews
                                        ? roundAmount((summary.clicks * 100) / organicStats.allViews, 1)
                                        : 0}%
                                </p>
                                <p>Visits From Ads</p>
                            </div>
                        </div>
    
                        <div className={styles.divider} />
    
                        <div 
                            style={customStyles.endSubFeatured}
                            className={styles.subFeatured}
                        >
                            <img src={AdsClickRate} />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {summary.percentBlocked
                                        ? summary.percentBlocked.toLocaleString('en-US', {
                                            maximumFractionDigits: 1
                                        })
                                        : 0}%
                                </p>
                                <p>Invalid Traffic(Estimated)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.featuredContainer}>
                        <div className={styles.bottomStatsLoading} />
                    </div>
                )}
            </div>
        </div>
    );
}

Dashboard.propTypes = {
    accounts: PropTypes.shape({
        conversionRates: PropTypes.array,
        subscriptionValid: PropTypes.bool,
        data: PropTypes.object,
    }),
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string.isRequired,
            google_ads_token: PropTypes.string,
            cpc: PropTypes.number,
            aggressive_blocking: PropTypes.bool,
        }),
    }),
    auth: PropTypes.shape({
        user: PropTypes.shape({
            currency: PropTypes.string,
            timezone: PropTypes.string,
        }).isRequired,
    }).isRequired,
    updateDomain: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    accounts: state.accounts,
    activeDomain: state.activeDomain,
    auth: state.auth
});

const mapDispatchToProps = {
    updateDomain: ActiveDomain.updateDomain
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);