import React, { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import styles from "./Advertising.module.scss";
import ReportsTableNew, { getPrimaryFraudType, getStatus } from "../ResultTable/ReportsTableNew";
import AdSelector from "../../components/AdSelector/AdSelector";
import Data from "../../api/Data";
import Utils from "../../utils/Utils";
import DatesSelector from "../DatesSelector/DatesSelector";
import GoogleAds from "../../api/GoogleAds";
import IPBlockList from "../../redux/actions/IpBlockList";
import NoteIcon from "../../assets/note-icon.png";

const Advertising = () => {
    const [state, setState] = useState({
        records: [],
        fetchingData: true,
        errors: {},
        startDate: null,
        adType: "all",
        endDate: null,
        csv: {
            fields: {
                ip: "IP Address",
                status: "Status",
                riskScore: "Fraud Score",
                primaryFraudType: "Primary Fraud Type",
                trafficSource: "Traffic Source",
                lastSeen: "Last Seen",
                firstClicks: "First Click",
                lastClicks: "Last Click",
                clicks: "Total Clicks",
                country: "Country",
                os: "Operating System",
                device: "Device",
                gclid: "Click ID",
            },
            data: [],
        },
    });

    const activeDomain = useSelector((state) => state.activeDomain);
    const auth = useSelector((state) => state.auth);
    const accounts = useSelector((state) => state.accounts);
    const ipBlocklist = useSelector((state) => state.ipBlocklist.data);
    const ipWhitelist = useSelector((state) => state.ipBlocklist.whiteIPs);
    const dispatch = useDispatch();

    // Thay componentDidMount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await fetchData({
                    startDate: localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD"),
                    endDate: localStorage.getItem("end_date") || moment().format("YYYYMMDD"),
                });
                if (ipBlocklist.length === 0 || ipWhitelist.length === 0) {
                    await fetchBlockedIPs();
                }
                setState((prev) => ({ ...prev, fetchingData: false }));
            } catch (error) {
                setState((prev) => ({ ...prev, fetchingData: false }));
            }
        };
        fetchInitialData();
    }, [ipBlocklist.length, ipWhitelist.length]); // Dependency array dựa trên length để kiểm tra khi blocklist/whitelist thay đổi

    // Thay componentDidUpdate
    useEffect(() => {
        const fetchUpdatedData = async () => {
            if (activeDomain && activeDomain.data && activeDomain.data.id) {
                try {
                    await fetchData({
                        startDate:
                            localStorage.getItem("start_date") || moment().subtract(3, "days").format("YYYYMMDD"),
                        endDate: localStorage.getItem("end_date") || moment().format("YYYYMMDD"),
                    });
                    if (ipBlocklist.length === 0 || ipWhitelist.length === 0) {
                        await fetchBlockedIPs();
                    }
                    setState((prev) => ({ ...prev, fetchingData: false }));
                } catch (error) {
                    setState((prev) => ({ ...prev, fetchingData: false }));
                }
            }
        };

        fetchUpdatedData();
    }, [activeDomain?.data?.id, ipBlocklist.length, ipWhitelist.length]); // Dependency array dựa trên activeDomain.data.id

    const setCSVData = (data) => {
        const formatted = [];
        const listedIPs = ipBlocklist.concat(ipWhitelist);
        for (let i = 0; i < data.length; i += 1) {
            const item = data[i];
            formatted.push({
                ...item,
                lastSeen: item.lastSeen.value,
                primaryFraudType: getPrimaryFraudType(item),
                status: getStatus(
                    listedIPs.find((ip) => ip.address.includes(item.ip)),
                    item.riskScore
                ),
            });
        }
        setState((prev) => ({
            ...prev,
            csv: { ...prev.csv, data: formatted },
        }));
    };

    const fetchData = useCallback(
        async (body) => {
            try {
                if (!activeDomain || !activeDomain.data || !activeDomain.data.id) {
                    return;
                }
                const { timezone } = auth.user;
                setState((prev) => ({
                    ...prev,
                    fetchingData: true,
                    startDate: body.startDate || prev.startDate,
                    endDate: body.endDate || prev.endDate,
                    adType: body.adType || prev.adType,
                }));
                const result = await Data.getReports({
                    startDate: moment(body.startDate || state.startDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    endDate: moment(body.endDate || state.endDate, "YYYYMMDD").format("YYYY-MM-DD"),
                    sid: activeDomain.data.id,
                    isAggressive: activeDomain.data.aggressive_blocking,
                    timezone: Utils.sanitizeTimezoneString(timezone || "(GMT-07:00) America/Los_Angeles"),
                    adType: (body.adType || state.adType) === "all" ? undefined : body.adType || state.adType,
                });
                if (result && !result.errno) {
                    if (result.length) {
                        for (let i = 0; i < result.length; i += 1) {
                            result[i].index = i;
                        }
                    }
                    const parsedResults = Utils.formatTimeAndAddRowIdInReports(
                        result,
                        timezone || "(GMT-07:00) America/Los_Angeles"
                    );
                    setState((prev) => ({
                        ...prev,
                        records: parsedResults,
                        errors: {},
                    }));
                    setCSVData(parsedResults);
                } else {
                    setState((prev) => ({
                        ...prev,
                        records: [],
                        errors: {},
                    }));
                    setCSVData([]);
                }
                setState((prev) => ({ ...prev, fetchingData: false }));
            } catch (error) {
                console.log(error);
                setState((prev) => ({
                    ...prev,
                    errors: error,
                    fetchingData: false,
                }));
            }
        },
        [activeDomain, auth.user, state.startDate, state.endDate, state.adType]
    );

    const fetchBlockedIPs = useCallback(async () => {
        if (!activeDomain || !activeDomain.data || !activeDomain.data.id) {
            return;
        }
        try {
            await dispatch(IPBlockList.fetchLatestBlocklist(activeDomain.data.id));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }, [activeDomain, dispatch]);

    const onStatusChange = useCallback(
        async (index, currentStatus) => {
            const { records } = state;
            const listedIp = ipBlocklist.find((ipBlock) => ipBlock.address.includes(records[index].ip));
            const listedWhite = ipWhitelist.find((ipBlock) => ipBlock.address.includes(records[index].ip));

            if (currentStatus === "Auto Blocked") {
                await autoBlockIp(records[index].ip, false);
            } else if (currentStatus === "Unblocked" && !listedWhite) {
                await autoBlockIp(records[index].ip, true);
            } else if (currentStatus === "Unblocked" && listedWhite) {
                await removeIPFromBlockList(records[index].ip, false);
                await autoBlockIp(records[index].ip, true);
            } else if (!listedIp) {
                await autoBlockIp(records[index].ip, true);
            } else {
                await removeIPFromBlockList(records[index].ip, true);
            }
        },
        [state.records, ipBlocklist, ipWhitelist]
    );

    const autoBlockIp = useCallback(
        async (ipAddress, isBlocked = true) => {
            const { accounts } = useSelector((state) => state.accounts);
            try {
                const data = {
                    account_id: accounts.data.id,
                    address: ipAddress,
                    is_blocked: isBlocked,
                    domain_id: activeDomain.data.id,
                };
                await GoogleAds.addIpToBlocklist({
                    ips: [data],
                });
                await fetchBlockedIPs();
            } catch (error) {
                console.log(error);
            }
        },
        [activeDomain, fetchBlockedIPs]
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
                await GoogleAds.removeIpFromBlocklist({
                    ids: [selectedIp.id],
                });
                await fetchBlockedIPs();
            } catch (error) {
                console.log(error);
            }
        },
        [ipBlocklist, ipWhitelist, fetchBlockedIPs]
    );

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <h1 className={styles.title}> Reports </h1>
            </div>
            <div className={styles.topFiltersWrap}>
                <AdSelector showAll={true} handleAdChange={fetchData} />
                <DatesSelector handleDateChange={fetchData} />
            </div>
            <div className={styles.info}>
                <div> This report shows the activity for each of the IPs visiting your website. </div>
                <div>
                    <img src={NoteIcon} alt="alert" />
                    IPs from sources other than Google Ads and Meta Ads <strong> are not </strong> Auto Blocked or
                    counted towards your <Link to="/stats"> Fraud Score </Link>.{" "}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://help.fraudblocker.com/en/articles/6732598-how-is-my-fraud-score-calculated"
                    >
                        Learn More
                    </a>
                    .
                </div>
            </div>

            {state.fetchingData ? (
                <div className={styles.detailsContainer}>
                    <div className={styles.tableStatsLoading}>
                        <div className={styles.numbers}>
                            <div className={styles.results} />
                            <div className={styles.downloads} />
                        </div>
                        <div className={styles.table} />
                        <div className={styles.footer} />
                    </div>
                </div>
            ) : (
                <div className={styles.detailsContainer}>
                    <div className={styles.detailsContainerHeader}>
                        <p className={styles.containerTitle}> Details </p>
                        {/* {auth.user.role !== 'Viewer' && (
              <JsonToCsv
                data={state.csv.data}
                filename="reports"
                fields={state.csv.fields}
                style={{ background: 'none', border: 'none' }}
                text={
                  <div className={styles.download}>
                    <DownloadIcon className={styles.downloadIcon} />
                    Download Results
                  </div>
                }
              />
            )} */}
                    </div>

                    <ReportsTableNew
                        results={state.records || []}
                        loading={state.fetchingData}
                        ipBlocklist={ipBlocklist.concat(ipWhitelist)}
                        maxHeight={700}
                        onStatusChange={onStatusChange}
                        accounts={accounts}
                        activeDomain={activeDomain}
                    />
                </div>
            )}
        </div>
    );
};

Advertising.propTypes = {
    auth: PropTypes.object,
    accounts: PropTypes.object,
    ipBlocklist: PropTypes.array,
    ipWhitelist: PropTypes.array,
    fetchLatestBlocklist: PropTypes.func,
    activeDomain: PropTypes.object,
};

export default Advertising;
