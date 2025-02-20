import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { Tooltip } from "react-tooltip";
import PropTypes from "prop-types";
import {
    DataGridPremium,
    getGridStringOperators,
    getGridNumericOperators,
    GridToolbarContainer,
    GridToolbarExport,
} from "@mui/x-data-grid-premium";
import styles from "./ResultTable.module.scss";
import Utils from "../../utils/Utils";
import Switch from "../../components/Switch/Switch";
import { GridDropdownFilter } from "./FilterSelect";
import EMPTY_REPORT from "../../assets/empty1.svg";
import DRIVE_ICON from "../../assets/drive_icon.svg";
import MICROSOFT_ICON from "../../assets/microsoft-ads-icon.png";
import META_ICON from "../../assets/meta-new.svg";
import LINK_ICON from "../../assets/pop-out-arrow.svg";
import NO_ICON from "../../assets/no.svg";
import YES_ICON from "../../assets/yes.svg";
import { ReactComponent as TooltipIcon } from "../../assets/tooltip.svg";
import IpPopup from "./IpPopup";

// const sampleCountryList = ['Russia', 'US', 'UK', 'Mexico', 'Canada', 'Other'];
// const sampleOSList = ['iOS', 'Android', 'Windows', 'Mac OS', 'Linux'];

// const sampleDeviceList = ['Desktop', 'Mobile', 'Tablet'];

// const fraudScoreOptions = [
//   {
//     label: 'Low (1-3)',
//     value: '1-3'
//   },
//   {
//     label: 'Medium (4-6)',
//     value: '4-6'
//   },
//   {
//     label: 'High (7+)',
//     value: '7-10000'
//   }
// ];

const statusOptions = [
    {
        label: "Auto Blocked",
        value: "Auto Blocked",
    },
    {
        label: "Manual Block",
        value: "Manual Block",
    },
    {
        label: "Unblocked",
        value: "Unblocked",
    },
];

const fraudTypeOptions = [
    "Accidental Clicks",
    {
        label: "Blacklist or Abusive IPs",
        value: "Blacklist",
    },
    "Converted",
    "Excessive Clicks",
    "Exclusion List",
    "Geo-Blocked",
    "Googlebot",
    "Tor",
    "Poor IP History",
    "Risky Device",
    "Risky Geo",
    "Valid User",
    "Very High Risk",
    "VPN / Datacenter",
];

const fraudTypeMapping = {
    fastClickersRiskPoints: "Excessive Clicks",
    historicalClicksRiskPoints: "Poor IP History",
    dcRiskPoints: "VPN / Datacenter",
    geoRiskPoints: "Risky Geo",
    accidentalClicksRiskPoints: "Accidental Clicks",
    headlessBrowserRiskPoints: "Very High Risk",
    deviceRiskPoints: "Risky Device",
    abuseHighRiskPoints: "Poor IP History",
};

const trafficOptions = [
    {
        label: "Google Ads",
        value: "Google",
    },
    {
        label: "Microsoft Ads",
        value: "Bing",
    },
    {
        label: "Meta Ads",
        value: "Facebook",
    },
    {
        label: "Other",
        value: "Other",
    },
];

export const getPrimaryFraudType = (row, ipBlocklist, activeDomain) => {
    const listedIp = ipBlocklist && ipBlocklist.find((ip) => ip.address.includes(row.ip));
    const checked = listedIp && listedIp.is_blocked;
    if (checked) return "Blacklist";

    if (
        activeDomain &&
        ((activeDomain.data.blocked_countries && activeDomain.data.blocked_countries.includes(row.country)) ||
            (activeDomain.data.allowed_countries && !activeDomain.data.allowed_countries.includes(row.country))) &&
        ["Google", "Facebook"].includes(row.source)
    ) {
        return "Geo-Blocked";
    }

    if (row.datacenter_reason === "tor") {
        return "Tor";
    }

    if (row.datacenter_reason === "googlebot") {
        return "Googlebot";
    }

    if (row.conversions > 0) {
        return "Converted";
    }

    if (row.riskScore > 0) {
        return fraudTypeMapping[row.primaryRiskType];
    }

    return "Valid User";

    // const { riskContributors } = row;
    // let value = 0;
    // let type = 'Valid User';
    // if (riskContributors) {
    //   const json = JSON.parse(riskContributors);
    //   Object.keys(json).map(key => {
    //     if (json[key] > value) {
    //       value = json[key];
    //       type = fraudTypeMapping[key];
    //     }
    //     return key;
    //   });
    // }
    // return type;
};

export const getStatus = (listed, row, activeDomain, ipBlocklist) => {
    const { riskScore: score, source, country } = row;
    if (
        activeDomain &&
        activeDomain.data &&
        (activeDomain.data.monitoring_only ||
            (!activeDomain.data.block_accidental &&
                getPrimaryFraudType(row, ipBlocklist, activeDomain) === "Accidental Clicks"))
    ) {
        return "Unblocked";
    }
    if (listed && listed.is_blocked) {
        return "Manual Block";
    }
    if (
        (((score >= 7 || (activeDomain && activeDomain.data && activeDomain.data.aggressive_blocking && score >= 5)) &&
            !listed &&
            ["Google", "Facebook"].includes(source)) ||
            (activeDomain &&
                activeDomain.data &&
                ((activeDomain.data.blocked_countries && activeDomain.data.blocked_countries.includes(country)) ||
                    (activeDomain.data.allowed_countries && !activeDomain.data.allowed_countries.includes(country))) &&
                ["Google", "Facebook"].includes(source))) &&
        getPrimaryFraudType(row, ipBlocklist, activeDomain) !== "Googlebot"
    ) {
        return "Auto Blocked";
    }
    if (
        (!listed && (score < 7 || !["Google", "Facebook"].includes(source))) ||
        (listed && !listed.is_blocked) ||
        getPrimaryFraudType(row, ipBlocklist, activeDomain) === "Googlebot"
    ) {
        return "Unblocked";
    }
    return "";
};

const displayTrafficSource = (source = "Other") => {
    const [sourceOption] = trafficOptions.filter((option) => source === option.value);
    return sourceOption.label;
};

const CustomToolbar = () => {
    return (
        <GridToolbarContainer className={styles.customToolbarStats}>
            <GridToolbarExport excelOptions={{ disableToolbarButton: true }} />
        </GridToolbarContainer>
    );
};

const stringToNumberComparator = (a, b) => {
    return parseFloat(a) - parseFloat(b);
};

const StatsTable = ({ results, onStatusChange, ipBlocklist, activeDomain, loading }) => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        pagination: { page: 1 },
        anchorEl: null,
        ipPopup: null,
    });

    const handlePopoverClose = () => {
        setState((prev) => ({
            ...prev,
            anchorEl: null,
            ipPopup: null,
        }));
    };

    const onFilterChange = () => {
        setState((prev) => ({
            ...prev,
            pagination: { ...prev.pagination, page: 1 },
        }));
    };

    const handlePopupOpen = (row, e) => {
        setState((prev) => ({
            ...prev,
            ipPopup: row,
            anchorEl: e.target,
        }));
    };

    const getFraudLevel = (avg, source) => {
        if (
            !source ||
            !(
                source.toLowerCase().includes("google") ||
                source.toLowerCase().includes("meta") ||
                source.toLowerCase().includes("facebook")
            )
        ) {
            return "other";
        }
        if (avg >= 7) return "high";
        if (avg > 3) return "medium";
        if (avg > 0) return "low";
        return "clean";
    };

    const getNoFraudScoreStyle = (source) => {
        if (
            !source ||
            !(
                source.toLowerCase().includes("google") ||
                source.toLowerCase().includes("meta") ||
                source.toLowerCase().includes("facebook")
            )
        ) {
            return "other";
        }
        return "clean";
    };

    const cols = [
        {
            field: "ip",
            headerName: "IP Address",
            width: 140,
        },
        {
            field: "status",
            headerName: "Status",
            width: 160,
            filterOperators: getGridStringOperators().map((operator) => {
                if (["equals", "contains"].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: statusOptions,
                        },
                    };
                }
                return operator;
            }),
            valueGetter: (param) => {
                const { row } = param;
                const listedIp = ipBlocklist.find((ip) => ip.address.includes(row.ip));
                return getStatus(listedIp, row, activeDomain, ipBlocklist);
            },
            renderCell: (param) => {
                const { row } = param;
                const listedIp = ipBlocklist.find((ip) => ip.address.includes(row.ip));
                const checked = getStatus(listedIp, row, activeDomain, ipBlocklist) !== "Unblocked";
                return (
                    <div className={styles.switchWrap}>
                        <Switch
                            index={row.index}
                            onColor="#fc584e"
                            disabled={activeDomain?.data?.monitoring_only}
                            onChange={(name, ind) =>
                                onStatusChange(ind, getStatus(listedIp, row, activeDomain, ipBlocklist))
                            }
                            checked={checked}
                        />
                        <p className={styles.switchText}>{getStatus(listedIp, row, activeDomain, ipBlocklist)}</p>
                    </div>
                );
            },
        },
        {
            field: "riskScore",
            headerName: "Fraud Score",
            width: 140,
            valueGetter: (param) => {
                const type = getPrimaryFraudType(param.row, ipBlocklist, activeDomain);
                return type === "Converted"
                    ? 0.0
                    : type === "Blacklist" ||
                        type === "Geo-Blocked" ||
                        (type === "Accidental Clicks" && !activeDomain.data.block_accidental) ||
                        type === "Googlebot"
                      ? 0
                      : param.row.riskScore.toFixed(1);
            },
            filterOperators: getGridNumericOperators()
                .filter((operator) => operator.value !== "isAnyOf")
                .map((operator) => ({
                    ...operator,
                    getApplyFilterFn: !["=", "!="].includes(operator.value)
                        ? operator.getApplyFilterFn
                        : (filterItem) => {
                              if (!filterItem.field || !filterItem.value || !filterItem.operator) {
                                  return true;
                              }
                              return (row) => {
                                  return operator.value === "="
                                      ? row.value === "-"
                                          ? row.value === filterItem.value
                                          : Number(row.value) === Number(filterItem.value)
                                      : row.value === "-"
                                        ? row.value !== filterItem.value
                                        : Number(row.value) !== Number(filterItem.value);
                              };
                          },
                })),
            sortComparator: stringToNumberComparator,
            cellClassName: styles.posRel,
            renderCell: (param) => {
                const type = getPrimaryFraudType(param.row, ipBlocklist, activeDomain);
                if (type === "Converted") {
                    return (
                        <div className={`${styles.ipPopupLink} ${styles[getNoFraudScoreStyle(param.row.source)]}`}>
                            0.0
                        </div>
                    );
                }

                if (
                    type === "Blacklist" ||
                    type === "Geo-Blocked" ||
                    type === "Googlebot" ||
                    (type === "Accidental Clicks" && !activeDomain.data.block_accidental)
                ) {
                    return <div>-</div>;
                }

                if (param.row.riskScore !== 0) {
                    return (
                        <a
                            className={`${styles.ipPopupLink} ${styles[getFraudLevel(param.row.riskScore, param.row.source)]}`}
                            onClick={(e) => {
                                if (param.row.riskContributors && Utils.isMobileOrTablet()) {
                                    handlePopupOpen(param.row, e);
                                }
                            }}
                            onMouseOver={(e) => {
                                if (param.row.riskContributors && !Utils.isMobileOrTablet()) {
                                    handlePopupOpen(param.row, e);
                                }
                            }}
                        >
                            {param.row.riskScore.toFixed(1)}
                            <img src={LINK_ICON} alt="link" />
                        </a>
                    );
                }

                return (
                    <div className={`${styles.ipPopupLink} ${styles[getNoFraudScoreStyle(param.row.source)]}`}>0.0</div>
                );
            },
        },
        {
            field: "primaryFraudType",
            headerName: "Primary Fraud Type",
            width: 160,
            valueGetter: (param) => getPrimaryFraudType(param.row, ipBlocklist, activeDomain),
            filterOperators: getGridStringOperators().map((operator) => {
                if (["equals", "contains"].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: fraudTypeOptions,
                        },
                    };
                }
                return operator;
            }),
            renderCell: (param) =>
                getPrimaryFraudType(param.row, ipBlocklist, activeDomain) !== "Googlebot" ? (
                    getPrimaryFraudType(param.row, ipBlocklist, activeDomain)
                ) : (
                    <span>
                        <Tooltip place="right" className={styles.googleBotTooltip} id="googleAdBot">
                            IPs used by Google are not blocked.{" "}
                            <a
                                href="https://help.fraudblocker.com/en/articles/9524900-do-you-block-ip-addresses-from-googlebot"
                                target="_blank"
                                style={{ color: "#ffffff" }}
                                rel="noopener noreferrer"
                            >
                                Read more.
                            </a>
                        </Tooltip>
                        Googlebot <TooltipIcon className={styles.googleBotTip} data-tip data-for="googleAdBot" />
                    </span>
                ),
        },
        {
            field: "source",
            headerName: "Traffic Source",
            width: 150,
            filterOperators: getGridStringOperators().map((operator) => {
                if (["equals", "contains"].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: trafficOptions,
                        },
                    };
                }
                return operator;
            }),
            renderCell: (param) => {
                if (param.row.source?.toLowerCase().includes("google")) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img className={styles.driveIcon} src={DRIVE_ICON} alt="google" />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                if (
                    param.row.source?.toLowerCase().includes("facebook") ||
                    param.row.source?.toLowerCase().includes("meta")
                ) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img className={styles.driveIcon} src={META_ICON} alt="meta" />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                if (
                    param.row.source?.toLowerCase().includes("micro") ||
                    param.row.source?.toLowerCase().includes("bing")
                ) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img className={styles.driveIcon} src={MICROSOFT_ICON} alt="microsoft" />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                return displayTrafficSource(param.row.source);
            },
        },
        {
            field: "clicks",
            headerName: "Ad Clicks",
            width: 100,
        },
        {
            field: "conversions",
            headerName: "Conversions",
            width: 100,
            renderCell: (param) => {
                return (
                    <div>
                        {param.row.conversions > 0 ? (
                            <img
                                style={{
                                    width: "20px",
                                    verticalAlign: "top",
                                }}
                                src={YES_ICON}
                                alt="Converted"
                            />
                        ) : (
                            <img
                                style={{
                                    width: "20px",
                                    verticalAlign: "top",
                                }}
                                src={NO_ICON}
                                alt="Not converted"
                            />
                        )}
                    </div>
                );
            },
        },
        {
            field: "lastSeen",
            headerName: "Last Seen",
            width: 170,
            renderCell: (param) => moment(param.row.lastSeen.value).format("MMMM D, YYYY HH:mm"),
            valueGetter: (param) => moment(param.row.lastSeen.value),
        },
        {
            field: "firstSeen",
            headerName: "First Seen",
            width: 170,
            renderCell: (param) => moment(param.row.firstSeen.value).format("MMMM D, YYYY HH:mm"),
            valueGetter: (param) => moment(param.row.firstSeen.value),
        },
    ];

    return (
        <>
            <div style={{ height: 400, width: "100%" }}>
                <DataGridPremium
                    rows={results}
                    columns={cols}
                    loading={loading}
                    pagination
                    getRowId={(row) => row.rowId}
                    onFilterModelChange={onFilterChange}
                    initialState={{
                        pinnedColumns: { left: ["ip"] },
                    }}
                    slots={{
                        toolbar: CustomToolbar,
                        noRowsOverlay: () => (
                            <div className={styles.noDataStats}>
                                <img src={EMPTY_REPORT} alt="No data" />
                                <div className={styles.noDataText}>
                                    No traffic from advertising detected.
                                    <br />
                                    <span className={styles.verifyLink} onClick={() => navigate("/integrations")}>
                                        Verify your Fraud Tracker installation.
                                    </span>
                                </div>
                            </div>
                        ),
                    }}
                />
            </div>
            <IpPopup
                isOpen={state.ipPopup !== null}
                details={state.ipPopup}
                targetElem={state.anchorEl}
                handlePopoverClose={handlePopoverClose}
            />
        </>
    );
};

StatsTable.propTypes = {
    results: PropTypes.array.isRequired,
    ipBlocklist: PropTypes.array,
    onStatusChange: PropTypes.func.isRequired,
    activeDomain: PropTypes.object,
    loading: PropTypes.bool,
};

export default StatsTable;
