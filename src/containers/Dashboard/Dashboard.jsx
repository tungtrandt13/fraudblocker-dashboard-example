import React, { useCallback, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import AdSelector from "../../components/AdSelector/AdSelector";
import styles from "./Dashboard.module.scss";
import BlockedIPs from "../../assets/blocked-i-ps.svg";
import TotalSaved from "../../assets/total-saved.svg";
import FraudScore from "../../assets/fraud-score.svg";
import Data from "../../api/Data";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";
import OrganicVisitors from "../../assets/eye-view.svg";
import VisitorsAdvertising from "../../assets/visitors-ads.svg";
import FraudDetectionRate from "../../assets/fraud-detection.svg";
import AdsClickRate from "../../assets/ads-click.svg";
import Chart from "../../components/Chart/Chart";
import Input from "../../components/Input/Input";
import EMPTY_REPORT from "../../assets/empty2.svg";
import TOOLTIP from "../../assets/tooltip.svg";
import ANALYZING from "../../assets/analyze.svg";
import DatesSelector from "../DatesSelector/DatesSelector";
import NoteIcon from "../../assets/note-icon.png";

const { roundAmount } = Constants;

const customStyles = {
    totalSavedFeatured: {
        marginRight: 30,
        marginLeft: 30,
    },
    frontSubFeatured: {
        marginRight: 15,
    },
    middleSubFeatured: {
        marginRight: 15,
        marginLeft: 15,
    },
    endSubFeatured: {
        marginLeft: 15,
    },
    cpcContainer: {
        display: "inline-block",
        width: "85px",
        padding: "12px 0 20px",
        position: "static",
    },
    cpcInput: {
        width: "50px",
        borderRadius: "0px",
        padding: "2px 6px",
    },
    cpcLabel: {
        fontSize: "14px",
        color: "#4a4a4a",
    },
    cpcError: {
        position: "absolute",
        bottom: "28px",
    },
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
    invalidTrafficRate: 0,
};

const Dashboard = () => {
    const [blockedIPsState, setBlockedIPsState] = useState({
        total: 1253,
        image: BlockedIPs,
    });
    const [totalSavedState, setTotalSavedState] = useState({
        total: 950,
        image: TotalSaved,
    });
    const [fraudScoreState, setFraudScoreState] = useState({
        total: 4.6,
        image: FraudScore,
    });
    const [fetchingOrganic, setFetchingOrganic] = useState(true);
    const [fetchingSummary, setFetchingSummary] = useState(true);
    const [fetchingChart, setFetchingChart] = useState(true);
    const [adType, setAdType] = useState("gclid");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [errors, setErrors] = useState({});
    const [chartErrors, setChartErrors] = useState({});
    const [organicStats, setOrganicStats] = useState({});
    const [summary, setSummary] = useState(DEFAULT_SUMMARY);
    const [chart, setChart] = useState([]);
    const [cpc, setCpc] = useState(2);
    const [editing, setEditing] = useState(false);

    const activeDomain = useSelector((state) => state.activeDomain);
    const accounts = useSelector((state) => state.accounts);
    const auth = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const fetchData = useCallback(
        async (body) => {
            try {
                if (!activeDomain || !activeDomain.data || !activeDomain.data.id) {
                    return;
                }

                const timezone = auth.user?.timezone;
                setStartDate(body.startDate || startDate);
                setEndDate(body.endDate || endDate);
                setAdType(body.adType || adType);

                const query = {
                    startDate: moment(body.startDate || startDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    endDate: moment(body.endDate || endDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    sid: activeDomain.data.id,
                    isAggressive: activeDomain.data.aggressive_blocking,
                    timezone: Utils.sanitizeTimezoneString(timezone || "(GMT-07:00) America/Los_Angeles"),
                    adType: (body.adType || adType) === "all" ? undefined : body.adType || adType,
                };

                setFetchingOrganic(true);
                setFetchingSummary(true);
                setFetchingChart(true);

                console.log("fetching data");
                fetchOrganicStats(query);
                fetchDashboardSummary(query);
                fetchChartData(query);
            } catch (error) {
                console.error(error);
                setErrors(error);
            }
        },
        [activeDomain, auth, startDate, endDate, adType]
    );

    const fetchOrganicStats = useCallback(async (query) => {
        try {
            const organicStatsResult = await Data.getOrganicStats(query);
            if (organicStatsResult && !organicStatsResult.errno && organicStatsResult.length) {
                setOrganicStats(organicStatsResult[0]);
            } else {
                setOrganicStats({});
            }
        } catch (error) {
            console.error("Error fetching organic stats:", error);
            setErrors(error);
        } finally {
            setFetchingOrganic(false);
        }
    }, []);

    const fetchDashboardSummary = useCallback(async (query) => {
        try {
            console.log("fetch dashboard summary");
            const result = await Data.getDashboardSummary(query);
            if (result && !result.errno && result.length) {
                setSummary(result[0]);
                setErrors({});
            } else {
                setSummary(DEFAULT_SUMMARY);
                setErrors({});
            }
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            setErrors(error);
        } finally {
            setFetchingSummary(false);
        }
    }, []);

    const fetchChartData = useCallback(async (query) => {
        try {
            const result = await Data.getDashboardChart(query);
            if (result && !result.errno && result.length) {
                prepareChartData(result);
                console.log("prepareChartData", result);
            } else {
                setChart([]);
                setChartErrors({});
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
            setChartErrors(error);
        } finally {
            setFetchingChart(false);
        }
    }, []);

    console.log("chart", chart);

    const prepareChartData = useCallback((data) => {
        const chartData = data.map((item) => ({
            name: moment(item.date.value, "YYYY-MM-DD").format("MMM DD"),
            uv: item.visitorsFromAds ? item.visitorsFromAds : 0,
            pv: item.blockedIPsFromAds ? item.blockedIPsFromAds : 0,
        }));

        console.log("chartData", chartData);
        setChart(chartData);
        setChartErrors({});
    }, []);

    useEffect(() => {
        fetchData({
            startDate: localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD"),
            endDate: localStorage.getItem("end_date") || moment().format("YYYYMMDD"),
        });

        const conversionRates = accounts ? accounts.conversionRates : [];
        setCpc(
            roundAmount(
                Utils.convertToCurrencyNumeric(conversionRates, activeDomain.data?.cpc || 2, auth.user?.currency, true)
            )
        );
    }, [fetchData, accounts, auth, activeDomain.data?.cpc]);

    useEffect(() => {
        console.log("hi", activeDomain, activeDomain.data, activeDomain.data.id);
        if (activeDomain && activeDomain.data && activeDomain.data.id) {
            fetchData({
                startDate: localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD"),
                endDate: localStorage.getItem("end_date") || moment().format("YYYYMMDD"),
            });
            const conversionRates = accounts ? accounts.conversionRates : [];
            setCpc(
                roundAmount(
                    Utils.convertToCurrencyNumeric(
                        conversionRates,
                        activeDomain.data.cpc || 2,
                        auth.user?.currency,
                        true
                    )
                )
            );
        }
    }, [activeDomain, fetchData, accounts, auth]);

    const isValidCPC = useCallback((currentCpc) => {
        return (currentCpc || currentCpc === 0 || currentCpc === "0") && !Number.isNaN(currentCpc);
    }, []);

    const enableEdit = useCallback(async () => {
        if (editing) {
            if (isValidCPC(cpc)) {
                const conversionRates = accounts ? accounts.conversionRates : [];
                await Data.updateDomain(activeDomain.data.id, {
                    id: activeDomain.data.id,
                    cpc: parseFloat(Utils.convertToUSD(conversionRates, cpc, auth.user?.currency, true)),
                });

                setEditing(false);
            }
        } else {
            setEditing(true);
        }
    }, [editing, cpc, isValidCPC, accounts, auth, activeDomain.data]);

    const handleCPC = useCallback((evt) => {
        setCpc(evt.target.value);
    }, []);

    const connected = activeDomain && activeDomain.data && !!activeDomain.data.google_ads_token;
    const currency = auth.user && auth.user.currency ? auth.user.currency : "USD";
    const conversionRates = accounts ? accounts.conversionRates : [];

    return (
        <div className={styles.wrapper}>
            <Tooltip id="blockedIps" className={styles.tooltipContent}>
                <div>
                    This represents the clicks from your advertising campaigns that were determined to be invalid, or
                    fraudulent, based on our scoring criteria.
                </div>
            </Tooltip>
            <Tooltip
                id="totalSaved"
                effect="solid"
                delayHide={500}
                delayUpdate={500}
                multiline={true}
                className={styles.tooltipContent}
            >
                <div>
                    This is your estimated savings during the period you selected based on the percent of invalid, or
                    fraudulent, traffic we detected.{" "}
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
                    <h1 className={styles.title}> Dashboard </h1>
                </div>
                <div className={styles.topFiltersWrap}>
                    <AdSelector showAll={false} handleAdChange={fetchData} />
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
                {!fetchingSummary ? (
                    <div className={styles.featuredContainer}>
                        <div className={styles.featured}>
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img className={styles.smallFeatureIcon} src={blockedIPsState.image} alt="" />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}>
                                        Invalid Clicks{" "}
                                        <a data-tooltip-id="blockedIps">
                                            <img className={styles.tooltip} src={TOOLTIP} alt="" />
                                        </a>
                                    </p>
                                    <p className={styles.featuredTotal}>
                                        {(summary.blockedClicks || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}
                                    </p>
                                    <p> {summary.percentBlocked || 0} % of ad visitors </p>
                                    <p>
                                        <Link className={styles.link} to="/stats">
                                            View Score Details
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={customStyles.totalSavedFeatured} className={styles.featured}>
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img src={totalSavedState.image} alt="" />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}>
                                        {editing ? "Edit CPC Cost" : "Estimated Savings"}
                                        {!editing && (
                                            <a data-tooltip-id="totalSaved">
                                                <img className={styles.tooltip} src={TOOLTIP} alt="" />
                                            </a>
                                        )}
                                    </p>
                                    {!editing && (
                                        <p className={styles.featuredTotal}>
                                            {Utils.convertToCurrency(
                                                conversionRates,
                                                Math.round(
                                                    Utils.calculateSavedAmount(
                                                        summary.clicks,
                                                        summary.percentBlocked,
                                                        activeDomain.data?.cpc || 2
                                                    )
                                                ),
                                                currency
                                            )}
                                        </p>
                                    )}
                                    {!editing && (
                                        <p>
                                            Based on{" "}
                                            {Utils.convertToCurrency(
                                                conversionRates,
                                                activeDomain.data?.cpc || 2,
                                                currency,
                                                true,
                                                true
                                            )}{" "}
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
                                                error={!isValidCPC(cpc) ? "Enter a numeric value" : ""}
                                                errorStyle={customStyles.cpcError}
                                            />
                                            <span style={customStyles.cpcLabel}> CPC Cost </span>
                                        </>
                                    )}
                                    <div className={styles.cpcCurrencyWrap}>
                                        <p className={styles.link} onClick={enableEdit}>
                                            {editing ? "Save CPC value" : "Edit CPC value"}
                                        </p>
                                        <p className={styles.link}>
                                            <Link to="/account/settings/edit-profile"> Change currency </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.featured}>
                            <div className={styles.featuredInner}>
                                <div className={styles.featureIcon}>
                                    <img src={fraudScoreState.image} alt="" />
                                </div>
                                <div className={styles.featuredDescriptions}>
                                    <p className={styles.featuredTitle}> Fraud Score </p>
                                    <p className={styles.featuredTotal}>
                                        {Utils.calcFraudScore(summary.percentBlocked, 1)}
                                    </p>
                                    <p> Out of 10 </p>
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
                    <div className={styles.chartContainer}>
                        <div className={styles.legendContainer}>
                            <div className={styles.legend}>
                                <div className={styles.blockedIPsMask} />
                                <p className={styles.legendText}> Invalid Clicks </p>
                            </div>
                            <div className={styles.legend}>
                                <div className={styles.visitorsFromAdsMask} />
                                <p className={styles.legendText}> Visits From Ads </p>
                            </div>
                        </div>
                        {chart && chart.length && chart.some((item) => item.uv || item.pv) ? (
                            <Chart data={chart} />
                        ) : !summary.clicks && connected ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "rgba(0,0,0,0.5)",
                                }}
                            >
                                <img src={ANALYZING} alt="" />
                                {adType === "msclkid" ? (
                                    <div
                                        style={{
                                            marginTop: "20px",
                                            color: "#a7b3c0",
                                            fontSize: "16px",
                                        }}
                                    >
                                        We do not currently detect any visitors to your website from Microsoft Ads.
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            marginTop: "20px",
                                            color: "#a7b3c0",
                                            fontSize: "16px",
                                        }}
                                    >
                                        Your Google Ads account is connected and we are analyzing your data. <br />
                                        Come back soon.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "rgba(0,0,0,0.5)",
                                }}
                            >
                                <img src={EMPTY_REPORT} alt="" />
                                <div
                                    style={{
                                        marginTop: "20px",
                                        color: "#a7b3c0",
                                        fontSize: "16px",
                                    }}
                                >
                                    No traffic from advertising detected. <br />
                                    <Link
                                        style={{
                                            color: "#a7b3c0",
                                            fontSize: "16px",
                                        }}
                                        onClick={() => {
                                            navigate("/integrations");
                                        }}
                                        to="/integrations"
                                    >
                                        Verify your Fraud Tracker installation.
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.chartLoading} />
                )}
                {!fetchingOrganic && !fetchingSummary ? (
                    <div className={styles.featuredContainer}>
                        <div style={customStyles.frontSubFeatured} className={styles.subFeatured}>
                            <img src={OrganicVisitors} alt="" />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {(organicStats.allViews || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                                </p>
                                <p> Total Visitors </p>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div style={customStyles.middleSubFeatured} className={styles.subFeatured}>
                            <img src={VisitorsAdvertising ?? ""} alt="" />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {(summary.clicks || 0).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                                </p>
                                <p> Visits From Ads </p>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div style={customStyles.middleSubFeatured} className={styles.subFeatured}>
                            <img src={FraudDetectionRate} alt="" />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {organicStats.allViews
                                        ? roundAmount((summary.clicks * 100) / organicStats.allViews, 1)
                                        : 0}{" "}
                                    %
                                </p>
                                <p> Fraud Detection Rate </p>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div style={customStyles.endSubFeatured} className={styles.subFeatured}>
                            <img src={AdsClickRate} alt="" />
                            <div className={styles.subFeaturedDescriptions}>
                                <p className={styles.subFeaturedTotal}>
                                    {summary.percentBlocked
                                        ? summary.percentBlocked.toLocaleString("en-US", {
                                              maximumFractionDigits: 1,
                                          })
                                        : 0}{" "}
                                    %
                                </p>
                                <p> Ads Click Rate </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.featuredContainer}>
                        <div className={styles.statsLoading}>
                            <div className={styles.stats4} />
                            <div className={styles.stats5} />
                            <div className={styles.stats6} />
                            <div className={styles.stats7} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
