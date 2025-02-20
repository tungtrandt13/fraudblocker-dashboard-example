import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom"; // Use RouterLink
import PropTypes from "prop-types";
import moment from "moment";
import {
    Box,
    Typography,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableFooter,
    TableRow,
    styled,
    Link,
} from "@mui/material";
import { PieChart } from "react-minimal-pie-chart";
import styles from "./Overview.module.scss";
import DatesSelector from "../../containers/DatesSelector/DatesSelector";
import AdSelector from "../../components/AdSelector/AdSelector";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Data from "../../api/Data";
import Utils from "../../utils/Utils";

// Images
import CheckIcon from "../../assets/box-check.svg";
import MinusIcon from "../../assets/_minus.svg";
import MobileIcon from "../../assets/mobileIcon.svg";
import DeskIcon from "../../assets/deskIcon.svg";
import NotConnect from "../../assets/nt-connect.svg";
import NoDataGraph from "../../assets/nodata.png";
import NoteIcon from "../../assets/note-icon.png";
import MetaAdsIcon from "../../assets/meta-ads-blue.png";
import GoogleAdsIcon from "../../assets/google-ads-blue.png";

const SuccessLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    "&.MuiLinearProgress-colorPrimary": {
        backgroundColor: "#F2F4F6",
    },
    "& .MuiLinearProgress-bar": {
        borderRadius: 7,
        backgroundColor: "#10CD24",
    },
}));

const WarningLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    "&.MuiLinearProgress-colorPrimary": {
        backgroundColor: "#F2F4F6",
    },
    "& .MuiLinearProgress-bar": {
        borderRadius: 7,
        backgroundColor: "#F99400CC",
    },
}));

const DangerLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    "&.MuiLinearProgress-colorPrimary": {
        backgroundColor: "#F2F4F6",
    },
    "& .MuiLinearProgress-bar": {
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
        title: "VPN / DataCenter",
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

const Overview = () => {
    const [fetchingData, setFetchingData] = useState(true);
    const [fetchingStats, setFetchingStats] = useState(true);
    const [adType, setAdType] = useState("gclid");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [errors, setErrors] = useState({}); // Not currently used, but good practice to keep
    const [stats, setStats] = useState({});
    const [domainsSummary, setDomainsSummary] = useState([]);
    const [isAnyDomainConnected, setIsAnyDomainConnected] = useState(false);

    const dispatch = useDispatch();
    const { accounts, auth } = useSelector((state) => state);
    const subscription = accounts?.data ? Utils.getSingleSubscription(accounts, accounts.data.id) : null; //Safe access

    const setupCurrentDomain = useCallback(
        (sid) => {
            if (!accounts?.data?.domains) return;
            const domain = accounts.data.domains.find((domain) => domain.id === sid);
            dispatch(ActiveDomain.setDomainActive(domain));
            // Replace with useNavigate
            // history.push('/integrations/google-ads-setup');
            // navigate('/integrations/google-ads-setup');
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

    const fetchData = useCallback(
        async (body) => {
            if (!accounts.data?.domains?.length) {
                return;
            }

            try {
                const sids = accounts.data.domains.filter((item) => !item.is_deleted).map((domain) => domain.id);

                if (!sids.length) {
                    return;
                }

                const startDateUpdate = body.startDate || startDate || moment().subtract(3, "days").format("YYYYMMDD");
                const endDateUpdate = body.endDate || endDate || moment().format("YYYYMMDD");
                const adTypeUpdate = body.adType || adType;

                setStartDate(startDateUpdate);
                setEndDate(endDateUpdate);
                setAdType(adTypeUpdate);

                const query = {
                    startDate: moment(startDateUpdate, "YYYYMMDD").format("YYYY-MM-DD"),
                    endDate: moment(endDateUpdate, "YYYYMMDD").format("YYYY-MM-DD"),
                    sid: sids,
                    isAggressive: false,
                    timezone: Utils.sanitizeTimezoneString(
                        auth.user?.timezone || "(GMT-07:00) America/Los_Angeles" // Safe access
                    ),
                    adType: adTypeUpdate === "all" ? undefined : adTypeUpdate,
                };

                await fetchStats(query); // Await this, so stats are available for calculations below.
                setFetchingData(true);

                const result = await Data.getDashboardSummary(query);

                if (result && !result.errno && result.length) {
                    // Calculate aggregates *before* filtering.
                    const totalSavings = result.reduce((acc, item) => {
                        const domain = accounts.data.domains.find((d) => d.id === item.sid);
                        const cpc = domain ? domain.cpc : 0; // Default to 0 if no domain/cpc found.
                        return acc + Utils.calculateSavedAmount(item.clicks, item.percentBlocked, cpc);
                    }, 0);

                    const totalViews = result.reduce((acc, item) => acc + (item.visitors || 0), 0);
                    const totalClicks = result.reduce((acc, item) => acc + (item.clicks || 0), 0);
                    const totalBlockedClicks = result.reduce((acc, item) => acc + (item.blockedClicks || 0), 0);

                    const totalPerBlocked = totalClicks ? (totalBlockedClicks * 100) / totalClicks : 0; // Avoid division by zero.

                    const totalFraudScore = totalBlockedClicks
                        ? result.reduce(
                              (acc, item) =>
                                  acc +
                                  Number(Utils.calcFraudScore(item.percentBlocked, 1) || "0") *
                                      (item.blockedClicks || 0), // Default to 0 for safety.
                              0
                          ) / totalBlockedClicks
                        : 0;

                    const filteredResults = accounts.data.domains
                        .filter((item) => !item.is_deleted)
                        .map((item) => result.find((domain) => domain.sid === item.id))
                        .filter(Boolean);

                    const summary = accounts.data.domains
                        .filter((item) => !item.is_deleted)
                        .map((item) => {
                            const relatedResult = result.find((domain) => domain.sid === item.id);
                            return {
                                sid: item.id,
                                savings: relatedResult
                                    ? Utils.calculateSavedAmount(
                                          relatedResult.clicks,
                                          relatedResult.percentBlocked,
                                          item.cpc
                                      )
                                    : 0,
                                domain: item.domain_name,
                                connected: item.data_sync_success || item.google_ads_token,
                                installed:
                                    item.google_ads_token &&
                                    item.google_email &&
                                    item.connected_google_ads_customers_count !== "0", // Consider using a boolean instead of string comparison
                                metaToken: item.meta_ads_token,
                                ...(relatedResult || {}), // Keep existing properties
                            };
                        });

                    setDomainsSummary(summary);
                    setTotalSavings(totalSavings);
                    setTotalViews(totalViews.toLocaleString("en-US", { maximumFractionDigits: 1 }));
                    setTotalClicks(totalClicks.toLocaleString("en-US", { maximumFractionDigits: 1 }));
                    setTotalFraudScore(
                        totalFraudScore.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                        })
                    );
                    setTotalBlockedClicks(
                        totalBlockedClicks.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                        })
                    );
                    setTotalPerBlocked(
                        Number(totalPerBlocked.toFixed(1)).toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                        })
                    );
                    setErrors({});
                } else {
                    // Handle case where no results are returned.  Still map, but set values to 0.
                    const summary = accounts.data.domains
                        .filter((item) => !item.is_deleted)
                        .map((item) => ({
                            sid: item.id,
                            savings: 0,
                            domain: item.domain_name,
                            connected: item.data_sync_success || item.google_ads_token,
                            installed:
                                item.google_ads_token &&
                                item.google_email &&
                                item.connected_google_ads_customers_count !== "0",
                            metaToken: item.meta_ads_token,
                            // Keep existing properties
                        }));

                    setDomainsSummary(summary);
                    setTotalSavings(0.0);
                    setTotalViews(0);
                    setTotalClicks(0);
                    setTotalBlockedClicks(0);
                    setTotalPerBlocked(0);
                    setTotalFraudScore(0);
                }
            } catch (error) {
                console.error(error);
                setErrors(error);
            } finally {
                setFetchingData(false);
            }
        },
        [accounts.data, auth.user, startDate, endDate, adType]
    );

    const fetchStats = useCallback(async (query) => {
        try {
            setFetchingStats(true);
            const result = await Data.getStats(query); // This should be an array.
            if (result && !result.errno && result.length) {
                setStats(result[0]);
            } else {
                setStats({}); // Reset stats
            }
        } catch (error) {
            console.error(error);
            setStats({}); // Reset stats
        } finally {
            setFetchingStats(false);
        }
    }, []);

    useEffect(() => {
        const fetchDataAndCheckConnection = async () => {
            try {
                const initialStartDate =
                    localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD");
                const initialEndDate = localStorage.getItem("end_date") || moment().format("YYYYMMDD");

                await fetchData({
                    startDate: initialStartDate,
                    endDate: initialEndDate,
                });

                const isAnyDomainConnected = accounts.data.domains.some(
                    (domain) => domain.google_ads_token || domain.data_sync_success || domain.pixel_install_success
                );
                setIsAnyDomainConnected(isAnyDomainConnected);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDataAndCheckConnection();
    }, [accounts.data.domains, fetchData]);

    const gotoDomainDashboard = useCallback(
        (sid) => {
            if (!accounts?.data?.domains) return;
            const domain = accounts.data.domains.find((domain) => domain.id === sid);
            if (domain) {
                dispatch(ActiveDomain.setDomainActive(domain));
                // Replace with useNavigate
                // history.push('/dashboard');
                // navigate('/dashboard')
            }
        },
        [accounts.data.domains, dispatch]
    );

    const currencySymbol = auth.user?.currency || "USD"; // Safe access
    const showUpgradeLink =
        subscription &&
        subscription.plan &&
        subscription.plan.metadata.domains !== "unlimited" &&
        accounts.data.domains.filter((item) => !item.is_deleted).length >= subscription.plan.metadata.domains &&
        (!subscription.metadata.domain ||
            accounts.data.domains.filter((item) => !item.is_deleted).length >=
                parseInt(subscription.metadata.domain, 10));

    const showDeleteLink = accounts.data?.domains?.filter((item) => !item.is_deleted).length > 0; // Safe access

    return (
        <Box className={`${styles.content} ${styles.overviewContent}`}>
            <Box className={styles.header}>
                <Typography variant="h1" className={styles.title}>
                    Overview
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
            <Box className={styles.overviewStatus}>
                <Box className={`${styles.totalSavings} ${styles.statusBox}`}>
                    <Typography className={styles.statusHeading}>Estimated Savings</Typography>
                    <Typography className={styles.statusValue}>
                        {isAnyDomainConnected
                            ? Utils.convertToCurrency(
                                  accounts.conversionRates,
                                  Number(totalSavings.toFixed(2)),
                                  currencySymbol
                              )
                            : Utils.convertToCurrency(accounts.conversionRates, 0, currencySymbol)}
                    </Typography>
                </Box>
                <Box className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <Box className={`${styles.statusBoxInner} ${styles.successBox}`}>
                        <Box className={styles.iconBox}>
                            <img src={CheckIcon} alt="Clean" />
                        </Box>
                        <Box className={styles.boxDetais}>
                            <Typography className={styles.statusHeading}>Clean</Typography>
                            {isAnyDomainConnected ? (
                                <Typography className={styles.statusValue}>
                                    {(stats.cleanClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.cleanClicks
                                        ? ((stats.cleanClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}
                                    %)
                                </Typography>
                            ) : (
                                <Typography className={styles.statusValueDisabled}>Pending</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <Box className={`${styles.statusBoxInner} ${styles.warningBox}`}>
                        <Box className={styles.iconBox}>
                            <img src={MinusIcon} alt="Suspected" />
                        </Box>
                        <Box className={styles.boxDetais}>
                            <Typography className={styles.statusHeading}>Suspected</Typography>
                            {isAnyDomainConnected ? (
                                <Typography className={styles.statusValue}>
                                    {(stats.suspectedClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.suspectedClicks
                                        ? ((stats.suspectedClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}
                                    %)
                                </Typography>
                            ) : (
                                <Typography className={styles.statusValueDisabled}>Pending</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <Box className={`${styles.statusBoxInner} ${styles.dangerBox}`}>
                        <Box className={styles.iconBox}>
                            <Typography component="strong" sx={{ marginTop: "-2px" }}>
                                !
                            </Typography>
                        </Box>
                        <Box className={styles.boxDetais}>
                            <Typography className={styles.statusHeading}>Invalid</Typography>
                            {isAnyDomainConnected ? (
                                <Typography className={styles.statusValue}>
                                    {(stats.fraudClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.fraudClicks
                                        ? ((stats.fraudClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}
                                    %)
                                </Typography>
                            ) : (
                                <Typography className={styles.statusValueDisabled}>Pending</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box className={styles.overviewDetails}>
                <Box className={styles.overviewNetwork}>
                    <Typography className={styles.gridHeading}>Ad Network</Typography>
                    <Box className={styles.detailBox}>
                        <Box className={styles.progressStats}>
                            {isAnyDomainConnected ? (
                                <>
                                    <Box className={styles.progressRow}>
                                        <Box className={styles.progressWrapper}>
                                            <Box sx={{ width: "100%" }}>
                                                <SuccessLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.cleanClicks ? (stats.cleanClicks * 100) / stats.clicks : 0
                                                    }
                                                />
                                            </Box>
                                        </Box>
                                        <Box className={styles.boxDetais}>
                                            <Typography className={styles.statusHeading}>Clean</Typography>
                                            <Typography className={`${styles.statusValue} ${styles.successColor}`}>
                                                {stats.cleanClicks
                                                    ? ((stats.cleanClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}
                                                %
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box className={styles.progressRow}>
                                        <Box className={styles.progressWrapper}>
                                            <Box sx={{ width: "100%" }}>
                                                <WarningLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.suspectedClicks
                                                            ? (stats.suspectedClicks * 100) / stats.clicks
                                                            : 0
                                                    }
                                                />
                                            </Box>
                                        </Box>
                                        <Box className={styles.boxDetais}>
                                            <Typography className={styles.statusHeading}>Suspected</Typography>
                                            <Typography className={`${styles.statusValue} ${styles.warningColor}`}>
                                                {stats.suspectedClicks
                                                    ? ((stats.suspectedClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}
                                                %
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box className={styles.progressRow}>
                                        <Box className={styles.progressWrapper}>
                                            <Box sx={{ width: "100%" }}>
                                                <DangerLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.fraudClicks ? (stats.fraudClicks * 100) / stats.clicks : 0
                                                    }
                                                />
                                            </Box>
                                        </Box>
                                        <Box className={styles.boxDetais}>
                                            <Typography className={styles.statusHeading}>Invalid</Typography>
                                            <Typography className={`${styles.statusValue} ${styles.dangerColor}`}>
                                                {stats.fraudClicks
                                                    ? ((stats.fraudClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}
                                                %
                                            </Typography>
                                        </Box>
                                    </Box>
                                </>
                            ) : (
                                <Box className={styles.noAdMess}>
                                    You have no data yet. Please connect your Google Ads account(s).
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box className={styles.overviewType}>
                    <Typography className={styles.gridHeading}>Fraud Type</Typography>
                    <Box className={styles.detailBox}>
                        <Box className={styles.fraudList}>
                            <ul>
                                {fraudTypes.map((type, index) => (
                                    <li key={index}>
                                        <span className={styles.listLabel}>{type.title}</span>
                                        <span
                                            className={styles.listValue}
                                            style={{
                                                color: isAnyDomainConnected ? type.color : "#CBCBCB",
                                            }}
                                        >
                                            {stats[type.key]
                                                ? ((stats[type.key] * 100) / stats.fraudClicks).toFixed(1) // Removed toLocaleString, toFixed is enough
                                                : 0}
                                            %
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Box>
                        <Box className={styles.fraudGraph}>
                            <Box className={styles.nodataGraph}>
                                {isAnyDomainConnected ? (
                                    <PieChart
                                        lineWidth={15}
                                        paddingAngle={5}
                                        animate
                                        data={fraudTypes.map((type) => ({
                                            title: type.title,
                                            value: stats[type.key] ? (stats[type.key] * 100) / stats.fraudClicks : 0,
                                            color: type.color,
                                        }))}
                                    />
                                ) : (
                                    <>
                                        <img src={NoDataGraph} alt="No Data" />
                                        <span>No data yet</span>
                                    </>
                                )}
                            </Box>
                        </Box>
                        <Box className={styles.fraudDevice}>
                            <Box className={styles.fraudDeviceType}>
                                <Box className={styles.fraudDeviceIcon}>
                                    <img src={MobileIcon} alt="Mobile" />
                                </Box>
                                <Box className={styles.fraudDeviceDetails}>
                                    <Typography className={styles.deviceName}>Mobile</Typography>
                                    <Typography className={styles.deviceValue}>
                                        {stats.fraudClicksMobile &&
                                            stats.fraudClicksMobile.toLocaleString("en-US", {
                                                maximumFractionDigits: 1,
                                            })}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box className={styles.fraudDeviceType}>
                                <Box className={styles.fraudDeviceIcon}>
                                    <img src={DeskIcon} alt="Desktop" />
                                </Box>
                                <Box className={styles.fraudDeviceDetails}>
                                    <Typography className={styles.deviceName}>Desktop</Typography>
                                    <Typography className={styles.deviceValue}>
                                        {stats.fraudClicksDesktop &&
                                            stats.fraudClicksDesktop.toLocaleString("en-US", {
                                                maximumFractionDigits: 1,
                                            })}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box className={styles.overviewTable}>
                <Typography className={styles.gridHeading}>Website Summary</Typography>
                <TableContainer>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Website Name</TableCell>
                                <TableCell align="center">Connection</TableCell>
                                <TableCell align="center">Total Visits</TableCell>
                                <TableCell align="center">Ad Clicks</TableCell>
                                <TableCell align="center">Invalid(#)</TableCell>
                                <TableCell align="center">Invalid(%)</TableCell>
                                <TableCell align="center">Fraud Score</TableCell>
                                <TableCell>Savings</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {domainsSummary.map((row) => (
                                <TableRow key={row.sid} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                                    <TableCell component="th" scope="row">
                                        <Link
                                            component="button" // Use component="button" for accessibility
                                            variant="body2"
                                            onClick={() => gotoDomainDashboard(row.sid)}
                                            sx={{
                                                cursor: "pointer",
                                                color: "primary.main", // Use a theme color
                                                textDecoration: "none",
                                                "&:hover": {
                                                    // Add hover styles
                                                    textDecoration: "underline",
                                                },
                                            }}
                                        >
                                            {row.domain}
                                        </Link>
                                    </TableCell>
                                    <TableCell align="center" className={styles.secondTd}>
                                        {row.installed || row.metaToken ? (
                                            <Box
                                                component="span"
                                                className={`${styles.adType} ${!(row.installed && row.metaToken) ? styles.singleAd : ""}`}
                                            >
                                                {row.installed && <img src={GoogleAdsIcon} alt="google" />}
                                                {row.metaToken && <img src={MetaAdsIcon} alt="meta" />}
                                            </Box>
                                        ) : (
                                            fraudNotConnect(row.sid, true)
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {(row.visitors || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}
                                    </TableCell>
                                    <TableCell align="center" className={styles.thirdTd}>
                                        {(row.clicks || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        }) || ""}
                                    </TableCell>
                                    <TableCell align="center">
                                        {(row.blockedClicks || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        }) || ""}
                                    </TableCell>
                                    <TableCell align="center">
                                        {`${(row.percentBlocked || 0).toFixed(1)}%` || ""}
                                    </TableCell>
                                    <TableCell align="center">
                                        {Utils.calcFraudScore(row.percentBlocked, 1) || ""}
                                    </TableCell>
                                    <TableCell align="left" className={styles.priceBold}>
                                        {row.savings
                                            ? row.savings &&
                                              Utils.convertToCurrency(
                                                  conversionRates,
                                                  Number(row.savings.toFixed(2)),
                                                  currencySymbol
                                              )
                                            : Utils.convertToCurrency(conversionRates, 0, currencySymbol)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell />
                                <TableCell />
                                <TableCell align="center">{totalViews}</TableCell>
                                <TableCell align="center">{totalClicks}</TableCell>
                                <TableCell align="center">{totalBlockedClicks}</TableCell>
                                <TableCell align="center">{totalPerBlocked}%</TableCell>
                                <TableCell align="center">{totalFraudScore}</TableCell>
                                <TableCell className={styles.priceBold}>
                                    {isAnyDomainConnected
                                        ? totalSavings &&
                                          Utils.convertToCurrency(
                                              conversionRates,
                                              Number(totalSavings.toFixed(2)),
                                              currencySymbol
                                          )
                                        : Utils.convertToCurrency(conversionRates, 0, currencySymbol)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Box>
            {showUpgradeLink && (
                <Box className={styles.needMore}>
                    <Link component={RouterLink} to="/account/billing/subscription" state={{ showPlansPopup: true }}>
                        Need more websites ? Upgrade
                    </Link>
                </Box>
            )}

            {showDeleteLink && (
                <Box className={styles.deleteWebsite}>
                    <Link component={RouterLink} to="/account/billing/subscription">
                        Delete a website
                    </Link>
                </Box>
            )}
        </Box>
    );
};

Overview.propTypes = {
    accounts: PropTypes.shape({
        data: PropTypes.shape({
            domains: PropTypes.arrayOf(
                PropTypes.shape({
                    id: PropTypes.string.isRequired,
                    domain_name: PropTypes.string.isRequired,
                    google_ads_token: PropTypes.string,
                    data_sync_success: PropTypes.bool,
                    pixel_install_success: PropTypes.bool,
                    cpc: PropTypes.number,
                    is_deleted: PropTypes.bool,
                })
            ),
        }),
        conversionRates: PropTypes.arrayOf(
            PropTypes.shape({
                from: PropTypes.string,
                to: PropTypes.string,
                rate: PropTypes.number,
            })
        ),
    }).isRequired,
    auth: PropTypes.shape({
        user: PropTypes.shape({
            currency: PropTypes.string,
        }),
    }).isRequired,
    setDomain: PropTypes.func.isRequired,
};

export default Overview;
