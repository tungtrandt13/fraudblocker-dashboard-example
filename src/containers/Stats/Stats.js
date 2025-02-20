import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { styled } from "@mui/material/styles";
import { Box, LinearProgress, Link, Typography } from "@mui/material";
import ReactTooltip from "react-tooltip";
import styles from "./Overview.module.scss"; // Assuming you want to reuse Overview styles
import DatesSelector from "../../containers/DatesSelector/DatesSelector";
import AdSelector from "../../components/AdSelector/AdSelector";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Data from "../../api/Data";
import Utils from "../../utils/Utils";
import StatsTable, { getPrimaryFraudType, getStatus } from "../ResultTable/StatsTableNew"; // Corrected path
import IPBlockList from "../../redux/actions/IpBlockList";

import NotConnect from "../../assets/nt-connect.svg";
import NoteIcon from "../../assets/note-icon.png";
import TOOLTIP from "../../assets/tooltip.svg";
import SYNC from "../../assets/sync.svg";
import ALERT from "../../assets/alert.png";

const SuccessLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.MuiLinearProgress-colorPrimary`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .MuiLinearProgress-bar`]: {
        borderRadius: 7,
        backgroundColor: "#10CD24",
    },
}));

const WarningLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.MuiLinearProgress-colorPrimary`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .MuiLinearProgress-bar`]: {
        borderRadius: 7,
        backgroundColor: "#F99400CC",
    },
}));

const DangerLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.MuiLinearProgress-colorPrimary`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .MuiLinearProgress-bar`]: {
        borderRadius: 7,
        backgroundColor: "#FC584ECC",
    },
}));

const fraudTypes = [
    {
        title: "Excessive Clicks",
        key: "excessiveClickerClicks",
        color: "#FF8585",
    },
    {
        title: "VPN / Datacenter",
        key: "botDatacenterClicks",
        color: "#CC0025",
    },
    {
        title: "Blacklist / Abuse",
        key: "abuseHighRiskClicks",
        color: "#FF8685",
    },
    {
        title: "Risky Geo",
        key: "riskyGeoClicks",
        color: "#F25B52",
    },
    {
        title: "Accidental Clicks",
        key: "accidentalClickerClicks",
        color: "#95031D",
    },
    {
        title: "Risky Device",
        key: "riskyDeviceClicks",
        color: "#FFBCBC",
    },
];

const Stats = () => {
    const [fetchingData, setFetchingData] = useState(true);
    const [fetchingStats, setFetchingStats] = useState(true);
    const [adType, setAdType] = useState("gclid");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [errors, setErrors] = useState({});
    const [statsError, setStatsError] = useState({}); // Not used
    const [stats, setStats] = useState({});
    const [riskScore, setRiskScore] = useState(0);
    const [domainsSummary, setDomainsSummary] = useState([]);
    const [csv, setCsv] = useState({
        fields: {
            ip: "IP Address",
            status: "Status",
            riskScore: "Fraud Score",
            primaryFraudType: "Primary Fraud Type",
            lastSeen: "Last Seen",
        },
        data: [],
    });
    const [records, setRecords] = useState([]);

    const dispatch = useDispatch();
    const { accounts, auth, activeDomain, ipBlocklist, ipWhitelist } = useSelector((state) => state); // Use useSelector hook

    const setupCurrentDomain = useCallback(
        (sid) => {
            if (!accounts?.data?.domains) return;
            const domain = accounts.data.domains.find((domain) => domain.id === sid);
            if (domain) {
                dispatch(ActiveDomain.setDomainActive(domain));
            }
            // Replace with useNavigate
            // history.push('/integrations/google-ads-setup');
            // navigate('/integrations/google-ads-setup')
        },
        [accounts.data?.domains, dispatch]
    );

    const fraudNotConnect = (sid, hideIcon = false) => (
        <Box
            component="span"
            className={`${styles.baseMess} ${hideIcon ? styles.noIcon : ""}`}
            onClick={() => setupCurrentDomain(sid)}
            sx={{ cursor: "pointer" }}
        >
            {!hideIcon && (
                <Box component="span">
                    <img src={NotConnect} alt="Not Connected" />
                </Box>
            )}
            Not Connected
        </Box>
    );

    const setCSVData = useCallback(
        (data) => {
            const listedIPs = [...ipBlocklist, ...ipWhitelist]; // Combine for easier lookup
            const formatted = data.map((item) => ({
                ...item,
                lastSeen: item.lastSeen.value,
                primaryFraudType: getPrimaryFraudType(item),
                status: getStatus(
                    listedIPs.find((ip) => ip.address.includes(item.ip)),
                    item.riskScore
                ),
            }));

            setCsv((prevCsv) => ({
                ...prevCsv,
                data: formatted,
            }));
        },
        [ipBlocklist, ipWhitelist]
    );

    const fetchData = useCallback(
        async (body) => {
            if (!activeDomain?.data?.id) return;

            try {
                const startDateUpdate = body.startDate || startDate || moment().subtract(3, "days").format("YYYYMMDD");
                const endDateUpdate = body.endDate || endDate || moment().format("YYYYMMDD");
                const adTypeUpdate = body.adType || adType;

                setStartDate(startDateUpdate);
                setEndDate(endDateUpdate);
                setAdType(adTypeUpdate);

                const query = {
                    startDate: moment(startDateUpdate, "YYYYMMDD").format("YYYY-MM-DD"),
                    endDate: moment(endDateUpdate, "YYYYMMDD").format("YYYY-MM-DD"),
                    sid: activeDomain.data.id,
                    isAggressive: activeDomain.data.aggressive_blocking,
                    timezone: Utils.sanitizeTimezoneString(
                        auth.user?.timezone || "(GMT-07:00) America/Los_Angeles" // Safe access
                    ),
                    adType: adTypeUpdate === "all" ? undefined : adTypeUpdate,
                };

                await fetchStats(query);
                setFetchingData(true);
                const result = await Data.getAdReports(query); // Assuming this is correct.

                if (result && !result.errno) {
                    const parsedResults = Utils.formatTimeAndAddRowIdInReports(
                        result,
                        auth.user?.timezone || "(GMT-07:00) America/Los_Angeles"
                    );
                    setRecords(parsedResults);
                    setCSVData(parsedResults);
                    setErrors({});
                } else {
                    setRecords([]);
                    setCSVData([]); // set empty data
                    setErrors({});
                }
            } catch (error) {
                console.error(error);
                setErrors(error);
            } finally {
                setFetchingData(false);
            }
        },
        [activeDomain?.data, auth.user?.timezone, fetchData, fetchStats, setCSVData]
    );

    const fetchBlockedIPs = useCallback(async () => {
        if (!activeDomain?.data?.id) return;
        try {
            await dispatch(IPBlockList.fetchLatestBlocklist(activeDomain.data.id));
        } catch (error) {
            console.error(error);
        }
    }, [activeDomain?.data?.id, dispatch]);

    const fetchStats = useCallback(
        async (query) => {
            try {
                setFetchingStats(true);
                setStatsError({}); // Clear previous errors
                const result = await Data.getStats(query);
                if (result && !result.errno && result.length) {
                    const statsData = result[0];
                    setStats(statsData);
                    const riskScoreVal = Utils.calcFraudScore((statsData.fraudClicks * 100) / statsData.clicks, 1);
                    setRiskScore(riskScoreVal);
                } else {
                    setStats({});
                    setRiskScore(0);
                }
            } catch (error) {
                console.error(error);
                setStatsError(error);
            } finally {
                setFetchingStats(false);
                // Animation
                setTimeout(() => {
                    const stats = document.querySelectorAll(".roll-in");
                    stats.forEach((stat) => {
                        const patt = /(\D+)?(\d+)(\D+)?(\d+)?(\D+)?/;
                        const time = 1000;
                        let result1 = [...patt.exec(stat.textContent)];
                        let fresh = true;
                        result1.shift();
                        result1 = result1.filter((res) => res != null);
                        while (stat.firstChild) {
                            stat.removeChild(stat.firstChild);
                        }
                        for (const res of result1) {
                            if (Number.isNaN(parseInt(res, 10))) {
                                stat.insertAdjacentHTML("beforeend", `<span>${res}</span>`);
                            } else {
                                for (let i = 0; i < res.length; i += 1) {
                                    stat.insertAdjacentHTML(
                                        "beforeend",
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
                                           .join("")}
                                    </span>`
                                    );
                                }
                            }
                        }
                        const ticks = [...stat.querySelectorAll("span[data-value]")];
                        const activate = () => {
                            const { top } = stat.getBoundingClientRect();
                            const offset = window.innerHeight * 0.8;

                            setTimeout(() => {
                                fresh = false;
                            }, time);

                            if (top < offset) {
                                setTimeout(
                                    () => {
                                        for (const tick of ticks) {
                                            const dist = parseInt(tick.getAttribute("data-value"), 10) + 1;
                                            tick.style.transform = `translateY(-${dist * 100}%)`;
                                        }
                                        const avgRisk = riskScore;
                                        const gauge = document.getElementById("circleInner");
                                        const gaugeValue = avgRisk * 10 * 1.8 - 45;
                                        if (gauge && gauge.style) {
                                            gauge.style.transform = `rotate(${gaugeValue}deg)`;
                                        }
                                    },
                                    fresh ? time : 0
                                );
                                window.removeEventListener("scroll", activate);
                            }
                        };
                        window.addEventListener("scroll", activate);
                        activate();
                    });
                }, 0);
            }
        },
        [riskScore]
    );

    useEffect(() => {
        const fetchDataAndBlockedIps = async () => {
            try {
                const initialStartDate =
                    localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD");
                const initialEndDate = localStorage.getItem("end_date") || moment().format("YYYYMMDD");
                await fetchData({
                    startDate: initialStartDate,
                    endDate: initialEndDate,
                });

                if (ipBlocklist.length === 0 || ipWhitelist.length === 0) {
                    await fetchBlockedIPs();
                }
            } catch (error) {
                console.error(error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchDataAndBlockedIps();
        ReactTooltip.rebuild();
    }, [fetchData, fetchBlockedIPs, ipBlocklist.length, ipWhitelist.length]); // Add fetchData to dependency array

    useEffect(() => {
        // For active domain
        if (!activeDomain?.data?.id) return;
        const fetchDataAndBlockedIps = async () => {
            try {
                const initialStartDate =
                    localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD");
                const initialEndDate = localStorage.getItem("end_date") || moment().format("YYYYMMDD");
                await fetchData({
                    startDate: initialStartDate,
                    endDate: initialEndDate,
                });

                if (ipBlocklist.length === 0 || ipWhitelist.length === 0) {
                    await fetchBlockedIPs();
                }
            } catch (error) {
                console.error(error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchDataAndBlockedIps();
    }, [activeDomain.data.id, fetchData, fetchBlockedIPs, ipBlocklist.length, ipWhitelist.length]); // Add fetchData to dependency array

    const onStatusChange = useCallback(
        async (index, currentStatus) => {
            const listedIp = ipBlocklist.find((ipBlock) => records[index].ip.includes(ipBlock.address));
            const listedWhite = ipWhitelist.find((ipBlock) => records[index].ip.includes(ipBlock.address));

            if (currentStatus === "Auto Blocked") {
                autoBlockIp(records[index].ip, false);
            } else if (currentStatus === "Unblocked" && !listedWhite) {
                autoBlockIp(records[index].ip, true);
            } else if (currentStatus === "Unblocked" && listedWhite) {
                await removeIPFromBlockList(records[index].ip, false);
                autoBlockIp(records[index].ip, true);
            } else if (!listedIp) {
                autoBlockIp(records[index].ip, true);
            } else {
                removeIPFromBlockList(records[index].ip, true);
            }
        },
        [ipBlocklist, ipWhitelist, records, autoBlockIp, removeIPFromBlockList]
    );

    const autoBlockIp = useCallback(
        async (ipAddress, isBlocked = true) => {
            if (!accounts.data?.id || !activeDomain?.data?.id) return;
            try {
                const data = {
                    account_id: accounts.data.id,
                    address: ipAddress,
                    is_blocked: isBlocked,
                    domain_id: activeDomain.data.id,
                };
                await GoogleAds.addIpToBlocklist({ ips: [data] });
                await fetchBlockedIPs(); // Refresh
            } catch (error) {
                console.error(error);
                // Consider setting an error state to display to user.
            }
        },
        [accounts.data?.id, activeDomain?.data?.id, fetchBlockedIPs]
    );

    const removeIPFromBlockList = useCallback(
        async (ipAddress, isBlocked) => {
            try {
                let selectedIp = null;
                if (isBlocked) {
                    selectedIp = ipBlocklist.find((ipBlock) => ipBlock.address === ipAddress);
                } else {
                    selectedIp = ipWhitelist.find((ipBlock) => ipBlock.address === ipAddress);
                }
                if (!selectedIp) return;

                await GoogleAds.removeIpFromBlocklist({ ids: [selectedIp.id] });
                await fetchBlockedIPs(); // Refresh
            } catch (error) {
                console.error(error);
                // Consider setting an error state to display to user.
            }
        },
        [fetchBlockedIPs, ipBlocklist, ipWhitelist]
    );

    const getFraudLevel = useCallback((avg) => {
        if (avg >= 7) {
            return "high";
        }
        if (avg > 3) {
            return "medium";
        }
        return "low";
    }, []);

    // const downloadResults = () => {}; // This function is currently empty, not changed.

    return (
        <Box className={styles.content}>
            <ReactTooltip id="latestScore" multiline={true} className={styles.tooltipContent}>
                <div>
                    This score represents the average amount of activity from bots and other invalid activity to your
                    advertising campaigns.
                </div>
            </ReactTooltip>
            <ReactTooltip id="ipsFromAds" multiline={true} className={styles.tooltipContent}>
                <div>
                    These IP addresses are only those we detected to your site from advertising campaigns during the
                    period you selected.
                </div>
            </ReactTooltip>
            {fraudTypes.map((type) => (
                <ReactTooltip key={type.key} id={type.key} multiline={true} className={styles.tooltipContent}>
                    <div>
                        {
                            type.key === "excessiveClickerClicks"
                                ? 'We block users that visit your site repeatedly in a short period of time (such as 5 times within a minute). We avoid blocking "real" users you may be retargeting.'
                                : type.key === "accidentalClickerClicks"
                                  ? "We block users that click your ad and bounce in less than 2 seconds. Our data indicates these are very often accidental clicks."
                                  : "" // No specific tooltip for other types.
                        }
                    </div>
                </ReactTooltip>
            ))}

            <Box className={styles.header}>
                <Typography variant="h1" className={styles.title}>
                    Fraud Score
                </Typography>
            </Box>
            <Box className={styles.topFiltersWrap}>
                <AdSelector showAll={false} handleAdChange={fetchData} />
                <DatesSelector handleDateChange={fetchData} />
            </Box>
            {adType === "msclkid" && (
                <Box className={styles.info}>
                    <Box>
                        <img src={NoteIcon} alt="alert" />
                        IPs cannot be blocked automatically for Microsoft Ads.{" "}
                        <Link
                            href="https://help.fraudblocker.com/en/articles/8224653-can-i-protect-my-microsoft-ads-campaigns"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Learn More
                        </Link>
                        .
                    </Box>
                </Box>
            )}

            {!fetchingStats ? (
                <Box className={styles.fraudThreatContainer}>
                    <Box className={styles.fraudThreatScoreContainer}>
                        <Box>
                            <Typography variant="body1" className={styles.containerTitle}>
                                Threat Level
                                <Link data-tip data-for="latestScore">
                                    <img className={styles.tooltip} src={TOOLTIP} alt="Tooltip" />
                                </Link>
                            </Typography>
                        </Box>

                        <Box className={styles.scoreContainer}>
                            <Box className={styles.gaugeHolder}>
                                <Box className={styles.circleWrap}>
                                    <Box
                                        id="circleInner"
                                        className={`${styles.circleInner} ${
                                            riskScore <= 4.5
                                                ? styles.circleBlue
                                                : riskScore > 4.5 && riskScore <= 7
                                                  ? styles.circleYellow
                                                  : styles.circleRed
                                        }`}
                                    />
                                </Box>
                            </Box>

                            <Typography variant="h1" className={`${styles.scoreText} roll-in`}>
                                {riskScore ? parseFloat(riskScore).toFixed(1) : 0}
                            </Typography>
                            <Typography className={styles.scoreDescription}>
                                Your site received a{" "}
                                <Box
                                    component="span"
                                    className={`${
                                        riskScore <= 4.5
                                            ? styles.lowLevel
                                            : riskScore > 4.5 && riskScore <= 7
                                              ? styles.medLevel
                                              : styles.highLevel
                                    }`}
                                >
                                    {getFraudLevel(riskScore)}
                                </Box>{" "}
                                level of fraud threats
                            </Typography>
                        </Box>

                        <Box className={styles.scoreFeatureContainer}>
                            <Box className={styles.scoreFeature}>
                                <Typography className={styles.scoreFeatureTitle}>Clean</Typography>
                                <Typography>
                                    {(stats.cleanClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    clicks,{" "}
                                    <Box component="span" className={`${styles.rollWrap} roll-in`}>
                                        {stats.cleanClicks
                                            ? ((stats.cleanClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })
                                            : 0}
                                        %
                                    </Box>
                                </Typography>
                            </Box>
                            <Box className={styles.scoreFeature}>
                                <Typography className={styles.scoreFeatureTitle}>Suspected</Typography>
                                <Typography>
                                    {(stats.suspectedClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    clicks,{" "}
                                    <Box component="span" className={`${styles.rollWrap} roll-in`}>
                                        {stats.suspectedClicks
                                            ? ((stats.suspectedClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })
                                            : 0}
                                        %
                                    </Box>
                                </Typography>
                            </Box>
                            <Box className={styles.scoreFeature}>
                                <Typography className={styles.scoreFeatureTitle}>Invalid</Typography>
                                <Typography>
                                    {(stats.fraudClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    clicks,{" "}
                                    <Box component="span" className={`${styles.rollWrap} roll-in`}>
                                        {stats.fraudClicks
                                            ? ((stats.fraudClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })
                                            : 0}
                                        %
                                    </Box>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box className={styles.horizontalDivider} />

                    <Box className={styles.blockedFraudTypeContainer}>
                        <Box style={{ display: "inline" }} className={styles.containerTitle}>
                            Blocked Fraud Type
                            {activeDomain.data && activeDomain.data.last_sync_time && adType !== "msclkid" && (
                                <Box className={styles.lastSyncDate}>
                                    <img src={SYNC} alt="sync" />
                                    <span>Last Sync Time</span>
                                    {moment(activeDomain.data.last_sync_time).format("MMM DD, YYYY")}
                                    at {moment(activeDomain.data.last_sync_time).format("HH:mm")}
                                </Box>
                            )}
                            {activeDomain.data && adType === "msclkid" && (
                                <Box className={styles.lastSyncDate}>
                                    <img src={ALERT} alt="info" />
                                    <span>
                                        Microsoft Ads Does Not Sync Automatically.{" "}
                                        <Link
                                            href="https://help.fraudblocker.com/en/articles/8224653-can-i-protect-my-microsoft-ads-campaigns"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Learn More
                                        </Link>
                                    </span>
                                </Box>
                            )}
                        </Box>

                        {fraudTypes.map((type, index) => (
                            <Box key={index}>
                                <Box className={styles.percentageTextContainer}>
                                    <Typography>
                                        {type.title}
                                        {(type.key === "excessiveClickerClicks" ||
                                            type.key === "accidentalClickerClicks") && (
                                            <Link data-tip data-for={type.key}>
                                                <img className={styles.tooltip} src={TOOLTIP} alt="Tooltip" />
                                            </Link>
                                        )}
                                    </Typography>
                                    <Typography>
                                        {stats[type.key] || 0} clicks,{" "}
                                        {stats[type.key]
                                            ? ((stats[type.key] * 100) / stats.fraudClicks).toFixed(1) // toFixed is enough
                                            : 0}
                                        %
                                    </Typography>
                                </Box>
                                <ProgressBar
                                    color="#FC584E"
                                    percentage={stats[type.key] ? (stats[type.key] * 100) / stats.fraudClicks : 0}
                                />
                            </Box>
                        ))}

                        <Box className={styles.vpnContainer}>
                            {/*<Typography>*/}
                            {/*  <span className={styles.vpn}>VPN</span>{" "}*/}
                            {/*  {activeDomain.data.vpn_blocking === false ? "Not Enabled" : "Enabled"}*/}
                            {/*</Typography>*/}
                            <Link component={RouterLink} to="customizations/detection-rules" className={styles.link}>
                                Customize
                            </Link>
                        </Box>
                    </Box>
                </Box>
            ) : (
                // Show loading indicator ... (You had some custom animation, keeping it as comment)
                /* <div className={styles.chartLoading}> ... </div> */
                <Box>Loading...</Box> // Simple loading text.  Replace with a spinner if you prefer
            )}

            {fetchingData ? (
                <Box>Loading Table...</Box> // Simple loading message.  Replace with spinner.
            ) : (
                <Box className={styles.detailsContainer}>
                    <Box className={styles.detailsContainerHeader}>
                        <Typography className={`${styles.containerTitle} ${styles.gridTitle}`}>
                            IPs from Advertising
                            <Link data-tip data-for="ipsFromAds">
                                <img className={styles.tooltip} src={TOOLTIP} alt="Tooltip" />
                            </Link>
                        </Typography>
                        {/* CSV Download Button - Not implemented, as discussed */}
                    </Box>

                    <StatsTable
                        loading={fetchingData}
                        results={records}
                        maxHeight={400}
                        ipBlocklist={ipBlocklist.concat(ipWhitelist)}
                        onStatusChange={onStatusChange} // Corrected prop name
                        accounts={accounts}
                        activeDomain={activeDomain}
                    />
                </Box>
            )}
        </Box>
    );
};

Stats.propTypes = {
    auth: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    ipBlocklist: PropTypes.arrayOf(PropTypes.object).isRequired,
    ipWhitelist: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string,
            aggressive_blocking: PropTypes.bool,
            last_sync_time: PropTypes.string,
        }),
    }),
    fetchLatestBlocklist: PropTypes.func.isRequired,
};

export default Stats;
