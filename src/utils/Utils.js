import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import Constants from "./Constants";

const getAccessToken = (type) => {
    return localStorage.getItem(type) || null;
};

const setAccessToken = (type, accessToken) => {
    localStorage.setItem(type, accessToken);
};

const formatCurrencyForLocale = (amount, currency = "USD", toFixed = false) => {
    let computedValue = toFixed ? Number(amount.toFixed(2)).toLocaleString("en-US") : amount.toLocaleString("en-US");
    if (["EUR", "BRL", "HUF", "CHF", "VND", "PLN", "NOK"].includes(currency)) {
        computedValue = computedValue.replace(/,/g, "_").replace(/\./g, ",").replace(/_/g, ".");
    }
    if (currency === "PLN" || currency === "RON") {
        return `${computedValue} ${Constants.currencySymbols[currency] || "$"}`;
    }
    return `${Constants.currencySymbols[currency] || "$"}${computedValue}`;
};

const convertToCurrencyNumeric = (rates, amount, currency = "USD", noRound = false) => {
    if (!rates || !currency || !amount) {
        return amount;
    }
    if (currency === "CAN") {
        return noRound ? amount * rates.CAD : Math.round(amount * rates.CAD);
    }
    return noRound ? amount * rates[currency] : Math.round(amount * rates[currency]);
};

const convertToCurrency = (rates, amount, currency = "USD", noRound = false, toFixed = false) => {
    const computedAmount = convertToCurrencyNumeric(rates, amount, currency, noRound);
    return formatCurrencyForLocale(computedAmount, currency, toFixed);
};

const convertToUSD = (rates, amount, currency = "USD", noRound = false) => {
    if (!rates || !currency || !amount || currency === "USD") {
        return amount;
    }
    if (currency === "CAN") {
        return noRound ? amount * (rates.USD / rates.CAD) : Math.round(amount * (rates.USD / rates.CAD));
    }
    return noRound ? amount * (rates.USD / rates[currency]) : Math.round(amount * (rates.USD / rates[currency]));
};

const calcFraudScore = (percentBlocked, decimal = 2) => {
    if (percentBlocked >= 30) {
        return 10;
    }
    return Constants.roundAmount(percentBlocked / 3, decimal);
};

// const parseTime = (time, timezone) => {
//   return moment.tz(time, timezone.split(') ')[1]).format('YYYY-MM-DD hh:mm:ss A');
// };

const parseTimeUnformatted = (time, timezone) => {
    return moment.tz(time, timezone.split(") ")[1]);
};

const formatTimeAndAddRowIdInReports = (reports = [], timezone) => {
    return reports.map((item) => {
        return {
            ...item,
            rowId: uuidv4(),
            firstSeen: item.firstSeen
                ? {
                      value: parseTimeUnformatted(item.firstSeen, timezone),
                  }
                : undefined,
            lastSeen: item.lastSeen
                ? {
                      value: parseTimeUnformatted(item.lastSeen, timezone),
                  }
                : undefined,
        };
    });
};

const getSubscriptionClicksAndDomains = (subscription) => {
    if (subscription.appSumoSubscription) {
        return {
            clicks: (
                Number(subscription.plan.metadata.clicks) +
                Number(subscription.appSumoSubscription.plan.metadata.clicks)
            ).toString(),
            domains:
                subscription.appSumoSubscription.plan.metadata.domains === "unlimited" ||
                subscription.plan.metadata.domains === "unlimited"
                    ? "unlimited"
                    : (
                          Number(subscription.plan.metadata.domains) +
                          Number(subscription.appSumoSubscription.plan.metadata.domains)
                      ).toString(),
        };
    }
    return {
        clicks: subscription.plan.metadata.clicks,
        domains: subscription.plan.metadata.domains,
    };
};

const getSingleSubscription = (accounts, accountId) => {
    const {
        subscriptions = {
            data: [],
        },
    } = accounts.subscription || {};
    if (!subscriptions.data.length) {
        return null;
    }
    if (subscriptions.data.length === 1) {
        // if there is only one subscription, then return that whether or not it's active
        return {
            ...subscriptions.data[0],
        };
    }
    // if there are more than one subscriptions, it means its an old account so try to get an active one first.

    const filteredSubscriptions = subscriptions.data.filter(
        (item) =>
            item.metadata.account_id === accountId &&
            (item.status === "trialing" ||
                item.status === "active" ||
                (item.status === "canceled" && item.current_period_end > Math.round(+new Date() / 1000)))
    );

    if (!filteredSubscriptions.length) {
        return null;
    }

    let subscription =
        filteredSubscriptions.find((item) => item.metadata.account_id === accountId && item.status === "active") ||
        filteredSubscriptions[0];

    if (filteredSubscriptions.length > 1) {
        const boosterSubscription = filteredSubscriptions.find((item) =>
            item.plan.nickname.toLowerCase().includes("boost")
        );
        if (boosterSubscription) {
            const appSumoSubscription = filteredSubscriptions.find((item) =>
                item.plan.nickname.toLowerCase().includes("appsumo tier")
            );
            if (appSumoSubscription) {
                subscription = {
                    ...boosterSubscription,
                    status: appSumoSubscription.status === "canceled" ? "canceled" : boosterSubscription.status,
                    appSumoSubscription,
                };
            }
        }
    }
    const latestSubscription = subscription || subscriptions.data[0];

    const { clicks, domains } = getSubscriptionClicksAndDomains(latestSubscription);

    return {
        ...latestSubscription,
        plan: {
            ...latestSubscription.plan,
            metadata: { ...latestSubscription.plan.metadata, clicks, domains },
        },
    };
};

const roundUpto = (value, precision) => {
    // eslint-disable-next-line no-restricted-properties
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
};

const setCookie = (name, value, days = 1) => {
    let expires = "";
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; Expires=${date.toUTCString()}`;
    if (window.location.href.includes("localhost")) {
        document.cookie = `${name}=${value || ""}${expires}; Path=/`;
    } else {
        document.cookie =
            days >= 1
                ? `${name}=${value || ""}${expires}; Path=/; Domain=.fraudblocker.com`
                : `${name}=${value || ""}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path=/; Domain=.fraudblocker.com`;
    }
};

const sanitizeTimezoneString = (timezone) => {
    const bracketIndex = timezone.indexOf(") ");
    if (bracketIndex > -1) {
        return timezone.substr(bracketIndex + 2);
    }
    return timezone;
};

const isMobileOrTablet = () => {
    let check = false;
    // eslint-disable-next-line no-useless-escape
    (function (a) {
        if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
                a
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                a.substr(0, 4)
            )
        )
            check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

const calculateSavedAmount = (adClicks = 0, blockedClicksPercent = 0, cpc = 2) => {
    const improvedPercentCalc = blockedClicksPercent - 6 + 5;
    const improvedPercent = improvedPercentCalc >= 0 ? improvedPercentCalc : 0;
    return ((adClicks * improvedPercent) / 100) * (cpc || 2);
};

const sortAllPlans = (plans) => {
    const planOptions = plans.sort((plan1, plan2) => {
        return plan2.created - plan1.created;
    });
    return planOptions.sort((plan1, plan2) => {
        return Number(plan1.metadata.clicks) - Number(plan2.metadata.clicks);
    });
};

export default {
    getAccessToken,
    setAccessToken,
    convertToCurrency,
    convertToCurrencyNumeric,
    formatCurrencyForLocale,
    convertToUSD,
    calcFraudScore,
    formatTimeAndAddRowIdInReports,
    getSingleSubscription,
    roundUpto,
    getCookie,
    setCookie,
    sanitizeTimezoneString,
    isMobileOrTablet,
    calculateSavedAmount,
    sortAllPlans,
};
