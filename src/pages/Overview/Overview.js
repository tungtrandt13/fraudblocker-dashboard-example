import React, { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import { PieChart } from "react-minimal-pie-chart";
import LinearProgress, { linearProgressClasses } from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableFooter from "@mui/material/TableFooter";
import TableRow from "@mui/material/TableRow";
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

// Styled Components (Giữ nguyên, không thay đổi)
const SucessLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 7,
        backgroundColor: "#10CD24",
    },
}));

const WarningLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 7,
        backgroundColor: "#F99400CC",
    },
}));

const DangerLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 7,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: "#F2F4F6",
    },
    [`& .${linearProgressClasses.bar}`]: {
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
    // State sử dụng useState
    const [fetchingData, setFetchingData] = useState(true);
    const [fetchingStats, setFetchingStats] = useState(true);
    const [adType, setAdType] = useState("gclid");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [errors, setErrors] = useState({});
    const [statsError, setStatsError] = useState({});
    const [stats, setStats] = useState({});
    const [domainsSummary, setDomainsSummary] = useState([]);
    const [isAnyDomainConnected, setIsAnyDomainConnected] = useState(false);

    const [totalSavings, setTotalSavings] = useState(0);
    const [totalViews, setTotalViews] = useState(0);
    const [totalClicks, setTotalClicks] = useState(0);
    const [totalBlockedClicks, setTotalBlockedClicks] = useState(0);
    const [totalPerBlocked, setTotalPerBlocked] = useState(0);
    const [totalFraudScore, setTotalFraudScore] = useState(0);

    // Redux hooks
    const accounts = useSelector((state) => state.accounts);
    const auth = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const setDomain = useCallback(
        (domain) => {
            dispatch(ActiveDomain.setDomainActive(domain));
        },
        [dispatch]
    );

    // Thay thế componentDidMount bằng useEffect
    useEffect(() => {
        const fetchDataOnMount = async () => {
            try {
                await fetchData(
                    {
                        startDate:
                            localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD"),
                        endDate: localStorage.getItem("end_date") || moment().format("YYYYMMDD"),
                    },
                    null
                );

                const connected = accounts.data.domains.some(
                    (domain) => domain.google_ads_token || domain.data_sync_success || domain.pixel_install_success
                );
                setIsAnyDomainConnected(connected);
            } catch (error) {
                console.error("Error in fetchDataOnMount:", error);
            } finally {
                setFetchingData(false);
            }
        };
        if (accounts.data) {
            // Đảm bảo accounts.data đã được load
            fetchDataOnMount();
        }
    }, []); // Thêm fetchData vào dependency array

    // Các hàm được chuyển đổi sang dùng useCallback để tránh re-render không cần thiết.
    const setupCurrentDomain = useCallback(
        (sid) => {
            if (accounts.data?.domains) {
                setDomain(accounts.data.domains.find((domain) => domain.id === sid));
                navigate("/integrations/google-ads-setup");
            }
        },
        [accounts.data, setDomain, navigate]
    );

    const fraudNotConnect = useCallback(
        (sid, hideIcon = false) => (
            <span
                key={null} // key không cần thiết ở đây.
                className={`${styles.baseMess} ${hideIcon ? styles.noIcon : ""}`}
                onClick={() => setupCurrentDomain(sid)}
            >
                {!hideIcon && (
                    <span>
                        <img src={NotConnect} alt="Not Connected" />
                    </span>
                )}
                Not Connected
            </span>
        ),
        [setupCurrentDomain]
    );

    const fetchData = useCallback(
        async (body, adTypeValue) => {
            try {
                if (!accounts.data?.domains || !accounts.data.domains.length) {
                    return;
                }
                const sids = accounts.data.domains.filter((item) => !item.is_deleted).map((domain) => domain.id);

                if (!sids.length) {
                    return;
                }

                const { timezone } = auth.user;
                const newStartDate = body.startDate || startDate;
                const newEndDate = body.endDate || endDate;
                const newAdType = adTypeValue || adType;

                setStartDate(newStartDate);
                setEndDate(newEndDate);
                setAdType(newAdType);

                const query = {
                    startDate: moment(newStartDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    endDate: moment(newEndDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    sid: sids,
                    isAggressive: false,
                    timezone: Utils.sanitizeTimezoneString(timezone || "(GMT-07:00) America/Los_Angeles"),
                    adType: newAdType === "all" ? undefined : newAdType,
                };

                await fetchStats(query); // Đợi fetchStats hoàn thành
                setFetchingData(true);
                const result = await Data.getDashboardSummary(query);

                if (result && !result.errno && result.length) {
                    const filteredResults = accounts.data.domains
                        .filter((item) => !item.is_deleted)
                        .map((item) => result.find((domain) => domain.sid === item.id))
                        .filter(Boolean);

                    const totalSavings = filteredResults.reduce((acc, item) => {
                        const domain = accounts.data.domains.find((d) => d.id === item.sid);
                        return acc + Utils.calculateSavedAmount(item.clicks, item.percentBlocked, domain?.cpc || 0);
                    }, 0);

                    const totalViews = filteredResults.reduce((acc, item) => acc + (item.visitors || 0), 0);
                    const totalClicks = filteredResults.reduce((acc, item) => acc + (item.clicks || 0), 0);
                    const totalBlockedClicks = filteredResults.reduce(
                        (acc, item) => acc + (item.blockedClicks || 0),
                        0
                    );
                    const totalFraudScore =
                        totalBlockedClicks === 0
                            ? 0
                            : filteredResults.reduce((acc, item) => {
                                  return (
                                      acc +
                                      Number(Utils.calcFraudScore(item.percentBlocked, 1) || "0") *
                                          (item.blockedClicks || 0)
                                  );
                              }, 0) / totalBlockedClicks;
                    const totalPerBlocked = totalClicks === 0 ? 0 : (totalBlockedClicks * 100) / totalClicks;

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
                                    item.connected_google_ads_customers_count !== "0",
                                metaToken: item.meta_ads_token,
                                ...(relatedResult || {}),
                            };
                        });

                    setDomainsSummary(summary);
                    setTotalSavings(totalSavings);
                    setTotalViews(
                        totalViews.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                        })
                    );
                    setTotalClicks(
                        totalClicks.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                        })
                    );
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
                    // Handle empty result
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
                        }));
                    setDomainsSummary(summary);
                    setTotalSavings(0);
                    setTotalViews(0);
                    setTotalClicks(0);
                    setTotalBlockedClicks(0);
                    setTotalPerBlocked(0);
                    setTotalFraudScore(0);
                }
            } catch (error) {
                console.error("Error in fetchData:", error);
                setErrors(error);
            } finally {
                setFetchingData(false);
            }
        },
        [accounts.data, auth.user, startDate, endDate, adType, fetchStats]
    );

    const fetchStats = useCallback(async (query) => {
        try {
            setFetchingStats(true);
            setStatsError({});
            const result = await Data.getStats(query);
            if (result && !result.errno && result.length) {
                setStats(result[0]);
            }
        } catch (error) {
            console.error("Error in fetchStats:", error);
            setStatsError(error);
        } finally {
            setFetchingStats(false);
        }
    }, []);

    const gotoDomainDashboard = useCallback(
        (sid) => {
            if (accounts.data?.domains) {
                setDomain(accounts.data.domains.find((domain) => domain.id === sid));
                navigate("/dashboard");
            }
        },
        [accounts.data, setDomain, navigate]
    );

    // Lấy conversion rates và currency
    const conversionRates = accounts.conversionRates || [];
    const currency = auth.user?.currency || "USD";
    const subscription = accounts.data ? Utils.getSingleSubscription(accounts, accounts.data.id) : null;

    // Render UI
    return (
        <div className={`${styles.content} ${styles.overviewContent}`}>
            <div className={styles.header}>
                <h1 className={styles.title}> Overview </h1>
            </div>
            <div className={styles.topFiltersWrap}>
                <AdSelector showAll={false} handleAdChange={(e, adType) => fetchData({}, adType)} />{" "}
                <DatesSelector handleDateChange={fetchData} />
            </div>
            {adType === "msclkid" && (
                <div className={styles.info}>
                    <div>
                        <img src={NoteIcon} alt="alert" />
                        IPs cannot be blocked automatically for Microsoft Ads.{" "}
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
            <div className={styles.overviewStatus}>
                <div className={`${styles.totalSavings} ${styles.statusBox}`}>
                    <div className={styles.statusHeading}> Estimated Savings</div>
                    <div className={styles.statusValue}>
                        {" "}
                        {isAnyDomainConnected
                            ? totalSavings &&
                              Utils.convertToCurrency(conversionRates, Number(totalSavings.toFixed(2)), currency)
                            : Utils.convertToCurrency(conversionRates, 0, currency)}{" "}
                    </div>
                </div>

                <div className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <div className={`${styles.statusBoxInner} ${styles.successBox}`}>
                        <div className={styles.iconBox}>
                            <img src={CheckIcon} alt="Check" />
                        </div>
                        <div className={styles.boxDetais}>
                            <div className={styles.statusHeading}> Clean</div>
                            {isAnyDomainConnected ? (
                                <div className={styles.statusValue}>
                                    {" "}
                                    {(stats.cleanClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.cleanClicks
                                        ? ((stats.cleanClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}{" "}
                                    %){" "}
                                </div>
                            ) : (
                                <div className={styles.statusValueDisabled}> Pending </div>
                            )}{" "}
                        </div>
                    </div>
                </div>

                <div className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <div className={`${styles.statusBoxInner} ${styles.warningBox}`}>
                        <div className={styles.iconBox}>
                            <img src={MinusIcon} alt="Minus" />
                        </div>
                        <div className={styles.boxDetais}>
                            <div className={styles.statusHeading}> Suspected</div>
                            {isAnyDomainConnected ? (
                                <div className={styles.statusValue}>
                                    {" "}
                                    {(stats.suspectedClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.suspectedClicks
                                        ? ((stats.suspectedClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}{" "}
                                    %){" "}
                                </div>
                            ) : (
                                <div className={styles.statusValueDisabled}> Pending </div>
                            )}{" "}
                        </div>
                    </div>
                </div>

                <div className={`${styles.statusGrid} ${styles.statusBox}`}>
                    <div className={`${styles.statusBoxInner} ${styles.dangerBox}`}>
                        <div className={styles.iconBox}>
                            <strong
                                style={{
                                    marginTop: "-2px",
                                }}
                            >
                                {" "}
                                !{" "}
                            </strong>
                        </div>
                        <div className={styles.boxDetais}>
                            <div className={styles.statusHeading}> Invalid</div>
                            {isAnyDomainConnected ? (
                                <div className={styles.statusValue}>
                                    {" "}
                                    {(stats.fraudClicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    (
                                    {stats.fraudClicks
                                        ? ((stats.fraudClicks * 100) / stats.clicks).toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}{" "}
                                    % ){" "}
                                </div>
                            ) : (
                                <div className={styles.statusValueDisabled}> Pending </div>
                            )}{" "}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.overviewDetails}>
                <div className={styles.overviewNetwork}>
                    <div className={styles.gridHeading}> Ad Network</div>
                    <div className={styles.detailBox}>
                        <div className={styles.progressStats}>
                            {" "}
                            {isAnyDomainConnected ? (
                                <>
                                    <div className={styles.progressRow}>
                                        <div className={styles.progressWrapper}>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                }}
                                            >
                                                <SucessLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.cleanClicks ? (stats.cleanClicks * 100) / stats.clicks : 0
                                                    }
                                                />{" "}
                                            </Box>
                                        </div>
                                        <div className={styles.boxDetais}>
                                            <div className={styles.statusHeading}> Clean</div>
                                            <div className={`${styles.statusValue} ${styles.successColor}`}>
                                                {" "}
                                                {stats.cleanClicks
                                                    ? ((stats.cleanClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}{" "}
                                                %
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.progressRow}>
                                        <div className={styles.progressWrapper}>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                }}
                                            >
                                                <WarningLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.suspectedClicks
                                                            ? (stats.suspectedClicks * 100) / stats.clicks
                                                            : 0
                                                    }
                                                />{" "}
                                            </Box>
                                        </div>
                                        <div className={styles.boxDetais}>
                                            <div className={styles.statusHeading}> Suspected</div>
                                            <div className={`${styles.statusValue} ${styles.warningColor}`}>
                                                {" "}
                                                {stats.suspectedClicks
                                                    ? ((stats.suspectedClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}{" "}
                                                %
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.progressRow}>
                                        <div className={styles.progressWrapper}>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                }}
                                            >
                                                <DangerLinearProgress
                                                    variant="determinate"
                                                    value={
                                                        stats.fraudClicks ? (stats.fraudClicks * 100) / stats.clicks : 0
                                                    }
                                                />{" "}
                                            </Box>
                                        </div>
                                        <div className={styles.boxDetais}>
                                            <div className={styles.statusHeading}> Invalid</div>
                                            <div className={`${styles.statusValue} ${styles.dangerColor}`}>
                                                {" "}
                                                {stats.fraudClicks
                                                    ? ((stats.fraudClicks * 100) / stats.clicks).toLocaleString(
                                                          "en-US",
                                                          {
                                                              maximumFractionDigits: 1,
                                                          }
                                                      )
                                                    : 0}{" "}
                                                %
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.noAdMess}>
                                    You have no data yet.Please connect your Google Ads account(s).{" "}
                                </div>
                            )}{" "}
                        </div>
                    </div>
                </div>

                <div className={styles.overviewType}>
                    <div className={styles.gridHeading}> Fraud Type</div>
                    <div className={styles.detailBox}>
                        <div className={styles.fraudList}>
                            <ul>
                                {" "}
                                {fraudTypes.map((type, index) => (
                                    <li key={index}>
                                        <span className={styles.listLabel}> {type.title} </span>{" "}
                                        <span
                                            className={styles.listValue}
                                            style={{
                                                color: isAnyDomainConnected ? type.color : "#CBCBCB",
                                            }}
                                        >
                                            {stats[type.key]
                                                ? ((stats[type.key] * 100) / (stats.fraudClicks || 1)).toFixed(1) // Avoid division by zero
                                                : 0}{" "}
                                            %
                                        </span>
                                    </li>
                                ))}{" "}
                            </ul>
                        </div>
                        <div className={styles.fraudGraph}>
                            <div className={styles.nodataGraph}>
                                {" "}
                                {isAnyDomainConnected ? (
                                    <PieChart
                                        lineWidth={15}
                                        paddingAngle={5}
                                        animate
                                        data={fraudTypes.map((type) => ({
                                            title: type.title,
                                            value: stats[type.key]
                                                ? (stats[type.key] * 100) / (stats.fraudClicks || 1)
                                                : 0, //Avoid division by zero
                                            color: type.color,
                                        }))}
                                    />
                                ) : (
                                    <>
                                        <img src={NoDataGraph} alt="No Data" />
                                        <span> No data yet </span>{" "}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={styles.fraudDevice}>
                            <div className={styles.fraudDeviceType}>
                                <div className={styles.fraudDeviceIcon}>
                                    <img src={MobileIcon} alt="Mobile" />
                                </div>
                                <div className={styles.fraudDeviceDetails}>
                                    <div className={styles.deviceName}> Mobile</div>
                                    <div className={styles.deviceValue}>
                                        {" "}
                                        {(stats.fraudClicksMobile || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.fraudDeviceType}>
                                <div className={styles.fraudDeviceIcon}>
                                    <img src={DeskIcon} alt="Desktop" />
                                </div>
                                <div className={styles.fraudDeviceDetails}>
                                    <div className={styles.deviceName}> Desktop</div>
                                    <div className={styles.deviceValue}>
                                        {" "}
                                        {(stats.fraudClicksDesktop || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.overviewTable}>
                <div className={styles.gridHeading}> Website Summary</div>
                <TableContainer>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell> Website Name </TableCell> <TableCell align="center"> Connection </TableCell>{" "}
                                <TableCell align="center"> Total Visits </TableCell>{" "}
                                <TableCell align="center"> Ad Clicks </TableCell>{" "}
                                <TableCell align="center"> Invalid(#) </TableCell>{" "}
                                <TableCell align="center"> Invalid( % ) </TableCell>{" "}
                                <TableCell align="center"> Fraud Score </TableCell>{" "}
                                <TableCell> Savings </TableCell>{" "}
                            </TableRow>{" "}
                        </TableHead>{" "}
                        <TableBody>
                            {" "}
                            {domainsSummary.map((row) => (
                                <TableRow
                                    key={row.sid}
                                    sx={{
                                        "&:last-child td, &:last-child th": {
                                            border: 0,
                                        },
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                gotoDomainDashboard(row.sid);
                                            }}
                                        >
                                            {" "}
                                            {row.domain}{" "}
                                        </a>{" "}
                                    </TableCell>{" "}
                                    <TableCell align="center" className={styles.secondTd}>
                                        {" "}
                                        {row.installed || row.metaToken ? (
                                            <span
                                                className={`${styles.adType} ${
                                                    !(row.installed && row.metaToken) ? styles.singleAd : ""
                                                }`}
                                            >
                                                {row.installed && <img src={GoogleAdsIcon} alt="google" />}{" "}
                                                {row.metaToken && <img src={MetaAdsIcon} alt="meta" />}{" "}
                                            </span>
                                        ) : (
                                            fraudNotConnect(row.sid, true)
                                        )}{" "}
                                    </TableCell>{" "}
                                    <TableCell align="center">
                                        {" "}
                                        {(row.visitors || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    </TableCell>{" "}
                                    <TableCell align="center" className={styles.thirdTd}>
                                        {" "}
                                        {(row.clicks || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    </TableCell>{" "}
                                    <TableCell align="center">
                                        {" "}
                                        {(row.blockedClicks || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    </TableCell>{" "}
                                    <TableCell align="center"> {`${(row.percentBlocked || 0).toFixed(1)}%`} </TableCell>{" "}
                                    <TableCell align="center">
                                        {" "}
                                        {Utils.calcFraudScore(row.percentBlocked, 1) || "0"}{" "}
                                    </TableCell>{" "}
                                    <TableCell align="left" className={styles.priceBold}>
                                        {" "}
                                        {row.savings
                                            ? Utils.convertToCurrency(
                                                  conversionRates,
                                                  Number(row.savings.toFixed(2)),
                                                  currency
                                              )
                                            : Utils.convertToCurrency(conversionRates, 0, currency)}{" "}
                                    </TableCell>{" "}
                                </TableRow>
                            ))}{" "}
                        </TableBody>{" "}
                        <TableFooter>
                            <TableRow>
                                <TableCell> </TableCell> <TableCell> </TableCell>{" "}
                                <TableCell align="center"> {totalViews} </TableCell>{" "}
                                <TableCell align="center"> {totalClicks} </TableCell>{" "}
                                <TableCell align="center"> {totalBlockedClicks} </TableCell>{" "}
                                <TableCell align="center"> {totalPerBlocked} % </TableCell>{" "}
                                <TableCell align="center"> {totalFraudScore} </TableCell>{" "}
                                <TableCell className={styles.priceBold}>
                                    {" "}
                                    {isAnyDomainConnected
                                        ? totalSavings &&
                                          Utils.convertToCurrency(
                                              conversionRates,
                                              Number(totalSavings.toFixed(2)),
                                              currency
                                          )
                                        : Utils.convertToCurrency(conversionRates, 0, currency)}{" "}
                                </TableCell>{" "}
                            </TableRow>{" "}
                        </TableFooter>{" "}
                    </Table>{" "}
                </TableContainer>
            </div>
            {subscription &&
                subscription.plan &&
                subscription.plan.metadata.domains !== "unlimited" &&
                accounts.data.domains.filter((item) => !item.is_deleted).length >= subscription.plan.metadata.domains &&
                (!subscription.metadata.domain ||
                    accounts.data.domains.filter((item) => !item.is_deleted).length >=
                        parseInt(subscription.metadata.domain, 10)) && (
                    <div className={styles.needMore}>
                        <Link
                            to="/account/billing/subscription"
                            state={{
                                showPlansPopup: true,
                            }}
                        >
                            Need more websites ? Upgrade{" "}
                        </Link>
                    </div>
                )}{" "}
            {accounts.data?.domains && accounts.data.domains.filter((item) => !item.is_deleted).length > 0 && (
                <div className={styles.deleteWebsite}>
                    <Link to="/account/billing/subscription"> Delete a website </Link>
                </div>
            )}{" "}
        </div>
    );
};

export default Overview;
