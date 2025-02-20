import React, { useState, useEffect } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
// import { JsonToCsv } from 'react-json-csv';  // Keep commented out unless you use it
import styles from "./Advertising.module.scss";
import ReportsTableNew, { getPrimaryFraudType, getStatus } from "../ResultTable/ReportsTableNew";
import AdSelector from "../../components/AdSelector/AdSelector";
import Data from "../../api/Data";
import Utils from "../../utils/Utils";
import DatesSelector from "../DatesSelector/DatesSelector";
import GoogleAds from "../../api/GoogleAds";
import IPBlockList from "../../redux/actions/IpBlockList";
// import { ReactComponent as DownloadIcon } from '../../assets/download.svg'; // Keep commented out unless you use it
import NoteIcon from "../../assets/note-icon.png";

const Advertising = ({ auth, accounts, ipBlocklist, ipWhitelist, fetchLatestBlocklist, activeDomain }) => {
    const [records, setRecords] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);
    const [errors, setErrors] = useState({});
    const [startDate, setStartDate] = useState(null);
    const [adType, setAdType] = useState("all");
    const [endDate, setEndDate] = useState(null);
    const [csv, setCsv] = useState({
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
    });

    // --- Helper Function (inside the component) ---
    const setCSVData = (data) => {
        const listedIPs = ipBlocklist.concat(ipWhitelist);
        const formatted = data.map((item) => ({
            ...item,
            lastSeen: item.lastSeen.value,
            primaryFraudType: getPrimaryFraudType(item),
            status: getStatus(
                listedIPs.find((ip) => ip.address.includes(item.ip)),
                item.riskScore
            ),
        }));
        setCsv((prevCsv) => ({ ...prevCsv, data: formatted })); // Use functional update
    };

    // --- useEffect for Initial Data Fetch (componentDidMount) ---
    useEffect(() => {
        const fetchDataWrapper = async () => {
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
                // Error handling is already done within fetchData and fetchBlockedIPs
            } finally {
                setFetchingData(false); // Set fetchingData to false regardless of success/failure
            }
        };

        fetchDataWrapper();
    }, [ipBlocklist.length, ipWhitelist.length, fetchLatestBlocklist, activeDomain]); // Add dependencies.  Crucial for correct behavior!

    // -- useEffect for Domain Change (componentDidUpdate)
    useEffect(() => {
        const fetchDataOnDomainChange = async () => {
            if (activeDomain && activeDomain.data && activeDomain.data.id) {
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
                    setFetchingData(false);
                } catch (error) {
                    setFetchingData(false);
                }
            }
        };
        fetchDataOnDomainChange();
    }, [activeDomain, fetchLatestBlocklist, ipBlocklist.length, ipWhitelist.length]); //Correct dependencies!

    // --- fetchData Function ---
    const fetchData = async (body) => {
        if (!activeDomain || !activeDomain.data || !activeDomain.data.id) {
            return;
        }

        try {
            setFetchingData(true);
            setStartDate(body.startDate || startDate); // Update state correctly
            setEndDate(body.endDate || endDate); // Update state correctly
            setAdType(body.adType || adType); // Update state correctly

            const { timezone } = auth.user;
            const result = await Data.getReports({
                startDate: moment(body.startDate || startDate, "YYYYMMDD").format("YYYY-MM-DD"),
                endDate: moment(body.endDate || endDate, "YYYYMMDD").format("YYYY-MM-DD"),
                sid: activeDomain.data.id,
                isAggressive: activeDomain.data.aggressive_blocking,
                timezone: Utils.sanitizeTimezoneString(timezone || "(GMT-07:00) America/Los_Angeles"),
                adType: (body.adType || adType) === "all" ? undefined : body.adType || adType,
            });

            if (result && !result.errno) {
                const indexedResult = result.map((item, index) => ({
                    ...item,
                    index,
                }));
                const parsedResults = Utils.formatTimeAndAddRowIdInReports(
                    indexedResult,
                    timezone || "(GMT-07:00) America/Los_Angeles"
                );
                setRecords(parsedResults);
                setErrors({});
                setCSVData(parsedResults);
            } else {
                setRecords([]);
                setErrors({});
                setCSVData([]);
            }
        } catch (error) {
            console.error(error); // Use console.error for errors
            setErrors(error);
        } finally {
            setFetchingData(false); // Always set fetchingData to false after the request
        }
    };

    // --- fetchBlockedIPs Function ---
    const fetchBlockedIPs = async () => {
        if (!activeDomain || !activeDomain.data || !activeDomain.data.id) {
            return;
        }
        try {
            await fetchLatestBlocklist(activeDomain.data.id);
        } catch (error) {
            console.error(error);
            // Don't re-throw the error here.  Handle it gracefully.
        }
    };

    // --- onStatusChange Function ---
    const onStatusChange = async (index, currentStatus) => {
        const record = records[index];
        if (!record) return; // Check if record is valid

        const listedIp = ipBlocklist.find((ipBlock) => ipBlock.address.includes(record.ip));
        const listedWhite = ipWhitelist.find((ipBlock) => ipBlock.address.includes(record.ip));

        try {
            if (currentStatus === "Auto Blocked") {
                await autoBlockIp(record.ip, false);
            } else if (currentStatus === "Unblocked" && !listedWhite) {
                await autoBlockIp(record.ip, true);
            } else if (currentStatus === "Unblocked" && listedWhite) {
                await removeIPFromBlockList(record.ip, false);
                await autoBlockIp(record.ip, true);
            } else if (!listedIp) {
                await autoBlockIp(record.ip, true);
            } else {
                await removeIPFromBlockList(record.ip, true);
            }
        } catch (error) {
            console.error("Error in onStatusChange", error);
        }
    };

    // --- autoBlockIp Function ---
    const autoBlockIp = async (ipAddress, isBlocked = true) => {
        if (
            !accounts ||
            !accounts.data ||
            !accounts.data.id ||
            !activeDomain ||
            !activeDomain.data ||
            !activeDomain.data.id
        ) {
            return; // Early exit if required data is missing.
        }
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
            await fetchBlockedIPs(); // Await here, crucial for correct state updates
        } catch (error) {
            console.error(error);
        }
    };

    // --- removeIPFromBlockList Function ---
    const removeIPFromBlockList = async (ipAddress, isBlocked) => {
        try {
            let selectedIp = null;
            if (isBlocked) {
                selectedIp = ipBlocklist.find((ipBlock) => ipBlock.address === ipAddress);
            } else {
                selectedIp = ipWhitelist.find((ipBlock) => ipBlock.address === ipAddress);
            }
            if (!selectedIp) {
                console.warn(`IP address ${ipAddress} not found in ${isBlocked ? "blocklist" : "whitelist"}`);
                return; // Exit if IP is not found.
            }

            await GoogleAds.removeIpFromBlocklist({
                ids: [selectedIp.id],
            });
            await fetchBlockedIPs(); // Await here.  VERY important!
        } catch (error) {
            console.error(error);
        }
    };

    const downloadResults = () => {}; // Empty function, as in the original.

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <h1 className={styles.title}> Reports </h1>{" "}
            </div>{" "}
            <div className={styles.topFiltersWrap}>
                <AdSelector showAll={true} handleAdChange={fetchData} />{" "}
                <DatesSelector handleDateChange={fetchData} />{" "}
            </div>{" "}
            <div className={styles.info}>
                <div> This report shows the activity for each of the IPs visiting your website. </div>{" "}
                <div>
                    <img src={NoteIcon} alt="alert" />
                    IPs from sources other than Google Ads and Meta Ads <strong> are not </strong> Auto Blocked or
                    counted towards your <Link to="/stats"> Fraud Score </Link>.{" "}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://help.fraudblocker.com/en/articles/6732598-how-is-my-fraud-score-calculated"
                    >
                        Learn More{" "}
                    </a>
                    .{" "}
                </div>{" "}
            </div>
            {fetchingData ? (
                <div className={styles.detailsContainer}>
                    <div className={styles.tableStatsLoading}>
                        <div className={styles.numbers}>
                            <div className={styles.results} /> <div className={styles.downloads} />{" "}
                        </div>{" "}
                        <div className={styles.table} /> <div className={styles.footer} />{" "}
                    </div>{" "}
                </div>
            ) : (
                <div className={styles.detailsContainer}>
                    <div className={styles.detailsContainerHeader}>
                        <p className={styles.containerTitle}> Details </p>{" "}
                        {/* Conditional rendering for JsonToCsv (if you use it) */}{" "}
                    </div>
                    <ReportsTableNew
                        results={records || []}
                        loading={fetchingData}
                        ipBlocklist={ipBlocklist.concat(ipWhitelist)}
                        maxHeight={700}
                        onStatusChange={onStatusChange}
                        accounts={accounts}
                        activeDomain={activeDomain}
                    />{" "}
                </div>
            )}{" "}
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

const mapStateToProps = (state) => ({
    auth: state.auth,
    accounts: state.accounts,
    activeDomain: state.activeDomain,
    ipBlocklist: state.ipBlocklist.data,
    ipWhitelist: state.ipBlocklist.whiteIPs,
});

const mapDispatchToProps = (dispatch) => {
    return {
        fetchLatestBlocklist: (accountId) => dispatch(IPBlockList.fetchLatestBlocklist(accountId)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Advertising);
