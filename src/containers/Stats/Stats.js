import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tooltip';
// import { JsonToCsv } from 'react-json-csv';
import styles from './Stats.module.scss';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import StatsTable, {
    getPrimaryFraudType,
    getStatus
} from '../ResultTable/StatsTableNew';
import {
    connect
} from 'react-redux';
import AdSelector from '../../components/AdSelector/AdSelector';
import Data from '../../api/Data';
import DatesSelector from '../DatesSelector/DatesSelector';
import GoogleAds from '../../api/GoogleAds';
import IPBlockList from '../../redux/actions/IpBlockList';
import TOOLTIP from '../../assets/tooltip.svg';
import SYNC from '../../assets/sync.svg';
import ALERT from '../../assets/alert.png';
// import { ReactComponent as DownloadIcon } from '../../assets/download.svg';
import Utils from '../../utils/Utils';
import NoteIcon from '../../assets/note-icon.png';

const Stats = ({ auth, accounts, ipBlocklist, ipWhitelist, activeDomain, fetchLatestBlocklist }) => {
    const navigate = useNavigate();

    const [fraudTypes, setFraudTypes] = useState([
        {
            title: 'Excessive Clicks',
            key: 'excessiveClickerClicks'
        },
        {
            title: 'VPN / Datacenter / Tor',
            key: 'botDatacenterClicks'
        },
        {
            title: 'Blacklist / Abuse / Poor IP History',
            key: 'abuseHighRiskClicks'
        },
        {
            title: 'Risky Geo',
            key: 'riskyGeoClicks'
        },
        {
            title: 'Accidental Clicks',
            key: 'accidentalClickerClicks'
        },
        {
            title: 'Risky Device',
            key: 'riskyDeviceClicks'
        }
    ]);
    const [records, setRecords] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [adType, setAdType] = useState('gclid');
    const [allBlockedIPAddresses, setAllBlockedIPAddresses] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);
    const [fetchingStats, setFetchingStats] = useState(true);
    const [errors, setErrors] = useState({});
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [statsError, setStatsError] = useState({});
    const [stats, setStats] = useState({});
    const [riskScore, setRiskScore] = useState(0);
    const [csv, setCsv] = useState({
        fields: {
            ip: 'IP Address',
            status: 'Status',
            riskScore: 'Fraud Score',
            primaryFraudType: 'Primary Fraud Type',
            lastSeen: 'Last Seen'
        },
        data: []
    });

    const dispatch = useDispatch();

    useEffect(() => {
        fetchData({ adType: 'gclid' });
    }, []);  // Empty dependency array means this runs once on mount

    const fetchData = async body => {
        try {
            if (!activeDomain?.data?.id) return;
            
            const { timezone } = auth.user;
            setStartDate(body.startDate || startDate);
            setEndDate(body.endDate || endDate);
            setAdType(body.adType || adType);
            const query = {
                startDate: moment(body.startDate || startDate, 'YYYYMMDD').format('YYYY-MM-DD'),
                endDate: moment(body.endDate || endDate, 'YYYYMMDD').format('YYYY-MM-DD'),
                sid: activeDomain.data.id,
                isAggressive: activeDomain.data.aggressive_blocking,
                timezone: Utils.sanitizeTimezoneString(timezone || '(GMT-07:00) America/Los_Angeles'),
                adType:
                    (body.adType || adType) === 'all' ?
                        undefined :
                        body.adType || adType
            };
            fetchStats(query);
            setFetchingData(true);
            const result = await Data.getAdReports(query);
            if (result && !result.errno) {
                if (result.length) {
                    for (let i = 0; i < result.length; i += 1) {
                        result[i].index = i;
                    }
                }
                const parsedResults = Utils.formatTimeAndAddRowIdInReports(
                    result,
                    timezone || '(GMT-07:00) America/Los_Angeles'
                );
                setRecords(parsedResults);
                setCsvData(parsedResults);
            } else {
                setRecords([]);
                setCsvData([]);
            }
            setFetchingData(false);
        } catch (error) {
            console.log(error);
            setErrors(error);
            setFetchingData(false);
        }
    };

    const fetchBlockedIPs = useCallback(async () => {
        if (!activeDomain?.data?.id) return;
        try {
            await fetchLatestBlocklist(activeDomain.data.id);
        } catch (error) {
            console.log(error);
        }
    }, [activeDomain, fetchLatestBlocklist]);

    const fetchStats = async query => {
        try {
            setFetchingStats(true);
            setStatsError({});
            const result = await Data.getStats(query);
            if (result && !result.errno && result.length) {
                setStats(result[0]);
                const riskScore = Utils.calcFraudScore((result[0].fraudClicks * 100) / result[0].clicks, 1);
                setRiskScore(riskScore);
            } else {
                setStats({});
                setRiskScore(0);
            }

            setFetchingStats(false, () => {
                const stats = document.querySelectorAll('.roll-in');
                stats.forEach(stat => {
                    // pattern used to seperate input number from html into an array of numbers and non numbers. EX $65.3M -> ["$65.3M", "$", "65", ".", "3", "M"]
                    const patt = /(\D+)?(\d+)(\D+)?(\d+)?(\D+)?/;
                    const time = 1000;
                    let result1 = [...patt.exec(stat.textContent)];
                    let fresh = true;

                    // Remove first full match from result array (we dont need the full match, just the individual match groups).
                    result1.shift();
                    // Remove undefined values from result array where they didnt have a match in one of the optional regex groups
                    result1 = result1.filter(res => res != null);

                    while (stat.firstChild) {
                        stat.removeChild(stat.firstChild);
                    }

                    // eslint-disable-next-line no-restricted-syntax
                    for (const res of result1) {
                        if (Number.isNaN(parseInt(res, 10))) {
                            stat.insertAdjacentHTML('beforeend', `<span>${res}</span>`);
                        } else {
                            for (let i = 0; i < res.length; i += 1) {
                                stat.insertAdjacentHTML(
                                    'beforeend',
                                    `<span data-value="${res[i]}">
						<span>&ndash;</span>
						${Array(parseInt(res[i], 10) + 1)
                                        .join(0)
                                        .split(0)
                                        .map(
                                            (x, j) => `
							<span>${j}</span>
						`
                                        )
                                        .join('')}
					</span>`
                                );
                            }
                        }
                    }

                    const ticks = [...stat.querySelectorAll('span[data-value]')];
                    const activate = () => {
                        const {
                            top
                        } = stat.getBoundingClientRect();
                        const offset = window.innerHeight * 0.8;

                        setTimeout(() => {
                            fresh = false;
                        }, time);

                        if (top < offset) {
                            setTimeout(
                                () => {
                                    // eslint-disable-next-line no-restricted-syntax
                                    for (const tick of ticks) {
                                        const dist = parseInt(tick.getAttribute('data-value'), 10) + 1;
                                        tick.style.transform = `translateY(-${dist * 100}%)`;
                                    }
                                    const avgRisk = riskScore;
                                    const gauge = document.getElementById('circleInner');
                                    const gaugeValue = avgRisk * 10 * 1.8 - 45;
                                    if (gauge && gauge.style) {
                                        gauge.style.transform = `rotate(${gaugeValue}deg)`;
                                    }
                                },
                                fresh ? time : 0
                            );
                            window.removeEventListener('scroll', activate);
                        }
                    };
                    window.addEventListener('scroll', activate);
                    activate();
                });
            });
        } catch (error) {
            console.log(error);
            setStatsError(error);
            setFetchingStats(false);
        }
    };

    const onStatusChange = useCallback(async (index, currentStatus) => {
        const listedIp = ipBlocklist.find(ip => ip.address.includes(records[index].ip));
        const listedWhite = ipWhitelist.find(ip => ip.address.includes(records[index].ip));

        const autoBlockIp = async (ipAddress, isBlocked = true) => {
            try {
                const data = {
                    account_id: accounts.data.id,
                    address: ipAddress,
                    is_blocked: isBlocked,
                    domain_id: activeDomain.data.id
                };
                await GoogleAds.addIpToBlocklist({ ips: [data] });
                fetchBlockedIPs();
            } catch (error) {
                console.log(error);
            }
        };

        const removeIPFromBlockList = async (ipAddress, isBlocked) => {
            try {
                let selectedIp = isBlocked 
                    ? ipBlocklist.find(ip => ip.address === ipAddress)
                    : ipWhitelist.find(ip => ip.address === ipAddress);
                
                await GoogleAds.removeIpFromBlocklist({ ids: [selectedIp.id] });
                fetchBlockedIPs();
            } catch (error) {
                console.log(error);
            }
        };

        if (currentStatus === 'Auto Blocked') {
            autoBlockIp(records[index].ip, false);
        } else if (currentStatus === 'Unblocked' && !listedWhite) {
            autoBlockIp(records[index].ip, true);
        } else if (currentStatus === 'Unblocked' && listedWhite) {
            await removeIPFromBlockList(records[index].ip, false);
            autoBlockIp(records[index].ip, true);
        } else if (!listedIp) {
            autoBlockIp(records[index].ip, true);
        } else {
            removeIPFromBlockList(records[index].ip, true);
        }
    }, [ipBlocklist, ipWhitelist, records, accounts, activeDomain, fetchBlockedIPs]);

    const downloadResults = () => { };

    const getFraudLevel = avg => {
        if (avg >= 7) {
            return 'high';
        }
        if (avg > 3) {
            return 'medium';
        }
        return 'low';
    };

    const setCSVData = useCallback((data) => {
        const formatted = [];
        const listedIPs = ipBlocklist.concat(ipWhitelist);
        
        for (let i = 0; i < data.length; i += 1) {
            const item = data[i];
            formatted.push({
                ...item,
                lastSeen: item.lastSeen.value,
                primaryFraudType: getPrimaryFraudType(item),
                status: getStatus(
                    listedIPs.find(ip => ip.address.includes(item.ip)),
                    item.riskScore
                )
            });
        }
        
        setCsv({
            ...csv,
            data: formatted
        });
    }, [ipBlocklist, ipWhitelist, csv]);

    return (
        <div className={styles.content}>
            <Tooltip id="latestScore" className={styles.tooltipContent}>
                <div>
                    This score represents the average amount of activity from bots and other invalid activity to your advertising campaigns.
                </div>
            </Tooltip>

            <Tooltip id="ipsFromAds" className={styles.tooltipContent}>
                <div>
                    These IP addresses are only those we detected to your site from advertising campaigns during the period you selected.
                </div>
            </Tooltip>

            <Tooltip id="excessiveClickerClicks" className={styles.tooltipContent}>
                <div>
                    We block users that visit your site repeatedly in a short period of time (such as 5 times within a minute).
                    We avoid blocking "real" users you may be retargeting.
                </div>
            </Tooltip>

            <Tooltip id="accidentalClickerClicks" className={styles.tooltipContent}>
                <div>
                    We block users that click your ad and bounce in less than 2 seconds.
                    Our data indicates these are very often accidental clicks.
                </div>
            </Tooltip>

            <div className={styles.header}>
                <h1 className={styles.title}>Fraud Score</h1>
            </div>

            <div className={styles.topFiltersWrap}>
                <AdSelector
                    showAll={false}
                    handleAdChange={fetchData}
                />
                <DatesSelector handleDateChange={fetchData} />
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
                        </a>.
                    </div>
                </div>
            )}

            {!fetchingStats ? (
                <div className={styles.fraudThreatContainer}>
                    <div className={styles.fraudThreatScoreContainer}>
                        <div>
                            <p className={styles.containerTitle}>
                                Threat Level
                                <Tooltip title="This score represents the average amount of activity from bots and other invalid activity">
                                    <img className={styles.tooltip} src={TOOLTIP} />
                                </Tooltip>
                            </p>
                        </div>

                        <div className={styles.scoreContainer}>
                            <div className={styles.gaugeHolder}>
                                <div className={styles.circleWrap}>
                                    <div className={styles.circle}>
                                        <div
                                            id="circleInner"
                                            className={`${styles.circleInner} ${riskScore <= 4.5
                                                ? styles.circleBlue
                                                : riskScore > 4.5 && riskScore <= 7
                                                    ? styles.circleYellow
                                                    : styles.circleRed
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h1 className={`${styles.scoreText} roll-in`}>
                                {riskScore ? parseFloat(riskScore).toFixed(1) : 0}
                            </h1>
                            <p className={styles.scoreDescription}>
                                Your site received a{' '}
                                <span className={`${riskScore <= 4.5
                                    ? styles.lowLevel
                                    : riskScore > 4.5 && riskScore <= 7
                                        ? styles.medLevel
                                        : styles.highLevel
                                    }`}>
                                    {getFraudLevel(riskScore)}
                                </span>{' '}
                                level of fraud threats
                            </p>
                        </div>

                        <div className={styles.scoreFeatureContainer}>
                            {/* Score Features */}
                            {[
                                { title: 'Clean', clicks: stats.cleanClicks },
                                { title: 'Suspected', clicks: stats.suspectedClicks },
                                { title: 'Invalid', clicks: stats.fraudClicks }
                            ].map(feature => (
                                <div key={feature.title} className={styles.scoreFeature}>
                                    <p className={styles.scoreFeatureTitle}>{feature.title}</p>
                                    <p>
                                        {(feature.clicks || 0).toLocaleString('en-US', {
                                            maximumFractionDigits: 1
                                        })}{' '}
                                        clicks,{' '}
                                        <span className={`${styles.rollWrap} roll-in`}>
                                            {feature.clicks
                                                ? ((feature.clicks * 100) / stats.clicks).toLocaleString('en-US', {
                                                    maximumFractionDigits: 1
                                                })
                                                : 0}%
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.horizontalDivider} />

                    <div className={styles.blockedFraudTypeContainer}>
                        {/* Fraud Type Header */}
                        <div className={styles.containerTitle}>
                            Blocked Fraud Type
                            {activeDomain.data?.last_sync_time && adType !== 'msclkid' && (
                                <div className={styles.lastSyncDate}>
                                    <img src={SYNC} alt="sync" />
                                    <span>Last Sync Time</span>
                                    {moment(activeDomain.data.last_sync_time).format('MMM DD, YYYY')}
                                    at {moment(activeDomain.data.last_sync_time).format('HH:mm')}
                                </div>
                            )}
                            {activeDomain.data && adType === 'msclkid' && (
                                <div className={styles.lastSyncDate}>
                                    <img src={ALERT} alt="info" />
                                    <span>
                                        Microsoft Ads Does Not Sync Automatically.{' '}
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="https://help.fraudblocker.com/en/articles/8224653-can-i-protect-my-microsoft-ads-campaigns"
                                        >
                                            Learn More
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Fraud Types List */}
                        {fraudTypes.map((type, index) => (
                            <div key={index}>
                                <div className={styles.percentageTextContainer}>
                                    <p>
                                        {type.title}
                                        {(type.key === 'excessiveClickerClicks' || type.key === 'accidentalClickerClicks') && (
                                            <Tooltip title={type.tooltipContent}>
                                                <img className={styles.tooltip} src={TOOLTIP} />
                                            </Tooltip>
                                        )}
                                    </p>
                                    <p>
                                        {stats[type.key] || 0} clicks,{' '}
                                        {stats[type.key]
                                            ? ((stats[type.key] * 100) / stats.fraudClicks).toFixed(1)
                                            : 0}%
                                    </p>
                                </div>
                                <ProgressBar
                                    color="#FC584E"
                                    percentage={stats[type.key] ? (stats[type.key] * 100) / stats.fraudClicks : 0}
                                />
                            </div>
                        ))}

                        <div className={styles.vpnContainer}>
                            <span 
                                className={styles.link}
                                onClick={() => navigate('customizations/detection-rules')}
                                style={{ cursor: 'pointer' }}
                            >
                                Customize
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.chartLoading}>
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
            )}

            {fetchingData ? (
                <div className={styles.tableStatsLoading}>
                    <div className={styles.numbers}>
                        <div className={styles.title} />
                        <div className={styles.downloads} />
                    </div>
                    <div className={styles.table} />
                    <div className={styles.footer} />
                </div>
            ) : (
                <div className={styles.detailsContainer}>
                    <div className={styles.detailsContainerHeader}>
                        <p className={`${styles.containerTitle} ${styles.gridTitle}`}>
                            IPs from Advertising
                            <Tooltip title="These IP addresses are only those we detected from your advertising campaigns">
                                <img className={styles.tooltip} src={TOOLTIP} />
                            </Tooltip>
                        </p>
                    </div>

                    <StatsTable
                        loading={fetchingData}
                        results={records}
                        maxHeight={400}
                        ipBlocklist={ipBlocklist.concat(ipWhitelist)}
                        onStatusChange={onStatusChange}
                        accounts={accounts}
                        activeDomain={activeDomain}
                    />
                </div>
            )}
        </div>
    );
};

Stats.propTypes = {
    auth: PropTypes.object,
    accounts: PropTypes.object,
    ipBlocklist: PropTypes.array,
    ipWhitelist: PropTypes.array,
    fetchLatestBlocklist: PropTypes.func,
    activeDomain: PropTypes.object
};

const mapStateToProps = state => ({
    auth: state.auth,
    accounts: state.accounts,
    ipBlocklist: state.ipBlocklist.data,
    activeDomain: state.activeDomain,
    ipWhitelist: state.ipBlocklist.whiteIPs
});

const mapDispatchToProps = dispatch => {
    return {
        fetchLatestBlocklist: accountId => dispatch(IPBlockList.fetchLatestBlocklist(accountId))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Stats);