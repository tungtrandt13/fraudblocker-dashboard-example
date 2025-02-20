import * as IpAddress from "ip-address";
import { parseDomain, fromUrl } from "parse-domain";
import Utils from "./Utils";

// const { validExtensions } = Constants;

const validEmail = (email) => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const valid = re.test(String(email).toLowerCase());
    if (!valid) {
        return "Please enter a valid email address.";
    }
    return "";
};

const validPassword = (password) => {
    if (!password || password.length < 8) {
        return "Please enter a valid password.";
    }
    return "";
};

const validateForm = (data) => {
    const newErrors = {};

    Object.keys(data).forEach((key) => {
        const { [key]: value } = data;
        if (!value || value.length < 1) {
            newErrors[key] = "Field is required.";
        } else {
            if (key === "email") {
                const emailCheck = validEmail(value);
                if (emailCheck.length > 0) {
                    newErrors[key] = emailCheck;
                }
            }
            if (key === "password") {
                const passwordCheck = validPassword(value);
                if (passwordCheck.length > 0) {
                    newErrors[key] = passwordCheck;
                }
            }
            if (key === "domain") {
                if (value && value.includes("@")) {
                    newErrors[key] = "Please enter a valid domain";
                } else {
                    const parseResult = parseDomain(fromUrl(value));
                    if (parseResult) {
                        if (parseResult.type !== "LISTED") {
                            newErrors[key] = "The entered domain is not valid";
                        }
                    } else {
                        newErrors[key] = "Please enter a valid domain";
                    }
                }
            }
        }
    });

    if (Object.entries(newErrors).length > 0) {
        return newErrors;
    }

    return false;
};

const validIpAddress = (ipAddress) => {
    const ipv6Regex =
        /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gi;
    const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:\*|\?)$/;
    try {
        const address4 = new IpAddress.Address4(ipAddress);
        if (address4) {
            return true;
        }
    } catch (err) {
        try {
            const address6 = new IpAddress.Address6(ipAddress);
            if (address6) {
                return true;
            }
        } catch (e) {
            return ipv4Regex.test(ipAddress) || ipv6Regex.test(ipAddress);
        }
    }
    return false;
};

const userHasAllRequiredFields = (user, accountData, subscription) => {
    if (
        user.email === null ||
        !accountData ||
        !accountData.stripe_token ||
        !accountData.billing_email ||
        !subscription ||
        !subscription.subscriptions ||
        !subscription.subscriptions.data.length ||
        (!(subscription.sources && subscription.sources.data.length) && !subscription.ig && !user.appsumo_plan_uuid)
        // user.email === null ||
        // (user.email !== 'mike.schrobo+XX@gmail' &&
        //   !user.email.includes('antonio4924@') &&
        //   !user.email.includes('rahul@bsidestudios') &&
        //   !user.email.includes('rahul15@bsidestudios') &&
        //   !user.email.includes('developer@fraudblocker') &&
        //   !user.email.includes('rahul17@bsidestudios') &&
        //   !user.email.includes('rahul77@bsidestudios') &&
        //   !user.email.includes('anton3@bsidestudios'))
        // user.first_name === null ||
        // user.last_name === null ||
        // account.billing_address === null ||
        // account.billing_city === null ||
        // account.billing_state === null ||
        // account.billing_zip === null
    ) {
        return false;
    }

    return true;
};

/**
 * Checks if user has subscriptions from Stripe;
 * @param {object} subscription
 *
 */
const userHasSubscription = (subscription) => {
    if (!subscription || subscription.subscriptions.data.length < 1) {
        return false;
    }

    return true;
};

/**
 * Checks if user has valid subscription
 * Returns true if subscription is in state active or trialing
 * All other states return false.
 * TODO: return reason for invalid state.
 * @TODO we NEED to move this whole check server side.
 */
const hasValidSubscription = (accounts) => {
    if (accounts.data.ig === true) return true;

    const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
    if (subscription) {
        if (subscription.status === "trialing" || subscription.status === "active") {
            return true;
        }
        if (
            subscription.status === "canceled" &&
            subscription.plan &&
            subscription.plan.nickname &&
            !subscription.plan.nickname.toLowerCase().includes("appsumo") &&
            subscription.current_period_end > Math.round(+new Date() / 1000)
        ) {
            return true;
        }
        if (
            subscription.appSumoSubscription &&
            ["active", "trialing"].includes(subscription.appSumoSubscription.status)
        ) {
            return true;
        }
        console.log("Issue with subscription");
    } else {
        console.log("No Subscriptions found.");
    }
    return false;
};

export default {
    validateForm,
    userHasAllRequiredFields,
    userHasSubscription,
    hasValidSubscription,
    validIpAddress,
};
