import React, {
    createElement,
    PureComponent,
    useState
} from 'react';
import {
    Link,
    useNavigate
} from 'react-router-dom';
import moment from 'moment';
import { Tooltip } from 'react-tooltip';
import PropTypes from 'prop-types';
import {
    DataGridPremium,
    getGridStringOperators,
    getGridNumericOperators,
    GridToolbarContainer,
    GridToolbarExport
} from '@mui/x-data-grid-premium';
import styles from './ResultTable.module.scss';
import Switch from '../../components/Switch/Switch';
import Constants from '../../utils/Constants';
import {
    BROWSER_ICONS,
    OS_ICONS
} from '../../utils/IconsMapping';
import Utils from '../../utils/Utils';
import {
    GridDropdownFilter
} from './FilterSelect';
import EMPTY_REPORT from '../../assets/empty1.svg';
import DRIVE_ICON from '../../assets/drive_icon.svg';
import MICROSOFT_ICON from '../../assets/microsoft-ads-icon.png';
import META_ICON from '../../assets/meta-new.svg';
import LINK_ICON from '../../assets/pop-out-arrow.svg';
import NO_ICON from '../../assets/no.svg';
import YES_ICON from '../../assets/yes.svg';
import {
    ReactComponent as TooltipIcon
} from '../../assets/tooltip.svg';
import IpPopup from './IpPopup';

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

const {
    countryNameMapping
} = Constants;

const fraudTypeMapping = {
    fastClickersRiskPoints: 'Excessive Clicks',
    historicalClicksRiskPoints: 'Poor IP History',
    dcRiskPoints: 'VPN / Datacenter',
    geoRiskPoints: 'Risky Geo',
    accidentalClicksRiskPoints: 'Accidental Clicks',
    headlessBrowserRiskPoints: 'Very High Risk',
    deviceRiskPoints: 'Risky Device',
    abuseHighRiskPoints: 'Poor IP History'
};

const trafficOptions = [{
        label: 'Google Ads',
        value: 'Google'
    },
    {
        label: 'Microsoft Ads',
        value: 'Bing'
    },
    {
        label: 'Meta Ads',
        value: 'Facebook'
    },
    {
        label: 'Other',
        value: 'Other'
    }
];

const statusOptions = [{
        label: 'Auto Blocked',
        value: 'Auto Blocked'
    },
    {
        label: 'Manual Block',
        value: 'Manual Block'
    },
    {
        label: 'Unblocked',
        value: 'Unblocked'
    }
];

// Make these shared constants between report tables
const fraudTypeOptions = [
    'Accidental Clicks',
    {
        label: 'Blacklist or Abusive IPs',
        value: 'Blacklist'
    },
    'Converted',
    'Excessive Clicks',
    'Exclusion List',
    'Geo-Blocked',
    'Googlebot',
    'Tor',
    'Poor IP History',
    'Risky Device',
    'Risky Geo',
    'Valid User',
    'Very High Risk',
    'VPN / Datacenter'
];

export const getPrimaryFraudType = (row, ipBlocklist, activeDomain) => {
    const listedIp = ipBlocklist && ipBlocklist.find(ip => ip.address.includes(row.ip));
    const checked = listedIp && listedIp.is_blocked;
    if (checked) return 'Blacklist';

    if (
        activeDomain &&
        activeDomain.data &&
        ((activeDomain.data.blocked_countries &&
                activeDomain.data.blocked_countries.includes(row.country)) ||
            (activeDomain.data.allowed_countries &&
                !activeDomain.data.allowed_countries.includes(row.country))) && ['Google', 'Facebook'].includes(row.source)
    ) {
        return 'Geo-Blocked';
    }

    if (row.datacenter_reason === 'tor') {
        return 'Tor';
    }

    if (row.datacenter_reason === 'googlebot') {
        return 'Googlebot';
    }

    if (row.conversions > 0) {
        return 'Converted';
    }

    if (row.riskScore > 0) {
        return fraudTypeMapping[row.primaryRiskType];
    }

    return 'Valid User';
};

export const getStatus = (listed, row, activeDomain, ipBlocklist) => {
    const {
        riskScore: score,
        source,
        country
    } = row;
    if (
        activeDomain &&
        activeDomain.data &&
        (activeDomain.data.monitoring_only ||
            (!activeDomain.data.block_accidental &&
                getPrimaryFraudType(row, ipBlocklist, activeDomain) === 'Accidental Clicks'))
    ) {
        return 'Unblocked';
    }
    if (listed && listed.is_blocked) {
        return 'Manual Block';
    }
    if (
        ((score >= 7 ||
                (activeDomain && activeDomain.data && activeDomain.data.aggressive_blocking && score >= 5)) &&
            !listed && ['Google', 'Facebook'].includes(source) &&
            getPrimaryFraudType(row, ipBlocklist, activeDomain) !== 'Googlebot') ||
        (activeDomain &&
            activeDomain.data &&
            ((activeDomain.data.blocked_countries &&
                    activeDomain.data.blocked_countries.includes(country)) ||
                (activeDomain.data.allowed_countries &&
                    !activeDomain.data.allowed_countries.includes(country))) && ['Google', 'Facebook'].includes(source))
    ) {
        return 'Auto Blocked';
    }
    if (
        (!listed && (score < 7 || !['Google', 'Facebook'].includes(source))) ||
        (listed && !listed.is_blocked) ||
        getPrimaryFraudType(row, ipBlocklist, activeDomain) === 'Googlebot'
    ) {
        return 'Unblocked';
    }
    return '';
};

const displayTrafficSource = (source = 'Other') => {
    const [sourceOption] = trafficOptions.filter(option => source === option.value);
    return sourceOption.label;
};

function CustomToolbar() {
    return (
        <GridToolbarContainer className={styles.customToolbarStats}>
            <GridToolbarExport 
                csvOptions={{
                    fileName: `fraud-blocker-report-${moment().format('YYYY-MM-DD')}`,
                    delimiter: ',',
                    utf8WithBom: true
                }}
            />
        </GridToolbarContainer>
    );
}

const stringToNumberComparator = (a, b) => {
    return parseFloat(a) - parseFloat(b);
};

const ReportsTable = ({
    results,
    onStatusChange,
    ipBlocklist,
    activeDomain,
    loading
}) => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        pagination: { page: 1 },
        anchorEl: null,
        ipPopup: null
    });

    const onFilterChange = () => {
        setState(prev => ({
            ...prev,
            pagination: { ...prev.pagination, page: 1 }
        }));
    };

    const handlePopoverClose = () => {
        setState(prev => ({
            ...prev,
            anchorEl: null,
            ipPopup: null
        }));
    };

    const handlePopupOpen = (row, e) => {
        e.stopPropagation();
        setState(prev => ({
            ...prev,
            ipPopup: row,
            anchorEl: e.target
        }));
    };

    const getOSIcon = (os) => {
        if (!os) {
            return OS_ICONS.Other;
        }
        if (OS_ICONS[os]) {
            return OS_ICONS[os];
        }

        let icon = OS_ICONS.Other;
        const keys = Object.keys(OS_ICONS);
        for (let i = 0; i < keys.length; i += 1) {
            if (os.toLowerCase().includes(keys[i].toLowerCase())) {
                icon = OS_ICONS[keys[i]];
                break;
            }
        }
        return icon;
    }

    const getBrowserIcon = (browser) => {
        if (!browser) {
            return BROWSER_ICONS.Other;
        }
        if (BROWSER_ICONS[browser]) {
            return BROWSER_ICONS[browser]
        }

        let icon = BROWSER_ICONS.Other;
        const keys = Object.keys(BROWSER_ICONS);
        for (let i = 0; i < keys.length; i += 1) {
            if (browser.toLowerCase().includes(keys[i].toLowerCase())) {
                icon = BROWSER_ICONS[keys[i]];
                break;
            }
        }
        return icon;
    }

    const getFraudLevel = (avg, source) => {
        if (!source || !(source.toLowerCase().includes('google') || source.toLowerCase().includes('meta') || source.toLowerCase().includes('facebook'))) {
            return 'other';
        }
        if (avg >= 7) {
            return 'high';
        }
        if (avg > 3) {
            return 'medium';
        }
        if (avg > 0) {
            return 'low';
        }
        return 'clean';
    };

    const getNoFraudScoreStyle = (source) => {
        if (!source || !(source.toLowerCase().includes('google') || source.toLowerCase().includes('meta') || source.toLowerCase().includes('facebook'))) {
            return 'other';
        }
        return 'clean';
    }

    const cols = [{
            field: 'ip',
            headerName: 'IP Address',
            width: 140
            // filterMethod: (filter, row) => row[filter.id].includes(filter.value)
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 160,
            filterOperators: getGridStringOperators().map(operator => {
                if (['equals', 'contains'].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: statusOptions
                        }
                    };
                }
                return operator;
            }),
            valueGetter: param => {
                const {
                    row
                } = param;
                const listedIp = ipBlocklist.find(ip => ip.address.includes(row.ip));
                return getStatus(listedIp, row, activeDomain, ipBlocklist);
            },
            renderCell: param => {
                const {
                    row
                } = param;
                const listedIp = ipBlocklist.find(ip => ip.address.includes(row.ip));
                const checked =
                    ((listedIp && listedIp.is_blocked) ||
                        ((row.riskScore >= 7 ||
                                (activeDomain && activeDomain.data && activeDomain.data.aggressive_blocking && row.riskScore >= 5)) &&
                            !listedIp && ['Google', 'Facebook'].includes(row.source) &&
                            !(
                                activeDomain &&
                                activeDomain.data &&
                                getPrimaryFraudType(row, ipBlocklist, activeDomain) === 'Googlebot'
                            )) ||
                        (activeDomain &&
                            activeDomain.data &&
                            ((activeDomain.data.blocked_countries &&
                                    activeDomain.data.blocked_countries.includes(row.country)) ||
                                (activeDomain.data.allowed_countries &&
                                    !activeDomain.data.allowed_countries.includes(row.country))) && ['Google', 'Facebook'].includes(row.source))) &&
                    !(activeDomain && activeDomain.data && activeDomain.data.monitoring_only) &&
                    !(
                        activeDomain &&
                        activeDomain.data &&
                        !activeDomain.data.block_accidental &&
                        getPrimaryFraudType(row, ipBlocklist, activeDomain) === 'Accidental Clicks'
                    );
                return ( <div className={styles.statusSwitchContainer}>
                    <Switch
                        index={row.index}
                        onColor="#fc584e"
                        disabled={activeDomain?.data?.monitoring_only}
                        onChange={(name, ind) => onStatusChange(ind, getStatus(listedIp, row, activeDomain, ipBlocklist))}
                        checked={!!checked}
                    />
                    <p className={styles.switchText}>
                        {getStatus(listedIp, row, activeDomain, ipBlocklist)}
                    </p>
                </div>
                );
            }
        },
        {
            field: 'riskScore',
            headerName: 'Fraud Score',
            width: 140,
            // headerStyle: { textAlign: 'center' },
            // Cell: row => <DefaultCell row={row} />,
            valueGetter: param => {
                const type = getPrimaryFraudType(param.row, ipBlocklist, activeDomain);
                return type === 'Converted' ?
                    0.0 :
                    type === 'Blacklist' ||
                    type === 'Geo-Blocked' ||
                    (type === 'Accidental Clicks' && !activeDomain.data.block_accidental) ||
                    type === 'Googlebot' ?
                    0 :
                    param.row.riskScore || 0;
            },
            filterOperators: getGridNumericOperators()
                .filter(operator => {
                    return operator.label !== 'isAnyOf';
                })
                .map(operator => ({
                    ...operator,
                    getApplyFilterFn: !['=', '!='].includes(operator.value) ?
                        operator.getApplyFilterFn :
                        filterItem => {
                            if (!filterItem.field || !filterItem.value || !filterItem.operator) {
                                return true;
                            }

                            return row => {
                                return operator.value === '=' ?
                                    row.value === '-' ?
                                    row.value === filterItem.value :
                                    Number(row.value) === Number(filterItem.value) :
                                    row.value === '-' ?
                                    row.value !== filterItem.value :
                                    Number(row.value) !== Number(filterItem.value);
                            };
                        }
                })),
            sortComparator: stringToNumberComparator,
            renderCell: param => {
                const type = getPrimaryFraudType(param.row, ipBlocklist, activeDomain);
                if (type === 'Converted') {
                    return (
                        <div className={`${styles.ipPopupLink} ${styles[this.getNoFraudScoreStyle(param.row.source)]}`}>
                            0.0
                        </div>
                    );
                }
                
                if (type === 'Blacklist' || type === 'Geo-Blocked' || type === 'Googlebot' || 
                    (type === 'Accidental Clicks' && !activeDomain.data.block_accidental)) {
                    return <div>-</div>;
                }
                
                if (param.row.riskScore !== 0) {
                    return (
                        <a 
                            className={`${styles.ipPopupLink} ${styles[this.getFraudLevel(param.row.riskScore, param.row.source)]}`}
                            onClick={e => {
                                if (param.row.riskContributors && Utils.isMobileOrTablet()) {
                                    this.handlePopupOpen(param.row, e);
                                }
                            }}
                            onMouseOver={e => {
                                if (param.row.riskContributors && !Utils.isMobileOrTablet()) {
                                    this.handlePopupOpen(param.row, e);
                                }
                            }}
                        >
                            {param.row.riskScore.toFixed(1)}
                            <img src={LINK_ICON} alt="link" />
                        </a>
                    );
                }
                
                return (
                    <div className={`${styles.ipPopupLink} ${styles[this.getNoFraudScoreStyle(param.row.source)]}`}>
                        0.0
                    </div>
                );
            }
            // filterMethod: (filter, row) => {
            //   if (filter.value === 'all') {
            //     return true;
            //   }

            //   return (
            //     row[filter.id] >= parseInt(filter.value.split('-')[0], 10) &&
            //     row[filter.id] <= parseInt(filter.value.split('-')[1], 10)
            //   );
            // },
            // Filter: ({ filter, onChange }) => (
            //   <FilterSelect filter={filter} onChange={onChange} options={fraudScoreOptions} />
            // ),
            // style: { textAlign: 'center' }
        },
        {
            field: 'primaryFraudType',
            headerName: 'Primary Fraud Type',
            width: 160,
            filterOperators: getGridStringOperators().map(operator => {
                if (['equals', 'contains'].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: fraudTypeOptions
                        }
                    };
                }
                return operator;
            }),
            valueGetter: param => getPrimaryFraudType(param.row, ipBlocklist, activeDomain),
            renderCell: param =>
                getPrimaryFraudType(param.row, ipBlocklist, activeDomain) !== 'Googlebot' ? (
                    getPrimaryFraudType(param.row, ipBlocklist, activeDomain)
                ) : (
                    <span>
                        <Tooltip 
                            place="right"
                            className={styles.googleBotTooltip}
                            id="googleAdBot"
                        >
                            IPs used by Google are not blocked.{' '}
                            <a 
                                href="https://help.fraudblocker.com/en/articles/9524900-do-you-block-ip-addresses-from-googlebot"
                                target="_blank"
                                style={{ color: '#fff' }}
                                rel="noopener noreferrer"
                            >
                                Read more.
                            </a>
                        </Tooltip>
                        Googlebot{' '}
                        <TooltipIcon 
                            className={styles.googleBotTip}
                            data-tip 
                            data-for="googleAdBot" 
                        />
                    </span>
                )
            // filterMethod: (filter, row) => {
            //   if (filter.value === 'all') {
            //     return true;
            //   }

            //   return row[filter.id] === filter.value;
            // },
            // Filter: ({ filter, onChange }) => (
            //   <FilterSelect filter={filter} onChange={onChange} options={fraudTypeOptions} />
            // )
        },
        {
            field: 'source',
            headerName: 'Traffic Source',
            width: 150,
            filterOperators: getGridStringOperators().map(operator => {
                if (['equals', 'contains'].includes(operator.value)) {
                    return {
                        ...operator,
                        InputComponent: operator.InputComponent ? GridDropdownFilter : undefined,
                        InputComponentProps: {
                            options: trafficOptions
                        }
                    };
                }
                return operator;
            }),
            renderCell: param => {
                if (param.row.source?.toLowerCase().includes('google')) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img 
                                className={styles.driveIcon}
                                src={DRIVE_ICON}
                                alt="google"
                            />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                if (param.row.source?.toLowerCase().includes('facebook') || 
                    param.row.source?.toLowerCase().includes('meta')) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img 
                                className={styles.driveIcon}
                                src={META_ICON}
                                alt="meta"
                            />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                if (param.row.source?.toLowerCase().includes('micro') || 
                    param.row.source?.toLowerCase().includes('bing')) {
                    return (
                        <div className={styles.iconAndCellValue}>
                            <img 
                                className={styles.driveIcon}
                                src={MICROSOFT_ICON}
                                alt="microsoft"
                            />
                            {displayTrafficSource(param.row.source)}
                        </div>
                    );
                }

                return displayTrafficSource(param.row.source);
            }
        },
        {
            field: 'lastSeen',
            headerName: 'Last Seen',
            width: 170,
            renderCell: param => moment(param.row.lastSeen.value).format('MMMM D, YYYY HH:mm'),
            valueGetter: param => moment(param.row.lastSeen.value)
        },
        {
            field: 'firstSeen',
            headerName: 'First Seen',
            width: 170,
            renderCell: param => moment(param.row.firstSeen.value).format('MMMM D, YYYY HH:mm'),
            valueGetter: param => moment(param.row.firstSeen.value)
        },
        // {
        //   id: 'lastClicks',
        //   headerName: 'Last Click',
        //   width: 150,
        //   Cell: row => <DefaultCell row={row} />,
        //   accessor: 'lastClicks',
        //   filterable: false
        // },
        {
            field: 'clicks',
            headerName: 'Ad Clicks',
            width: 100
        },
        {
            field: 'conversions',
            headerName: 'Conversions',
            width: 100,
            renderCell: param => (
                <div>
                    {param.row.conversions > 0 ? (
                        <img 
                            style={{
                                width: '20px',
                                verticalAlign: 'top'
                            }}
                            src={YES_ICON}
                            alt="Converted"
                        />
                    ) : (
                        <img
                            style={{
                                width: '20px',
                                verticalAlign: 'top'
                            }}
                            src={NO_ICON}
                            alt="Not converted"
                        />
                    )}
                </div>
            )
        },
        {
            field: 'country',
            headerName: 'Country',
            width: 150,
            valueGetter: param => {
                return countryNameMapping[param.row.country] || param.row.country;
            },
            renderCell: param => {
                return (
                    <div>
                        {param.row.country !== 'Unknown' && (
                            <img 
                                style={{
                                    width: '20px',
                                    border: '1px solid #ededed'
                                }}
                                src={`flags/${param.row.country.toLowerCase()}.svg`}
                                alt={param.row.country}
                            />
                        )}
                        {' '}
                        {!param.row.country || param.row.country === 'Unknown' 
                            ? '' 
                            : countryNameMapping[param.row.country] || param.row.country
                        }
                    </div>
                );
            }
            // filterMethod: (filter, row) => {
            //   if (filter.value === 'all') {
            //     return true;
            //   }

            //   return row[filter.id] === filter.value;
            // },
            // Filter: ({ filter, onChange }) => (
            //   <FilterSelect filter={filter} onChange={onChange} options={sampleCountryList} />
            // )
        },
        {
            field: 'state',
            headerName: 'Region',
            width: 150,
            valueGetter: param =>
                !param.row.state || param.row.state === 'Unknown' ? '' : param.row.state
        },
        {
            field: 'city',
            headerName: 'City',
            width: 150,
            valueGetter: param =>
                !param.row.city || param.row.city === 'Unknown' ? '' : param.row.city
        },
        {
            field: 'device_id',
            headerName: 'Device ID',
            width: 150,
            valueGetter: param =>
                !param.row.device_id || param.row.device_id === 'Unknown' ? '' : param.row.device_id
        },
        {
            field: 'os',
            headerName: 'Operating System',
            width: 150,
            valueGetter: param =>
                param.row.os && param.row.os !== 'undefined%20undefined' ?
                decodeURI(param.row.os).replace(/\s|\.|[0-9]/g, '') :
                'Unknown',
            renderCell: param => {
                return (
                    <div className={styles.iconAndCellValue}>
                        {createElement(getOSIcon(param.value), {
                            style: {
                                height: '24px',
                                width: '24px'
                            }
                        })}
                        {' '}
                        {param.value}
                    </div>
                );
            }
            // filterMethod: (filter, row) => {
            //   if (filter.value === 'all') {
            //     return true;
            //   }

            //   return row[filter.id].includes(filter.value);
            // },
            // Filter: ({ filter, onChange }) => (
            //   <FilterSelect filter={filter} onChange={onChange} options={sampleOSList} />
            // )
        },
        {
            field: 'browser',
            headerName: 'Browser',
            width: 120,
            valueGetter: param =>
                param.row.browser && param.row.browser !== 'undefined%20undefined' ?
                decodeURI(param.row.browser).replace(/\s|\.|[0-9]/g, '') :
                'Unknown',
            renderCell: param => {
                return (
                    <div className={styles.iconAndCellValue}>
                        {createElement(getBrowserIcon(param.value), {
                            style: {
                                height: '24px',
                                width: '24px'
                            }
                        })}
                        {' '}
                        {param.value}
                    </div>
                );
            }
            // filterMethod: (filter, row) => {
            //   if (filter.value === 'all') {
            //     return true;
            //   }

            //   return row[filter.id] === filter.value;
            // },
            // Filter: ({ filter, onChange }) => (
            //   <FilterSelect filter={filter} onChange={onChange} options={sampleDeviceList} />
            // )
        },
        {
            field: 'clickType',
            headerName: 'Device Type',
            width: 150,
            valueGetter: param =>
                !param.row.clickType || param.row.clickType === 'Unknown' ? '' : param.row.clickType
        },
        {
            field: 'click_id',
            headerName: 'Click ID'
        },
        {
            field: 'utm_source',
            width: 150,
            headerName: 'UTM Source',
            valueGetter: param => decodeURIComponent(param.row.utm_source || '')
        },
        {
            field: 'utm_medium',
            width: 150,
            headerName: 'UTM Medium',
            valueGetter: param => decodeURIComponent(param.row.utm_medium || '')
        },
        {
            field: 'utm_campaign',
            width: 150,
            headerName: 'UTM Campaign',
            valueGetter: param => decodeURIComponent(param.row.utm_campaign || '')
        },
        {
            field: 'utm_term',
            width: 150,
            headerName: 'UTM Term',
            valueGetter: param => decodeURIComponent(param.row.utm_term || '')
        },
        {
            field: 'referer',
            width: 150,
            headerName: 'Referer URL'
        },
        {
            field: 'cpid',
            headerName: 'Campaign ID'
        },
        {
            field: 'agid',
            headerName: 'Ad Group ID'
        },
        {
            field: 'kw',
            headerName: 'Keyword'
        },
        {
            field: 'net',
            headerName: 'Network'
        },
        {
            field: 'creative',
            headerName: 'Creative ID'
        },
        {
            field: 'loc_physical_ms',
            headerName: 'Physical Location'
        },
        {
            field: 'loc_interest_ms',
            headerName: 'Location Interest'
        },
        {
            field: 'dv',
            headerName: 'Device'
        },
        {
            field: 'mt',
            headerName: 'Match Type'
        },
        {
            field: 'pl',
            headerName: 'Placement'
        },
        {
            field: 'lpurl',
            headerName: 'Landing Page URL'
        }
    ];
    // const tableStyle = { maxHeight };

    return (
        <>
            <div style={{ height: 700, width: '100%' }}>
                <DataGridPremium
                    sx={{
                        '& .MuiDataGrid-row': {
                            fontSize: '14px',
                            color: '#4a4a4a'
                        },
                        '& .MuiDataGrid-menuIcon': {
                            marginRight: '0px'
                        },
                        '& .MuiDataGrid-columnSeparator--sideRight': {
                            paddingRight: '5px'
                        }
                    }}
                    rows={results}
                    columns={cols}
                    loading={loading}
                    pagination
                    getRowId={row => row.rowId}
                    onFilterModelChange={onFilterChange}
                    initialState={{
                        pinnedColumns: { left: ['ip'] }
                    }}
                    slots={{
                        toolbar: CustomToolbar,
                        noRowsOverlay: () => (
                            <div className={styles.noData}>
                                <img src={EMPTY_REPORT} alt="Empty report" />
                                <div className={styles.noDataText}>
                                    No traffic from advertising detected.
                                    <br />
                                    <span
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate('/integrations')}
                                    >
                                        Verify your Fraud Tracker installation.
                                    </span>
                                </div>
                            </div>
                        )
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

ReportsTable.propTypes = {
    results: PropTypes.array.isRequired,
    ipBlocklist: PropTypes.array,
    onStatusChange: PropTypes.func.isRequired,
    maxHeight: PropTypes.number,
    loading: PropTypes.bool,
    accounts: PropTypes.object,
    activeDomain: PropTypes.object
};

ReportsTable.defaultProps = {
    ipBlocklist: []
};

export default ReportsTable;