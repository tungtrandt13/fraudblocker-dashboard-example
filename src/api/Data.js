import API_URL from "../config/Api";

/**
 * Get Requests from Big Query data tables
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD'
 * }
 * @param {String} filter
 */
const getRequests = async (data, filter) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    let url = `${API_URL}/bigquery/requests`;
    if (filter) {
        url += `?${filter}`;
    }

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Requests Error: ", error);
        throw error;
    }
};

/**
 * Get Offenders from Big Query data tables
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD'
 * }
 * @param {String} filter
 */
const getOffenders = async (data, filter) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    let url = `${API_URL}/bigquery/offenders`;
    if (filter) {
        url += `?${filter}`;
    }

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Offenders Error: ", error);
        throw error;
    }
};

/**
 * Get traffic report ONLY for google adwords clicks
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getAdReports = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/ad-reports`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Offenders from Big Query data tables
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getReports = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/reports`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Stats from Big Query
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getStats = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/stats`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Dashboard Summary from Big Query
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getDashboardSummary = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/dashboard-summary`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Organic Stats from Big Query
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getOrganicStats = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/organic-stats`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Dashboard Chart from Big Query
 * @param {Object} data {
 * startDate: 'YYYYMMDD',
 * endDate: 'YYYYMMDD',
 * sid: string
 * }
 */

const getDashboardChart = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/dashboard-chart`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

/**
 * Get Site Clicks from Big Query
 * @param {Object} data {
 * sid: string
 * }
 */

const getSiteClicks = async (data, signal) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const url = `${API_URL}/bigquery/site-clicks`;

    try {
        if (signal) {
            settings.signal = signal;
        }
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

const getAllSitesClicks = async (accountId, subscriptionId, timezone, signal) => {
    const settings = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const url = `${API_URL}/bigquery/all-site-clicks/${accountId}/${subscriptionId}?timezone=${timezone}`;

    try {
        if (signal) {
            settings.signal = signal;
        }
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Reports Error: ", error);
        throw error;
    }
};

const checkInstallation = async (sid) => {
    const settings = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const url = `${API_URL}/bigquery/check-pixel?sid=${sid}`;

    try {
        const response = await fetch(url, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Check Installation Error: ", error);
        throw error;
    }
};

export default {
    getRequests,
    getAdReports,
    getOffenders,
    getReports,
    getOrganicStats,
    getStats,
    getDashboardSummary,
    getDashboardChart,
    getSiteClicks,
    getAllSitesClicks,
    checkInstallation,
};
