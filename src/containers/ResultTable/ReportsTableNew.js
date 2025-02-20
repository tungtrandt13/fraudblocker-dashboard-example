import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    DataGridPremium,
    getGridNumericOperators,
    getGridStringOperators,
    GridToolbarContainer,
    GridToolbarExport,
} from "@mui/x-data-grid-premium";
import { Box, Typography } from "@mui/material";
import styles from "./ResultTable.module.scss";
import { GridDropdownFilter } from "./FilterSelect"; // Assuming FilterSelect is converted
import Constants from "../../utils/Constants";
import { BROWSER_ICONS, OS_ICONS } from "../../utils/IconsMapping";
import Utils from "../../utils/Utils";
import IpPopup from "./IpPopup"; // Assuming IpPopup is converted
import LinkIcon from "@mui/icons-material/Link";
import { Switch } from "../../components/Switch/Switch"; //Assuming this is converted
import EMPTY_REPORT from "../../assets/empty1.svg";
import DRIVE_ICON from "../../assets/drive_icon.svg";
import MICROSOFT_ICON from "../../assets/microsoft-ads-icon.png";
import META_ICON from "../../assets/meta-new.svg";
import { ReactComponent as TooltipIcon } from "../../assets/tooltip.svg"; // Make sure you have a valid ReactComponent

const { countryNameMapping } = Constants;

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
    { label: "Google Ads", value: "Google" },
    { label: "Microsoft Ads", value: "Bing" },
    { label: "Meta Ads", value: "Facebook" },
    { label: "Other", value: "Other" },
];

const statusOptions = [
    { label: "Auto Blocked", value: "Auto Blocked" },
    { label: "Manual Block", value: "Manual Block" },
    { label: "Unblocked", value: "Unblocked" },
];

// Make these shared constants between report tables
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

export const getPrimaryFraudType = (row, ipBlocklist, activeDomain) => {
    const listedIp = ipBlocklist?.find((ip) => ip.address.includes(row.ip)); // Safe access
    const checked = listedIp?.is_blocked; // Safe access
    if (checked) return "Blacklist";

    if (
        activeDomain?.data && // Safe access
        (activeDomain.data.blocked_countries?.includes(row.country) ||
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
};

export const getStatus = (listed, row, activeDomain, ipBlocklist) => {
    if (
        activeDomain?.data && // Safe access
        (activeDomain.data.monitoring_only ||
            (!activeDomain.data.block_accidental &&
                getPrimaryFraudType(row, ipBlocklist, activeDomain) === "Accidental Clicks"))
    ) {
        return "Unblocked";
    }
    if (listed?.is_blocked) {
        // Safe access
        return "Manual Block";
    }
    if (
        (row.riskScore >= 7 || (activeDomain?.data?.aggressive_blocking && row.riskScore >= 5)) && // Safe access on activeDomain
        !listed &&
        ["Google", "Facebook"].includes(row.source) &&
        getPrimaryFraudType(row, ipBlocklist, activeDomain) !== "Googlebot"
    ) {
        return "Auto Blocked";
    }
    if (
        (!listed && (row.riskScore < 7 || !["Google", "Facebook"].includes(row.source))) ||
        (listed && !listed.is_blocked) || // Safe access
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

const ReportsTable = ({ results, ipBlocklist, onStatusChange, maxHeight, loading, accounts, activeDomain }) => {
    const [pagination, setPagination] = useState({ page: 1 });
    const [anchorEl, setAnchorEl] = useState(null);
    const [ipPopup, setIpPopup] = useState(null);

    const onFilterChange = useCallback(() => {
        setPagination((prevPagination) => ({ ...prevPagination, page: 1 }));
    }, []);

    const handlePopoverClose = useCallback(() => {
        setAnchorEl(null);
        setIpPopup(null);
    }, []);

    const handlePopupOpen = useCallback((row, event) => {
        event.stopPropagation();
        setIpPopup(row);
        setAnchorEl(event.currentTarget);
    }, []);

    const getOSIcon = useCallback((os) => {
        if (!os) {
            return OS_ICONS.Other;
        }
        const osLower = os.toLowerCase();
        const iconKey = Object.keys(OS_ICONS).find((key) => osLower.includes(key.toLowerCase())) || "Other";
        return OS_ICONS[iconKey] || OS_ICONS.Other; // Fallback to "Other"
    }, []);

    const getBrowserIcon = useCallback((browser) => {
        if (!browser) {
            return BROWSER_ICONS.Other;
        }
        const browserLower = browser.toLowerCase();

        const iconKey = Object.keys(BROWSER_ICONS).find((key) => browserLower.includes(key.toLowerCase())) || "Other";
        return BROWSER_ICONS[iconKey] || BROWSER_ICONS.Other; // Fallback to other
    }, []);

    const getFraudLevel = useCallback((avg, source) => {
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
        if (avg >= 7) {
            return "high";
        }
        if (avg > 3) {
            return "medium";
        }
        if (avg > 0) {
            return "low";
        }
        return "clean";
    }, []);

    const getNoFraudScoreStyle = useCallback((source) => {
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
    }, []);

    const columns = useMemo(
        () => [
            {
                field: "ip",
                headerName: "IP Address",
                width: 140,
                // No filter method needed, DataGrid handles it.
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
                            InputComponentProps: { options: statusOptions },
                        };
                    }
                    return operator;
                }),
                valueGetter: (params) => {
                    const { row } = params;
                    const listedIp = ipBlocklist.find((ip) => ip.address.includes(row.ip));
                    return getStatus(listedIp, row, activeDomain, ipBlocklist);
                },
                renderCell: (params) => {
                    const { row } = params;
                    const listedIp = ipBlocklist.find((ip) => ip.address.includes(row.ip));
                    const checked =
                        ((listedIp && listedIp.is_blocked) ||
                            ((row.riskScore >= 7 || (activeDomain?.data.aggressive_blocking && row.riskScore >= 5)) && // Safe access
                                !listedIp &&
                                ["Google", "Facebook"].includes(row.source) &&
                                !(
                                    activeDomain?.data && // Safe access
                                    getPrimaryFraudType(row, ipBlocklist, activeDomain) === "Googlebot"
                                )) ||
                            (activeDomain?.data && // Safe access
                                (activeDomain.data.blocked_countries?.includes(row.country) ||
                                    (activeDomain.data.allowed_countries &&
                                        !activeDomain.data.allowed_countries.includes(row.country))) &&
                                ["Google", "Facebook"].includes(row.source))) &&
                        !activeDomain?.data?.monitoring_only && // Safe access
                        !(
                            activeDomain?.data && // Safe access
                            !activeDomain.data.block_accidental &&
                            getPrimaryFraudType(row, ipBlocklist, activeDomain) === "Accidental Clicks"
                        );
                    return (
                        <Box
                            className={styles.statusSwitchContainer}
                            title={
                                activeDomain.data.google_ads_token ? "" : "Google Ads Integration Required" // Corrected typo
                            }
                        >
                            <Switch
                                index={row.index}
                                onColor="#fc584e"
                                disabled={activeDomain?.data?.monitoring_only} // Safe access
                                onChange={(name, ind) =>
                                    onStatusChange(ind, getStatus(listedIp, row, activeDomain, ipBlocklist))
                                }
                                checked={!!checked}
                            />
                            <Typography className={styles.switchText}>
                                {getStatus(listedIp, row, activeDomain, ipBlocklist)}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                field: "riskScore",
                headerName: "Fraud Score",
                width: 140,
                valueGetter: (params) => {
                    const type = getPrimaryFraudType(params.row, ipBlocklist, activeDomain);
                    if (type === "Converted") return 0.0;
                    if (
                        type === "Blacklist" ||
                        type === "Geo-Blocked" ||
                        (type === "Accidental Clicks" && !activeDomain.data.block_accidental) ||
                        type === "Googlebot"
                    )
                        return "-"; // Display '-' for these cases
                    return params.row.riskScore || 0;
                },
                renderCell: (params) => {
                    const type = getPrimaryFraudType(params.row, ipBlocklist, activeDomain);
                    if (type === "Converted") {
                        return (
                            <Box className={`${styles.ipPopupLink} ${getNoFraudScoreStyle(params.row.source)}`}>
                                0.0
                            </Box>
                        );
                    }
                    if (
                        type === "Blacklist" ||
                        type === "Geo-Blocked" ||
                        type === "Googlebot" ||
                        (type === "Accidental Clicks" && !activeDomain.data.block_accidental)
                    ) {
                        return <Box>-</Box>;
                    }

                    return params.row.riskScore !== 0 ? (
                        <Box
                            component="a"
                            className={`${styles.ipPopupLink} ${getFraudLevel(params.row.riskScore, params.row.source)}`}
                            onClick={(e) => {
                                if (params.row.riskContributors && Utils.isMobileOrTablet()) {
                                    handlePopupOpen(params.row, e);
                                }
                            }}
                            onMouseOver={(e) => {
                                if (params.row.riskContributors && !Utils.isMobileOrTablet()) {
                                    handlePopupOpen(params.row, e);
                                }
                            }}
                            sx={{ cursor: "pointer" }}
                        >
                            {params.row.riskScore.toFixed(1)}
                            <img src={LinkIcon} alt="Link" style={{ marginLeft: "5px" }} />
                        </Box>
                    ) : (
                        <Box className={`${styles.ipPopupLink} ${getNoFraudScoreStyle(params.row.source)}`}>0.0</Box>
                    );
                },
                filterOperators: getGridNumericOperators()
                    .filter((operator) => !["isAnyOf"].includes(operator.value)) // Removed the ! from the includes
                    .map((operator) => ({
                        ...operator,
                        getApplyFilterFn: !["=", "!="].includes(operator.value)
                            ? operator.getApplyFilterFn
                            : (filterItem) => {
                                  if (!filterItem.field || !filterItem.value || !filterItem.operator) {
                                      return true;
                                  }

                                  return (row) => {
                                      // Handle the case where row.value might be "-"
                                      if (row.value === "-") {
                                          return (
                                              (filterItem.value === "-" && operator.value === "=") ||
                                              (filterItem.value !== "-" && operator.value === "!=")
                                          );
                                      }
                                      // If not "-", then it's a number, so compare as numbers
                                      return operator.value === "="
                                          ? Number(row.value) === Number(filterItem.value)
                                          : Number(row.value) !== Number(filterItem.value);
                                  };
                              },
                    })),

                sortComparator: (v1, v2) => {
                    // Custom sort comparator to handle "-"
                    if (v1 === "-") return -1;
                    if (v2 === "-") return 1;
                    return stringToNumberComparator(v1, v2);
                },
            },
            {
                field: "primaryFraudType",
                headerName: "Primary Fraud Type",
                width: 160,
                filterOperators: getGridStringOperators().map((operator) => {
                    if (["equals", "contains"].includes(operator.value)) {
                        return {
                            ...operator,
                            InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                            InputComponentProps: { options: fraudTypeOptions },
                        };
                    }
                    return operator;
                }),
                valueGetter: (params) => getPrimaryFraudType(params.row, ipBlocklist, activeDomain),
                renderCell: (params) =>
                    getPrimaryFraudType(params.row, ipBlocklist, activeDomain) !== "Googlebot" ? (
                        getPrimaryFraudType(params.row, ipBlocklist, activeDomain)
                    ) : (
                        <Box>
                            <ReactTooltip place="right" className={styles.googleBotTooltip} id="googleAdBot">
                                IPs used by Google are not blocked.{" "}
                                <Link
                                    href="https://help.fraudblocker.com/en/articles/9524900-do-you-block-ip-addresses-from-googlebot"
                                    target="_blank"
                                    style={{ color: "#fff" }}
                                    rel="noopener noreferrer"
                                >
                                    Read more.
                                </Link>
                            </ReactTooltip>
                            Googlebot <TooltipIcon className={styles.googleBotTip} data-tip data-for="googleAdBot" />
                        </Box>
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
                            InputComponentProps: { options: trafficOptions },
                        };
                    }
                    return operator;
                }),
                renderCell: (params) => {
                    if (params.row.source && params.row.source.toLowerCase().includes("google")) {
                        return (
                            <Box className={styles.iconAndCellValue}>
                                <img className={styles.driveIcon} src={DRIVE_ICON} alt="google" />{" "}
                                {displayTrafficSource(params.row.source)}
                            </Box>
                        );
                    }
                    if (
                        params.row.source &&
                        (params.row.source.toLowerCase().includes("facebook") ||
                            params.row.source.toLowerCase().includes("meta"))
                    ) {
                        return (
                            <Box className={styles.iconAndCellValue}>
                                <img className={styles.driveIcon} src={META_ICON} alt="meta" />{" "}
                                {displayTrafficSource(params.row.source)}
                            </Box>
                        );
                    }
                    if (
                        params.row.source &&
                        (params.row.source.toLowerCase().includes("micro") ||
                            params.row.source.toLowerCase().includes("bing"))
                    ) {
                        return (
                            <Box className={styles.iconAndCellValue}>
                                <img className={styles.driveIcon} src={MICROSOFT_ICON} alt="meta" />{" "}
                                {displayTrafficSource(params.row.source)}
                            </Box>
                        );
                    }
                    return displayTrafficSource(params.row.source);
                },
            },
            {
                field: "lastSeen",
                headerName: "Last Seen",
                width: 170,
                renderCell: (params) => moment(params.row.lastSeen.value).format("MMMM D, YYYY HH:mm"),
                valueGetter: (params) => moment(params.row.lastSeen.value),
            },
            {
                field: "firstSeen",
                headerName: "First Seen",
                width: 170,
                renderCell: (params) => moment(params.row.firstSeen.value).format("MMMM D, YYYY HH:mm"),
                valueGetter: (params) => moment(params.row.firstSeen.value),
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
                renderCell: (params) => {
                    return (
                        <Box>
                            {params.row.conversions > 0 ? (
                                <img style={{ width: "20px", verticalAlign: "top" }} src={YES_ICON} alt="Yes" />
                            ) : (
                                <img style={{ width: "20px", verticalAlign: "top" }} src={NO_ICON} alt="No" />
                            )}
                        </Box>
                    );
                },
            },
            {
                field: "country",
                headerName: "Country",
                width: 150,
                valueGetter: (params) => {
                    return countryNameMapping[params.row.country] || params.row.country;
                },
                renderCell: (params) => {
                    return (
                        <Box>
                            {params.row.country !== "Unknown" && (
                                <img
                                    style={{
                                        width: "20px",
                                        border: "1px solid #ededed",
                                    }}
                                    src={`flags/${params.row.country.toLowerCase()}.svg`}
                                    alt={params.row.country}
                                />
                            )}{" "}
                            {!params.row.country || params.row.country === "Unknown"
                                ? ""
                                : countryNameMapping[params.row.country] || params.row.country}
                        </Box>
                    );
                },
            },
            {
                field: "state",
                headerName: "Region",
                width: 150,
                valueGetter: (params) => (!params.row.state || params.row.state === "Unknown" ? "" : params.row.state),
            },
            {
                field: "city",
                headerName: "City",
                width: 150,
                valueGetter: (params) => (!params.row.city || params.row.city === "Unknown" ? "" : params.row.city),
            },
            {
                field: "device_id",
                headerName: "Device ID",
                width: 150,
                valueGetter: (params) =>
                    !params.row.device_id || params.row.device_id === "Unknown" ? "" : params.row.device_id,
            },
            {
                field: "os",
                headerName: "Operating System",
                width: 150,
                valueGetter: (params) =>
                    params.row.os && params.row.os !== "undefined%20undefined"
                        ? decodeURI(params.row.os).replace(/\s|\.|[0-9]/g, "")
                        : "Unknown",
                renderCell: (params) => {
                    const osValue = params.value;
                    return (
                        <Box className={styles.iconAndCellValue}>
                            {createElement(getOSIcon(osValue), {
                                style: { height: "24px", width: "24px" },
                            })}
                            &nbsp;{osValue}
                        </Box>
                    );
                },
            },
            {
                field: "browser",
                headerName: "Browser",
                width: 120,
                valueGetter: (params) =>
                    params.row.browser && params.row.browser !== "undefined%20undefined"
                        ? decodeURI(params.row.browser).replace(/\s|\.|[0-9]/g, "")
                        : "Unknown",
                renderCell: (params) => {
                    const browserValue = params.value;
                    return (
                        <Box className={styles.iconAndCellValue}>
                            {createElement(getBrowserIcon(browserValue), {
                                style: { height: "24px", width: "24px" },
                            })}
                            &nbsp;{browserValue}
                        </Box>
                    );
                },
            },
            {
                field: "clickType",
                headerName: "Device Type",
                width: 150,
                valueGetter: (params) =>
                    !params.row.clickType || params.row.clickType === "Unknown" ? "" : params.row.clickType,
            },
            {
                field: "click_id",
                headerName: "Click ID",
            },
            {
                field: "utm_source",
                width: 150,
                headerName: "UTM Source",
                valueGetter: (params) => decodeURIComponent(params.row.utm_source || ""),
            },
            {
                field: "utm_medium",
                width: 150,
                headerName: "UTM Medium",
                valueGetter: (params) => decodeURIComponent(params.row.utm_medium || ""),
            },
            {
                field: "utm_campaign",
                width: 150,
                headerName: "UTM Campaign",
                valueGetter: (params) => decodeURIComponent(params.row.utm_campaign || ""),
            },
            {
                field: "utm_term",
                width: 150,
                headerName: "UTM Term",
                valueGetter: (params) => decodeURIComponent(params.row.utm_term || ""),
            },
            {
                field: "referer",
                width: 150,
                headerName: "Referer URL",
            },
            {
                field: "cpid",
                headerName: "Campaign ID",
            },
            {
                field: "agid",
                headerName: "Ad Group ID",
            },
            {
                field: "kw",
                headerName: "Keyword",
            },
            {
                field: "net",
                headerName: "Network",
            },
            {
                field: "creative",
                headerName: "Creative ID",
            },
            {
                field: "loc_physical_ms",
                headerName: "Physical Location",
            },
            {
                field: "loc_interest_ms",
                headerName: "Location Interest",
            },
            {
                field: "dv",
                headerName: "Device",
            },
            {
                field: "mt",
                headerName: "Match Type",
            },
            {
                field: "pl",
                headerName: "Placement",
            },
            {
                field: "lpurl",
                headerName: "Landing Page URL",
            },
        ],
        [] // Add any dependencies that, when changed, should cause the columns to re-initialize
    );

    return (
        <Box sx={{ height: 700, width: "100%" }}>
            <DataGridPremium
                sx={{
                    "& .MuiDataGrid-row": {
                        fontSize: "14px",
                        color: "#4a4a4a",
                    },
                    "& .MuiDataGrid-menuIcon": {
                        marginRight: "0px",
                    },
                    "& .MuiDataGrid-columnSeparator--sideRight": {
                        paddingRight: "5px",
                    },
                }}
                rows={results}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.rowId}
                onFilterModelChange={onFilterChange} // No need to recreate this on every render
                initialState={{
                    pinnedColumns: { left: ["ip"] },
                    columns: {
                        columnVisibilityModel: {
                            cpid: false,
                            agid: false,
                            kw: false,
                            net: false,
                            creative: false,
                            loc_physical_ms: false,
                            loc_interest_ms: false,
                            dv: false,
                            mt: false,
                            pl: false,
                            lpurl: false,
                        },
                    },
                }}
                slots={{
                    noRowsOverlay: () => (
                        <Box className={styles.noData}>
                            <img src={EMPTY_REPORT} alt="No Data" />
                            <Box
                                sx={{
                                    marginTop: "20px",
                                    color: "#a7b3c0",
                                    fontSize: "16px",
                                    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
                                }}
                            >
                                No traffic from advertising detected.
                                <br />
                                <Link
                                    component="button" // For accessibility and semantics
                                    sx={{ color: "#a7b3c0", fontSize: "16px", cursor: "pointer" }}
                                    onClick={() => {
                                        console.log(233);
                                    }}
                                    href="/integrations" // Use href, not to=""
                                >
                                    Verify your Fraud Tracker installation.
                                </Link>
                            </Box>
                        </Box>
                    ),
                    toolbar: CustomToolbar,
                }}
            />
            <IpPopup
                isOpen={ipPopup !== null}
                details={ipPopup}
                targetElem={anchorEl}
                handlePopoverClose={handlePopoverClose}
            />
        </Box>
    );
};

ReportsTable.propTypes = {
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    ipBlocklist: PropTypes.arrayOf(PropTypes.object).isRequired,
    onStatusChange: PropTypes.func.isRequired,
    maxHeight: PropTypes.number,
    loading: PropTypes.bool,
    accounts: PropTypes.object.isRequired, // You might want to define the shape more precisely
    activeDomain: PropTypes.object.isRequired, // You might want to define the shape more precisely
};

ReportsTable.defaultProps = {
    ipBlocklist: [],
};

export default ReportsTable;
