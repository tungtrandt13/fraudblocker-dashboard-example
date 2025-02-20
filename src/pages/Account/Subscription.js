import React, { useState, useEffect, useRef } from "react";
import { Elements, StripeProvider } from "react-stripe-elements";
import { connect } from "react-redux";
import { Tooltip as ReactTooltip } from "react-tooltip";
import moment from "moment";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import qs from "qs";
import styles from "./Account.module.scss";
import Button from "../../components/Button/Button";
import UpdateCardModal from "../../containers/UpdateCardModal/UpdateCardModal";
import UnprotectedAccountModal from "../../containers/UnprotectedAccountModal/UnprotectedAccountModal";
import ComparePlanModal from "../../containers/ComparePlanModal/ComparePlanModal";
import BoosterPlanModal from "../../containers/BoosterPlanModal/BoosterPlanModal";
import CancelPlanModal from "../../containers/CancelPlanModal/CancelPlanModal";
import Account from "../../redux/actions/Account";
import Domains from "../../api/Domains";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Payments from "../../api/Payments";
import Data from "../../api/Data";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import { ReactComponent as Visa } from "../../assets/cards/visa.svg";
import { ReactComponent as Master } from "../../assets/cards/mastercard.svg";
import { ReactComponent as Discover } from "../../assets/cards/discover.svg";
import { ReactComponent as Amex } from "../../assets/cards/amex.svg";
import { ReactComponent as CCImage } from "../../assets/ccicon.svg";
import UpgradePlanSuccessModal from "../../containers/UpgradePlanSuccessModal/UpgradePlanSuccessModal";
import AddDomainSuccessModal from "../../containers/AddDomainSuccessModal/AddDomainSuccessModal";
import UpgradePlanDeclineModal from "../../containers/UpgradePlanDeclineModal/UpgradePlanDeclineModal";
import AddDomainModal from "../../containers/AddDomainModal/AddDomainModal";
import ConfirmPlanModal from "../../containers/ConfirmPlanModal/ConfirmPlanModal";
import DomainLimitModal from "../../containers/DomainLimitModal/DomainLimitModal";
import ActiveDomain from "../../redux/actions/ActiveDomain";

// Images
import Reactivate from "../../assets/reactivate.png";
import Crown from "../../assets/crown-img.svg";
import Taco from "../../assets/taco.svg";
import BoosterPaymentModal from "../../containers/BoosterPaymentModal/BoosterPaymentModal";
import CancelReasonModal from "../../containers/CancelReasonModal/CancelReasonModal";
import CancelReasonSolutionModal from "../../containers/CancelReasonSolutionModal/CancelReasonSolutionModal";
import ActionSuccessModal from "../../containers/ActionSuccessModal/ActionSuccessModal";

const { subscriptionWarnings, currencySymbols, currencyOptions } = Constants;

const customStyles = {
    addDomainBtn: {
        width: "auto",
        minWidth: 125,
        maxWidth: 125,
        marginRight: 15,
        border: "none",
        fontWeight: "normal",
        color: "#286cff",
    },
    saveBtn: {
        width: "auto",
        minWidth: 125,
    },
    headerDescription: {
        display: "block",
        fontSize: "12px",
        lineHeight: "24px",
        marginTop: "5px",
        color: "#6f6f6f",
        textDecoration: "underline",
        fontWeight: "normal",
    },
    link: {
        color: "#1660ff",
        fontWeight: "400",
        textDecoration: "underline",
    },
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#eaedf3",
        marginTop: 30,
        marginBottom: 30,
    },
    totalMonthlyPriceContainer: {
        display: "flex",
        gap: "50px",
    },
    totalMonthlyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#2b2c33",
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2b2c33",
        marginRight: 60,
    },
    billedToText: {
        marginTop: 0,
    },
    footerBtnContainer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: 20,
    },
    deleteAccountBtn: {
        width: "auto",
        maxWidth: 200,
        border: `solid 1px #c9cdd8`,
        backgroundColor: "#f1f1f4",
        color: "#8a8d91",
    },
    cancelSubBtn: {
        width: "auto",
        maxWidth: 200,
        fontSize: 12,
        padding: "12px 30px",
        lineHeight: "14px",
        border: "none",
        color: "#5c5c5c",
        backgroundColor: "rgba(210, 210, 210, 0.1)",
        fontWeight: "normal",
        marginLeft: "auto",
    },
    removeBtn: {
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10,
        cursor: "pointer",
        fontSize: 12,
        height: 17,
        width: "auto",
    },
    updateCard: {
        marginLeft: "70px",
    },
    noCardWrap: {
        padding: "24px",
        borderRadius: "8px",
        border: "solid 1px #e4e4e4",
        marginTop: "15px",
        marginBottom: "22px",
        textAlign: "center",
        backgroundColor: "#fdfdff",
    },
    ccIcon: {
        marginLeft: "auto",
        marginRight: "auto",
        width: "40px",
        height: "40px",
        marginBottom: "11px",
        display: "block",
    },
    payInfo: {
        fontSize: "11px",
        marginBottom: "6px",
        color: "#2b2c34",
        fontWeight: "bold",
    },
    noCard: {
        color: "#4a4a4a",
        fontSize: "14px",
        marginBottom: "11px",
    },
    newCard: {
        fontSize: "14px",
        color: "#1660ff",
    },
    redButton: {
        border: "1px solid #fc584e",
        color: "#fc584e",
        background: "transparent",
    },
    currencyDropdown: {
        width: "100px",
    },
};

const Subscription = ({
    accounts,
    activeDomain,
    auth,
    getUserSubscriptions,
    fetchLatestAccount,
    location,
    history,
    setDomain,
}) => {
    const [originalDomains, setOriginalDomains] = useState([]);
    const [domains, setDomains] = useState([]);
    const [errors, setErrors] = useState({});
    const [visiblePlan, setVisiblePlan] = useState("primary");
    const [deletedDomainsExpanded, setDeletedDomainsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState({});
    const [successActions, setSuccessActions] = useState([]);
    const [planDropdownOptions, setPlanDropdownOptions] = useState([]);
    const [allPlans, setAllPlans] = useState([]);
    const [clicks, setClicks] = useState({});
    const [removeIndex, setRemoveIndex] = useState("");
    const [showDomainLimitModal, setShowDomainLimitModal] = useState(false);
    const [domainLimitIndex, setDomainLimitIndex] = useState("");
    const [restoreIndex, setRestoreIndex] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
    const [showComparePlanModal, setShowComparePlanModal] = useState(
        window.location.href.includes("#") &&
            (!location?.state || (!location?.state.forceAddDomain && !location?.state.invalidSubscription))
            ? "switch"
            : null
    );
    const [showBoosterPlanModal, setShowBoosterPlanModal] = useState(null);
    const [showConfirmPlanModal, setShowConfirmPlanModal] = useState(false);
    const [upgradePlanModal, setUpgradePlanModal] = useState(false);
    const [showActionSuccessModal, setShowActionSuccessModal] = useState(false);
    const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
    const [showAddDomainModal, setShowAddDomainModal] = useState(
        location?.state ? location?.state.forceAddDomain : false
    );
    const [forceToAdd, setForceToAdd] = useState(location?.state ? location?.state.forceAddDomain : false);
    const [showDomainSuccessModal, setShowDomainSuccessModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showUpgradeSuccessModal, setShowUpgradeSuccessModal] = useState(false);
    const [showCancelResolutionModal, setShowCancelResolutionModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showUpgradeErrorModal, setShowUpgradeErrorModal] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [totalClicks, setTotalClicks] = useState(0);
    const [currency, setCurrency] = useState(currencyOptions[0]);
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [discountError, setDiscountError] = useState(null);
    const [selectedBilling, setSelectedBilling] = useState(null);
    const [showActionRequiredModal, setShowActionRequiredModal] = useState(
        location?.state ? location?.state.invalidSubscription : false
    );
    const [isBooster, setIsBooster] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [discount, setDiscount] = useState(null);
    const controller = useRef(new AbortController());

    const setDiscountFn = async () => {
        const { offer_id: couponIdFromQuery, afmc: otherCouponIdFromQuery } = qs.parse(window.location.search, {
            ignoreQueryPrefix: true,
        });
        const afmcCoupon = otherCouponIdFromQuery || Utils.getCookie("afmc");
        const offerCoupon = couponIdFromQuery || Utils.getCookie("offer_id");
        const couponRes = {
            error: "",
            discount: 0,
        };

        if (afmcCoupon) {
            try {
                const coupon = await Payments.getCouponDetails(afmcCoupon);
                if (coupon) {
                    Utils.setCookie("offer_id", "", -1);
                    couponRes.discount = coupon.percent_off;
                    setDiscount(coupon.percent_off);
                }
            } catch (error) {
                Utils.setCookie("afmc", "", -1);
                couponRes.error = error.message;
            }
        }

        if (offerCoupon && !couponRes.discount) {
            try {
                const otherCoupon = await Payments.getCouponDetails(offerCoupon);
                if (otherCoupon) {
                    Utils.setCookie("afmc", "", -1);
                    couponRes.discount = otherCoupon.percent_off;
                    setDiscount(otherCoupon.percent_off);
                }
            } catch (err) {
                Utils.setCookie("offer_id", "", -1);
                couponRes.error = err.message;
            }
        }

        if ((afmcCoupon || offerCoupon) && !couponRes.discount) {
            setDiscountError(couponRes.error);
        }
    };

    useEffect(() => {
        if (location?.state && location?.state.invalidSubscription) {
            history.replace();
        }
        fetchAllPlans();
        if (auth.user && auth.user.currency) {
            setCurrency(currencyOptions.find((item) => item.value === auth.user.currency));
        }
        setDiscountFn();
        return () => {
            controller.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleVisiblePlan = () => {
        setVisiblePlan(visiblePlan === "primary" ? "booster" : "primary");
    };

    const toggleDeletedDomains = () => {
        setDeletedDomainsExpanded(!deletedDomainsExpanded);
    };

    const onCurrencyChange = (val) => {
        setCurrency(val);
    };

    const fetchSitesClicks = async (accountId) => {
        try {
            const { timezone } = auth.user;
            const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
            if (!subscription) {
                return 0;
            }
            const result = await Data.getAllSitesClicks(
                accountId,
                subscription.id,
                timezone,
                controller.current.signal
            );
            if (result && !result.errno) {
                const totalClicksResult = result.reduce((acc, item) => acc + item.clicks, 0);
                const clicksMap = result.reduce((acc, item) => ({ ...acc, [item.sid]: item.clicks }), {});
                setClicks(clicksMap);
                setTotalClicks(totalClicksResult);
                return result;
            }
            return 0;
        } catch (error) {
            console.log(error);
            return 0;
        }
    };

    const getSiteClicks = async () => {
        const { user } = auth;
        await fetchSitesClicks(user.account_id);
    };

    const listDomains = async () => {
        const allDomains =
            accounts &&
            accounts.data &&
            accounts.data.domains.map((domain) => {
                const result = {
                    id: domain.id,
                    name: domain.domain_name,
                    is_deleted: domain.is_deleted,
                    clicks_limit: domain.clicks_limit,
                };
                return result;
            });

        let filteredDomains = [
            (allDomains || []).find((domain) => domain.id === activeDomain.data.id),
            ...(allDomains || []).filter((domain) => domain.id !== activeDomain.data.id),
        ];

        filteredDomains = filteredDomains.filter((item) => !!item).sort((a, b) => (a.name > b.name ? 1 : -1));

        const originalDomainsCopy = JSON.parse(JSON.stringify(filteredDomains)); // Copy of filteredDomains

        setOriginalDomains(originalDomainsCopy);
        setDomains(filteredDomains);
        setErrors({});
        setLoading(false);

        window.setTimeout(() => {
            getSiteClicks();
        }, 100);
    };

    useEffect(() => {
        if (accounts && accounts.data && accounts.data.domains && domains.length !== accounts.data.domains.length) {
            listDomains();
        }
        ReactTooltip.rebuild();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts]);

    const fetchAllPlans = async () => {
        try {
            const result = await Payments.getAllPlans();
            const plans = result.data.map((plan) => ({
                id: plan.id,
                nickname: plan.nickname,
                plan: plan.nickname.split(" - ")[0],
                trial_period_days: plan.trial_period_days || 30,
                interval: plan.interval,
                interval_count: plan.interval_count,
                price: plan.nickname.toLowerCase().includes("appsumo tier")
                    ? plan.metadata.plan_value
                        ? Number(plan.metadata.plan_value)
                        : 0
                    : plan.amount / 100,
                clicks: parseInt(plan.metadata.clicks, 10),
                domains: plan.metadata.domains,
            }));

            setPlanDropdownOptions(plans);
            setAllPlans(result.data);
            listDomains();
        } catch (error) {
            console.log(error);
        }
    };

    const onClickAddDomain = () => {
        setShowAddDomainModal(true);
    };

    const onClickDeleteAccountBtn = () => {
        console.log("Delete Account");
    };

    const openUpgradeSuccessModal = () => {
        setShowUpgradeSuccessModal(!showUpgradeSuccessModal);
        setSwitching(false);
    };

    const openDomainLimitModal = (index) => {
        setShowDomainLimitModal(true);
        setDomainLimitIndex(index);
    };

    const closeDomainLimitModal = (reloadDomains = false) => {
        setShowDomainLimitModal(false);
        setDomainLimitIndex("");
        if (reloadDomains) {
            listDomains();
        }
    };

    const openUpgradeErrorModal = () => {
        setShowUpgradeErrorModal(!showUpgradeErrorModal);
        setSwitching(false);
    };

    const onClickSaveBtn = async (plan, upgradeOrDowngrade) => {
        const coupon = discount && (Utils.getCookie("afmc") || Utils.getCookie("offer_id"));
        try {
            setSaveLoading(true);
            setErrors({});
            setShowSuccess({});
            const promises = [];
            if (
                subscription &&
                subscription.status !== "canceled" &&
                (!plan.plan.toLowerCase().includes("boost") ||
                    subscription.plan.nickname.toLowerCase().includes("boost"))
            ) {
                const data = {
                    items: [
                        {
                            id: subscription.items.data[0].id,
                            plan: plan.id,
                        },
                    ],
                    coupon: coupon || undefined,
                };
                promises.push(Payments.updateCustomerSubscription(subscription.id, data));
            } else if (
                subscription &&
                (subscription.status === "canceled" || plan.plan.toLowerCase().includes("boost"))
            ) {
                const subscribeData = {
                    customer: accounts.data.stripe_token,
                    subscriptionId: subscription.id,
                    items: [
                        {
                            plan: plan.id,
                        },
                    ],
                    metadata: {
                        account_id: accounts.data.id,
                    },
                    coupon: coupon || undefined,
                };
                promises.push(Payments.subscribeCustomerToPlan(subscribeData));
            } else {
                const subscribeData = {
                    customer: accounts.data.stripe_token,
                    items: [
                        {
                            plan: plan.id,
                        },
                    ],
                    metadata: {
                        account_id: accounts.data.id,
                    },
                    coupon: coupon || undefined,
                };
                promises.push(Payments.subscribeCustomerToPlan(subscribeData));
            }

            await Promise.all(promises);
            if (!upgradeOrDowngrade) {
                window.Intercom("trackEvent", "account-subscription", {
                    plan: plan.plan,
                    coupon: coupon || undefined,
                });
            }
            if (upgradeOrDowngrade === 1) {
                if (plan.plan.toLowerCase().includes("boost")) {
                    window.Intercom("trackEvent", "booster-upgraded", {
                        plan: plan.plan,
                        clicks: plan.clicks,
                        interval: plan.interval,
                        interval_count: plan.interval_count,
                        coupon: coupon || undefined,
                    });
                } else {
                    window.Intercom("trackEvent", "account-upgrade", {
                        plan: plan.plan,
                        clicks: plan.clicks,
                        interval: plan.interval,
                        interval_count: plan.interval_count,
                        coupon: coupon || undefined,
                    });
                }
            } else if (upgradeOrDowngrade === -1) {
                if (plan.plan.toLowerCase().includes("boost")) {
                    window.Intercom("trackEvent", "booster-downgraded", {
                        plan: plan.plan,
                        clicks: plan.clicks,
                        interval: plan.interval,
                        interval_count: plan.interval_count,
                        coupon: coupon || undefined,
                    });
                } else {
                    window.Intercom("trackEvent", "account-downgrade", {
                        plan: plan.plan,
                        clicks: plan.clicks,
                        interval: plan.interval,
                        interval_count: plan.interval_count,
                        coupon: coupon || undefined,
                    });
                }
            }
            await fetchLatestSubscriptionInfo();
            openUpgradeSuccessModal();
            setSaveLoading(false);
            setErrors({});
            setSwitching(false);
            setSelectedBilling(null);
            setShowConfirmPlanModal(false);
            setShowPaymentModal(false);
            setShowSuccess({
                message: "Subscription plan updated",
            });
        } catch (error) {
            console.log(error);
            openUpgradeErrorModal();
            setSaveLoading(false);
            setShowPaymentModal(false);
            setSelectedBilling(null);
            setSwitching(false);
            setShowConfirmPlanModal(false);
            setShowSuccess({});
            setErrors({
                saveError: error.message,
            });
        }
    };

    const onClickRemoveDomain = async (index) => {
        const selectedDomain = domains[index];

        try {
            await Domains.removeDomain(selectedDomain.id);
            setRemoveIndex(index);
            await fetchLatestAccount(accounts.data.id, (accountsResponse) => {
                listDomains();
                setShowSuccess({
                    message: `${selectedDomain.name} has been removed.`,
                });
                setErrors({});
                setRemoveIndex("");
                if (
                    accountsResponse &&
                    accountsResponse.domains &&
                    !accountsResponse.domains.filter((item) => item.is_deleted === false).length
                ) {
                    setDomain({});
                    setShowAddDomainModal(true);
                    setForceToAdd(true);
                }
            });
        } catch (error) {
            setErrors({
                removeError: error.message,
            });
        }
    };

    const restoreDomain = async (index) => {
        if (restoreIndex) {
            return;
        }
        const selectedDomain = domains[index];

        try {
            await Domains.restoreDomain(selectedDomain.id);
            setRestoreIndex(index);
            await fetchLatestAccount(accounts.data.id, () => {
                listDomains();
                setShowSuccess({
                    message: `${selectedDomain.name} has been restored.`,
                });
                setErrors({});
                setRestoreIndex("");
            });
        } catch (error) {
            setErrors({
                removeError: error.message,
            });
        }
    };

    const onClickUpdateCard = () => {
        toggleUpdateCardModal();
    };

    const getCardIcon = (brand) => {
        if (brand.includes("visa")) {
            return (
                <>
                    <Visa className={styles.cardIcon} /> & nbsp;{" "}
                </>
            );
        }
        if (brand.includes("master")) {
            return (
                <>
                    <Master className={styles.cardIcon} /> & nbsp;{" "}
                </>
            );
        }
        if (brand.includes("discover")) {
            return (
                <>
                    <Discover className={styles.cardIcon} /> & nbsp;{" "}
                </>
            );
        }
        if (brand.includes("amex") || brand.includes("american")) {
            return (
                <>
                    <Amex className={styles.cardIcon} /> & nbsp;{" "}
                </>
            );
        }
        return "";
    };

    const toggleUpdateCardModal = () => {
        setShowUpdateCardModal(!showUpdateCardModal);
        setShowActionRequiredModal(false);
    };

    const toggleCancelModal = () => {
        setShowCancelModal(!showCancelModal);
    };

    const toggleCancelReasonModal = (isBoosterParam = false) => {
        setShowCancelReasonModal(!showCancelReasonModal);
        setIsBooster(isBoosterParam);
        setShowComparePlanModal(false);
        setShowBoosterPlanModal(false);
    };

    const handleCancelBack = () => {
        setShowCancelReasonModal(!showCancelReasonModal);
        setShowCancelResolutionModal(false);
    };

    const toggleConfirmPlanModal = (plan = null) => {
        setShowConfirmPlanModal(!showConfirmPlanModal);
        setShowComparePlanModal(false);
        setShowBoosterPlanModal(false);
        setSelectedBilling(plan);
    };

    const openComparePlanModal = (type = null, currentPlan, subscriptionParam) => {
        if (currentPlan && currentPlan.nickname.toLowerCase().includes("appsumo") && subscriptionParam) {
            if (
                subscriptionParam &&
                ((subscriptionParam.appSumoSubscription &&
                    subscriptionParam.appSumoSubscription.status !== "canceled") ||
                    subscriptionParam.status !== "cancelled")
            ) {
                setShowBoosterPlanModal(type);
                setShowActionRequiredModal(false);
                return;
            }
        }
        setShowComparePlanModal(type);
        setShowActionRequiredModal(false);
        setShowBoosterPlanModal(false);
    };

    const toggleActionRequiredModal = () => {
        setShowActionRequiredModal(!showActionRequiredModal);
    };

    const toggleDomainSuccessModal = () => {
        setShowDomainSuccessModal(!showDomainSuccessModal);
        setShowAddDomainModal(false);
    };

    const closeDomainCancelModal = () => {
        setShowAddDomainModal(false);
    };

    const getSource = (nullIfNotFound = false) => {
        if (
            accounts.subscription &&
            accounts.subscription.sources &&
            accounts.subscription.sources.data &&
            accounts.subscription.sources.data.length > 0
        ) {
            return accounts.subscription.sources.data[0];
        }
        return nullIfNotFound ? null : {};
    };

    const fetchLatestSubscriptionInfo = async () => {
        try {
            await getUserSubscriptions(accounts.data.stripe_token);
        } catch (error) {
            console.log(error);
        }
    };

    const getWarningType = () => {
        if (showActionRequiredModal && accounts && accounts.data) {
            if (!accounts.data.stripe_token || !Object.keys(getSource()).length) {
                return subscriptionWarnings.MISSING_CARD;
            }
            return subscriptionWarnings.UPGRADE_PLAN;
        }
        return 0;
    };

    const cancelPayment = () => {
        setShowPaymentModal(false);
        setSelectedBilling(null);
    };

    const toggleBoostPaymentModal = () => {
        setShowPaymentModal(false);
    };

    const switchPlan = (plan, upgradeOrDowngrade) => {
        if (plan.plan.toLowerCase().includes("boost")) {
            const upgradeOrDowngradeBooster =
                subscription.appSumoSubscription && plan.clicks < Number(subscription.plan.metadata.clicks) ? -1 : 1;
            if (upgradeOrDowngradeBooster === 1 && !getSource(true)) {
                setShowPaymentModal(true);
                setShowConfirmPlanModal(false);
            } else {
                boostPlan();
            }
        } else {
            setSwitching(true);
            onClickSaveBtn(plan, upgradeOrDowngrade);
        }
    };

    const boostPlan = () => {
        const upgradeOrDowngrade =
            subscription.appSumoSubscription && selectedBilling.plan.clicks < Number(subscription.plan.metadata.clicks)
                ? -1
                : 1;
        setSwitching(true);
        onClickSaveBtn(selectedBilling, upgradeOrDowngrade);
    };

    const cancelSubscription = async () => {
        setIsCancelling(true);
        setShowSuccess({});

        try {
            // if user cancels the appsumo plan, cancel the booster as well
            if (subscription.appSumoSubscription && !isBooster) {
                await Payments.cancelCustomerSubscription(subscription.appSumoSubscription.id);
            }
            await Payments.cancelCustomerSubscription(subscription.id);
            if (!isBooster) {
                window.Intercom("trackEvent", "plan cancelation", {
                    account: accounts.data.id,
                    reason: cancelReason,
                });
            }
            // }
            await getUserSubscriptions(accounts.data.stripe_token);
            if (isBooster || (subscription.appSumoSubscription && !isBooster)) {
                window.Intercom("trackEvent", "booster-canceled", {
                    account: accounts.data.id,
                    reason: cancelReason,
                });
                await fetchLatestAccount(accounts.data.id, () => {
                    listDomains();
                    setIsBooster(false);
                    setShowCancelModal(false);
                    setIsCancelling(false);
                    setShowSuccess({
                        message: "Your plan has now been canceled.",
                    });
                    setSuccessActions([
                        {
                            title: "Back To Dashboard",
                            color: "lt-blue",
                            action: () => history.push("/dashboard"),
                        },
                    ]);
                });
                toggleActionSuccessModal();
                return;
            }
            listDomains();
            setShowCancelModal(false);
            setIsCancelling(false);
            setShowSuccess({
                message: "Your plan has now been canceled.",
            });
            setSuccessActions([
                {
                    title: "Back To Dashboard",
                    color: "lt-blue",
                    action: () => history.push("/dashboard"),
                },
            ]);
        } catch (error) {
            setErrors({
                cancelError: error.message,
            });
            setIsCancelling(false);
        }
    };

    const handleCancelAccount = () => {
        setShowAddDomainModal(false);
        if (!accounts.data) {
            return;
        }
        const subscriptionLocal = Utils.getSingleSubscription(accounts, accounts.data.id);
        if (subscriptionLocal) {
            setShowCancelModal(true);
            setIsBooster(false);
        }
    };

    const getVisibleDomains = (domainsParam) => {
        return domainsParam === "unlimited"
            ? "Unlimited websites"
            : domainsParam === "1"
              ? "1 website"
              : `Up to ${domainsParam} websites`;
    };

    const toggleCancelResolutionModal = () => {
        setShowCancelResolutionModal(!showCancelResolutionModal);
    };

    const handleCancelReason = (reason) => {
        setCancelReason(reason);
        setShowCancelReasonModal(false);
        window.Intercom("trackEvent", reason, {
            account: accounts.data.id,
        });
        if (reason === "other-reasons") {
            toggleCancelModal();
        } else {
            toggleCancelResolutionModal();
        }
    };

    const scheduleCall = () => {
        let existingScript = document.getElementById("calendy-script");
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://assets.calendly.com/assets/external/widget.js";
            script.id = "calendy-script";
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://assets.calendly.com/assets/external/widget.css";
            document.body.appendChild(script);
            document.body.appendChild(link);
            existingScript = script;
        }
        existingScript.onload = () => {
            if (window.Calendly) {
                window.Calendly.initPopupWidget({
                    parentElement: document.getElementById("calendy-scheduler"),
                    url: "https://calendly.com/fraud-blocker/support?hide_event_type_details=1&hide_gdpr_banner=1&text_color=2b2c33&primary_color=1660ff",
                });
            }
        };
    };

    const applyDiscountOnSubscription = async () => {
        if (accounts && accounts.data) {
            setApplyingDiscount(true);
            setErrors({});
            setShowSuccess({});

            if (subscription) {
                try {
                    const coupon = await Payments.getCouponDetails(process.env.REACT_APP_COUPON_CODE_FIFTY_PERCENT);
                    if (coupon) {
                        await Payments.updateCustomerSubscription(subscription.id, {
                            coupon: coupon.id,
                        });
                        await fetchLatestSubscriptionInfo();
                        setSuccessActions([
                            {
                                title: "View Plan",
                                color: "lt-blue",
                                action: () => toggleActionSuccessModal(),
                            },
                            {
                                title: "Go To Dashboard",
                                color: "outline",
                                action: () => history.push("/dashboard"),
                            },
                        ]);
                        setApplyingDiscount(false);
                        setDiscountError(null);
                        setShowCancelResolutionModal(false);
                        setCancelReason(null);
                        setShowSuccess({
                            message: "A 50% discount has been applied to your current plan.",
                        });
                        toggleActionSuccessModal();
                    } else {
                        setDiscountError("Offer could not be applied at the moment.");
                        setApplyingDiscount(false);
                    }
                } catch (error) {
                    setDiscountError(error.message);
                    setApplyingDiscount(false);
                }
            }
        }
    };

    const handleSolutionAction = (action) => {
        if (!action) {
            toggleCancelResolutionModal();
            toggleCancelModal();
        } else if (cancelReason !== "too-expensive" && cancelReason !== "paused-ppc") {
            toggleCancelResolutionModal();
            scheduleCall();
        } else {
            console.log("discount handling");
            applyDiscountOnSubscription();
        }
    };

    const toggleActionSuccessModal = () => {
        setShowActionSuccessModal(!showActionSuccessModal);
    };

    // redirectToAppsumo = () => {
    //   window.location.href = 'https://appsumo.com/account/products/';
    // };

    const subscription = accounts && accounts.data ? Utils.getSingleSubscription(accounts, accounts.data.id) : null;

    const isSubscriptionCancelled =
        subscription &&
        (subscription.appSumoSubscription
            ? subscription.appSumoSubscription.status === "canceled"
            : subscription.status === "canceled");

    const noDomains =
        accounts && accounts.data && accounts.data.domains.filter((item) => item.is_deleted === false).length === 0;

    const deletedDomainsCount =
        accounts && accounts.data && accounts.data.domains.filter((item) => item.is_deleted === true).length;

    const source = getSource();

    const totalLimitClicks =
        accounts &&
        accounts.data &&
        accounts.data.domains
            .filter((item) => item.is_deleted === false)
            .reduce((acc, domain) => acc + parseInt(domain.clicks_limit || 0, 10), 0);

    let currentPlan = subscription ? subscription.plan : null;

    let currentDiscount =
        subscription && subscription.discount && subscription.discount.coupon && subscription.discount.coupon.amount_off
            ? subscription.discount.coupon.amount_off
            : 0;

    if (currentPlan) {
        const planOption = planDropdownOptions.find((item) => item.id === currentPlan.id);
        if (planOption) {
            // const appSumoPlanOption =
            //   subscription && subscription.appSumoSubscription
            //     ? planDropdownOptions.find(item => item.id === currentPlan.id)
            //     : null;
            currentPlan.amount = planOption.price; // + (appSumoPlanOption ? appSumoPlanOption.price : 0);
            if (
                subscription &&
                subscription.discount &&
                subscription.discount.coupon &&
                subscription.discount.coupon.percent_off
            ) {
                currentDiscount = (currentPlan.amount * subscription.discount.coupon.percent_off) / 100;
            }
        }
    }

    return (
        <div className={styles.content}>
            <ReactTooltip id="restoreDomain" className={styles.tooltipContent}>
                <div> Reactivate </div>{" "}
            </ReactTooltip>{" "}
            {showCancelModal ? (
                <CancelPlanModal
                    isOpen={!!showCancelModal}
                    toggleModal={toggleCancelModal}
                    isBooster={isBooster}
                    isLoading={isCancelling}
                    error={errors.cancelError}
                    lastDate={subscription ? subscription.current_period_end : 0}
                    cancelSubscription={cancelSubscription}
                />
            ) : null}{" "}
            {showCancelReasonModal ? (
                <CancelReasonModal
                    isOpen={!!showCancelReasonModal}
                    toggleModal={toggleCancelReasonModal}
                    isBooster={isBooster}
                    error={errors.cancelError}
                    handleCancelReason={handleCancelReason}
                />
            ) : null}{" "}
            {showActionSuccessModal ? (
                <ActionSuccessModal
                    isOpen={!!showActionSuccessModal}
                    toggleModal={toggleActionSuccessModal}
                    description={showSuccess && showSuccess.message}
                    buttons={successActions}
                />
            ) : null}{" "}
            {showCancelResolutionModal ? (
                <CancelReasonSolutionModal
                    isOpen={!!showCancelResolutionModal}
                    toggleModal={toggleCancelResolutionModal}
                    error={discountError}
                    reason={cancelReason}
                    isLoading={applyingDiscount}
                    handleSolutionAction={handleSolutionAction}
                    goBack={handleCancelBack}
                />
            ) : null}{" "}
            {showComparePlanModal ? (
                <ComparePlanModal
                    plans={allPlans}
                    discount={discount}
                    currentDiscount={currentDiscount}
                    isOpen={!!showComparePlanModal}
                    toggleModal={openComparePlanModal}
                    toggleCancelPlan={toggleCancelReasonModal}
                    toggleConfirmPlanModal={toggleConfirmPlanModal}
                    isCancelable={subscription && subscription.status !== "canceled"}
                    compareOnly={showComparePlanModal === "compare"}
                    currentPlan={currentPlan}
                    conversionRates={accounts.conversionRates}
                    currency={currency.value}
                />
            ) : null}{" "}
            {showBoosterPlanModal ? (
                <BoosterPlanModal
                    billingOptions={planDropdownOptions}
                    isOpen={!!showBoosterPlanModal}
                    discount={discount}
                    currentDiscount={currentDiscount}
                    toggleModal={openComparePlanModal}
                    subscription={subscription}
                    toggleCancelPlan={toggleCancelReasonModal}
                    toggleConfirmPlanModal={toggleConfirmPlanModal}
                    isCancelable={subscription && subscription.status !== "canceled"}
                    currentPlan={currentPlan}
                    conversionRates={accounts.conversionRates}
                    currency={currency.value}
                />
            ) : null}{" "}
            {showConfirmPlanModal ? (
                <ConfirmPlanModal
                    isOpen={!!showConfirmPlanModal}
                    toggleModal={toggleConfirmPlanModal}
                    currentPlan={currentPlan}
                    discount={discount}
                    currentDiscount={currentDiscount}
                    plans={planDropdownOptions}
                    selectedPlan={selectedBilling}
                    switchPlan={switchPlan}
                    renewDate={
                        currentPlan && currentPlan.nickname.toLowerCase().includes("appsumo")
                            ? moment().add(31, "days").format("MMMM D, ಅವರನ್ನು")
                            : (subscription &&
                                  (subscription.status !== "canceled" ||
                                      (subscription.status === "canceled" &&
                                          subscription.trial_end > moment().unix())) &&
                                  moment.unix(subscription.current_period_end).format("MMMM D, ಅವರನ್ನು")) ||
                              moment().format("MMMM D, ಅವರನ್ನು")
                    }
                    switching={switching}
                    conversionRates={accounts.conversionRates}
                    currency={currency.value}
                    source={getSource(true)}
                />
            ) : null}{" "}
            <UpgradePlanSuccessModal
                isOpen={showUpgradeSuccessModal}
                toggleModal={openUpgradeSuccessModal}
                history={history}
            />{" "}
            <UpgradePlanDeclineModal
                isOpen={showUpgradeErrorModal}
                toggleModal={openUpgradeErrorModal}
                history={history}
            />{" "}
            {/* <UpgradePlanModal
                      isOpen={
                        showActionRequiredModal &&
                        !isSubscriptionCancelled &&
                        !accounts.fetchingSubscription &&
                        domains.length
                      }
                      toggleModal={this.toggleActionRequiredModal}
                      onClickUpdateCard={this.onClickUpdateCard}
                      onClickUpgrade={this.toggleActionRequiredModal}
                      domain={activeDomain.data.domain_name}
                      type={this.getWarningType()}
                    /> */}{" "}
            <UnprotectedAccountModal
                isOpen={subscription && showActionRequiredModal && isSubscriptionCancelled}
                isAppSumo={false}
                onSelectPlanClick={() => openComparePlanModal("switch")}
            />{" "}
            <h1 className={styles.title}> Current Subscription </h1>{" "}
            <p>
                Easily adjust your subscription plans for each of your domains here.When upgrading or downgrading plans,
                billed rates are pro - rated based on click usage and, for new domains, the billing period begins once
                the free trial period ends.{" "}
            </p>{" "}
            <div className={styles.subscriptionWrapper}>
                <div className={styles.subsWebList}>
                    <div className={styles.listHead}>
                        <div className={styles.listHeading}> Website </div>{" "}
                        <div className={styles.listHeading}> Usage </div>{" "}
                        <div className={styles.listHeading}> Limit </div>{" "}
                        <div className={styles.listHeading}> </div>{" "}
                    </div>{" "}
                    <div className={styles.listBody}>
                        {" "}
                        {domains.map((domain, index) => {
                            return (
                                domain.is_deleted === false && (
                                    <div
                                        key={index}
                                        className={`${styles.listBodyRow} ${
                                            removeIndex === index ? styles.removeSubRow : ""
                                        }`}
                                    >
                                        <div className={styles.domianName}> {domain.name} </div>{" "}
                                        <div
                                            className={`${styles.domianUsage} ${
                                                (domain.clicks_limit || domain.clicks_limit === 0) &&
                                                (clicks[domain.id] || 0) > domain.clicks_limit
                                                    ? styles.redColor
                                                    : ""
                                            }`}
                                        >
                                            {Number(clicks[domain.id] || 0).toLocaleString("en-US", {
                                                maximumFractionDigits: 1,
                                            })}{" "}
                                        </div>{" "}
                                        <div className={styles.domainLimit}>
                                            <span className={styles.limitVal}>
                                                {" "}
                                                {domain.clicks_limit
                                                    ? Number(domain.clicks_limit).toLocaleString("en-US", {
                                                          maximumFractionDigits: 1,
                                                      })
                                                    : "-"}{" "}
                                            </span>{" "}
                                            <a
                                                className={styles.setLimit}
                                                href={null}
                                                onClick={() => openDomainLimitModal(index)}
                                            >
                                                {domain.clicks_limit ? "Edit" : "Set"}{" "}
                                            </a>{" "}
                                        </div>{" "}
                                        <div className={styles.damainDelete}>
                                            <span>
                                                <DeleteIcon
                                                    style={customStyles.removeBtn}
                                                    onClick={() => onClickRemoveDomain(index)}
                                                />{" "}
                                            </span>{" "}
                                        </div>{" "}
                                    </div>
                                )
                            );
                        })}{" "}
                        {deletedDomainsCount ? (
                            <button
                                onClick={toggleDeletedDomains}
                                className={`${styles.accordian} ${deletedDomainsExpanded ? styles.active : ""}`}
                            >
                                Deleted <strong> ({deletedDomainsCount}) </strong>{" "}
                            </button>
                        ) : null}{" "}
                        <div
                            className={`${styles.deletedDomain} ${
                                deletedDomainsExpanded ? styles.open : styles.closed
                            }`}
                        >
                            {domains.map((domain, index) => {
                                return (
                                    domain.is_deleted !== false && (
                                        <div key={index} className={styles.listBodyRow}>
                                            <div className={styles.domianName}> {domain.name} </div>{" "}
                                            <div className={styles.domianUsage}>
                                                {" "}
                                                {`${Number(clicks[domain.id] || 0).toLocaleString("en-US", {
                                                    maximumFractionDigits: 1,
                                                })} / ${
                                                    currentPlan &&
                                                    currentPlan.metadata.clicks.toLocaleString("en-US", {
                                                        maximumFractionDigits: 1,
                                                    })
                                                }`}{" "}
                                            </div>{" "}
                                            <div className={styles.domainLimit}>
                                                <span className={styles.limitVal}> - </span>{" "}
                                            </div>{" "}
                                            {restoreIndex === index ? (
                                                <div className={styles.restoring}> ... </div>
                                            ) : (
                                                <>
                                                    <div className={styles.deleted}>
                                                        Deleted{" "}
                                                        {currentPlan &&
                                                            (currentPlan.metadata.domains === "unlimited" ||
                                                                domains.filter((item) => item.is_deleted === false)
                                                                    .length <
                                                                    parseInt(currentPlan.metadata.domains, 10) ||
                                                                (subscription.metadata.domain &&
                                                                    domains.filter((item) => item.is_deleted === false)
                                                                        .length <
                                                                        parseInt(
                                                                            subscription.metadata.domain,
                                                                            10
                                                                        ))) && (
                                                                <img
                                                                    data-tip
                                                                    data-for="restoreDomain"
                                                                    className={styles.restoreBtn}
                                                                    src={Reactivate}
                                                                    onClick={() => restoreDomain(index)}
                                                                />
                                                            )}{" "}
                                                    </div>{" "}
                                                </>
                                            )}{" "}
                                        </div>
                                    )
                                );
                            })}{" "}
                        </div>{" "}
                    </div>{" "}
                    <div className={styles.listFooter}>
                        <div className={styles.usageLabel}> Total usage </div>{" "}
                        <div className={styles.usageValue}>
                            <strong>
                                {" "}
                                {totalClicks.toLocaleString("en-US", {
                                    maximumFractionDigits: 1,
                                })}
                                /{" "}
                                {currentPlan &&
                                    Number(currentPlan.metadata.clicks).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}{" "}
                            </strong>{" "}
                        </div>{" "}
                    </div>{" "}
                    <div className={styles.addDomain}>
                        <Button
                            title="+ Add Website"
                            style={customStyles.addDomainBtn}
                            color="outline"
                            onClick={onClickAddDomain}
                        />{" "}
                    </div>{" "}
                    <div className={styles.messageSection}>
                        {" "}
                        {errors.removeError && <ErrorBox error={errors.removeError} />}{" "}
                        {showSuccess.message && <SuccessBox message={showSuccess.message} />}{" "}
                    </div>{" "}
                </div>{" "}
                <div className={styles.subsCurrent}>
                    <div className={styles.curHeading}>
                        Plan Details{" "}
                        {currentPlan && !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                            <span
                                onClick={() => openComparePlanModal("compare")}
                                style={{
                                    ...customStyles.headerDescription,
                                    textDecoration: "underline",
                                }}
                            >
                                Compare Plans{" "}
                            </span>
                        )}{" "}
                        {subscription && subscription.appSumoSubscription && (
                            <div className={styles.planToggle}>
                                <div
                                    onClick={toggleVisiblePlan}
                                    className={visiblePlan === "primary" ? styles.active : ""}
                                    role="button"
                                >
                                    Primary{" "}
                                </div>{" "}
                                <div
                                    onClick={toggleVisiblePlan}
                                    className={visiblePlan !== "primary" ? styles.active : ""}
                                    role="button"
                                >
                                    Booster{" "}
                                </div>{" "}
                            </div>
                        )}{" "}
                    </div>{" "}
                    {subscription && visiblePlan === "primary" && planDropdownOptions.length > 0 && (
                        <div className={styles.animatedSection}>
                            <div className={styles.planRow}>
                                <div className={styles.planLabel}> Plan Tier </div>{" "}
                                <div className={styles.planValue}>
                                    {" "}
                                    {currentPlan &&
                                        subscription &&
                                        subscription.status === "trialing" &&
                                        !currentPlan.nickname.toLowerCase().includes("boost") && (
                                            <>
                                                {" "}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") &&
                                                subscription.appSumoSubscription &&
                                                subscription.appSumoSubscription.plan
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}{" "}
                                                Plan(Free Trial){" "}
                                            </>
                                        )}{" "}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled && (
                                        <div> Canceled </div>
                                    )}{" "}
                                    {currentPlan &&
                                        subscription &&
                                        accounts.subscriptionValid &&
                                        (subscription.status !== "trialing" ||
                                            currentPlan.nickname.toLowerCase().includes("boost")) && (
                                            <>
                                                {" "}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}{" "}
                                                {subscription &&
                                                subscription.appSumoSubscription &&
                                                visiblePlan === "primary"
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}{" "}
                                                Plan{" "}
                                            </>
                                        )}{" "}
                                    {!subscription && (
                                        <strong>
                                            <span> ! </span> Limit Reached.{" "}
                                        </strong>
                                    )}{" "}
                                </div>{" "}
                                {currentPlan &&
                                    subscription &&
                                    subscription.status === "trialing" &&
                                    !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                        <p className={styles.trialRemaining}>
                                            {" "}
                                            {moment.unix(subscription.trial_end).diff(moment(), "days")}
                                            days remain{" "}
                                        </p>
                                    )}{" "}
                            </div>{" "}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Cost </div>{" "}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                        <div className={styles.planValue}>
                                            {" "}
                                            {currencySymbols[currency.value] || "$"}0{" "}
                                        </div>
                                    ) : (
                                        <div className={styles.planValue}>
                                            {" "}
                                            {`${
                                                subscription && subscription.status === "trialing"
                                                    ? "Free"
                                                    : currentPlan && currentPlan.nickname
                                                      ? Utils.convertToCurrency(
                                                            accounts.conversionRates,
                                                            subscription &&
                                                                subscription.appSumoSubscription &&
                                                                visiblePlan === "primary"
                                                                ? subscription.appSumoSubscription.plan.metadata
                                                                      .plan_value - currentDiscount
                                                                : currentPlan.amount - currentDiscount,
                                                            currency.value
                                                        )
                                                      : Utils.convertToCurrency(
                                                            accounts.conversionRates,
                                                            0,
                                                            currency.value
                                                        )
                                            }`}{" "}
                                            {currentPlan &&
                                                (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                                    (currentPlan.nickname.toLowerCase().includes("boost") &&
                                                        visiblePlan === "booster")) &&
                                                subscription &&
                                                subscription.status !== "trialing" && (
                                                    <>
                                                        /{" "}
                                                        {currentPlan.interval === "month" &&
                                                        currentPlan.interval_count === 1
                                                            ? "mo"
                                                            : currentPlan.interval === "month" &&
                                                                currentPlan.interval_count === 3
                                                              ? "qr"
                                                              : "yr"}{" "}
                                                    </>
                                                )}{" "}
                                        </div>
                                    )}{" "}
                                </div>{" "}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Ad Clicks </div>{" "}
                                    <div className={styles.planValue}>
                                        {" "}
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? 0
                                            : currentPlan &&
                                              Number(
                                                  subscription &&
                                                      subscription.appSumoSubscription &&
                                                      visiblePlan === "primary"
                                                      ? subscription.appSumoSubscription.plan.metadata.clicks
                                                      : planDropdownOptions.find((item) => item.id === currentPlan.id)
                                                            .clicks
                                              ).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })}{" "}
                                        ad clicks{" "}
                                    </div>{" "}
                                </div>{" "}
                            </div>{" "}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                {" "}
                                {currentPlan &&
                                    (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                        visiblePlan === "booster") && (
                                        <div className={styles.col50}>
                                            <div className={styles.planLabel}> Renewal Date </div>{" "}
                                            <div className={styles.planValue}>
                                                {" "}
                                                {subscription &&
                                                    (subscription.status !== "canceled" &&
                                                    currentPlan &&
                                                    !currentPlan.nickname.toLowerCase().includes("appsumo") ? (
                                                        moment
                                                            .unix(subscription.current_period_end)
                                                            .format("MMMM D, ಅವರನ್ನು")
                                                    ) : moment
                                                          .unix(subscription.current_period_end)
                                                          .diff(moment(), "days") >= 0 ? (
                                                        <div>
                                                            <div className={styles.expiring}> Canceled </div>{" "}
                                                            <div className={styles.activeUntil}>
                                                                {" "}
                                                                Active until{" "}
                                                                {subscription
                                                                    ? moment
                                                                          .unix(subscription.current_period_end)
                                                                          .format("MMMM D, ಅವರನ್ನು")
                                                                    : ""}{" "}
                                                            </div>{" "}
                                                        </div>
                                                    ) : (
                                                        "Expired"
                                                    ))}{" "}
                                            </div>{" "}
                                        </div>
                                    )}{" "}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Websites </div>{" "}
                                    <div className={styles.planValue}>
                                        {" "}
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? "0 websites"
                                            : currentPlan &&
                                              (subscription.appSumoSubscription && visiblePlan === "primary"
                                                  ? getVisibleDomains(
                                                        subscription.appSumoSubscription &&
                                                            subscription.appSumoSubscription.metadata &&
                                                            subscription.appSumoSubscription.metadata.domain
                                                            ? subscription.appSumoSubscription.metadata.domain
                                                            : subscription.appSumoSubscription.plan.metadata.domains
                                                    )
                                                  : getVisibleDomains(
                                                        subscription.metadata.domain || currentPlan.metadata.domains
                                                    ))}{" "}
                                    </div>{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                    {subscription && visiblePlan === "booster" && (
                        <div className={styles.animatedSection}>
                            <div className={styles.planRow}>
                                <div className={styles.planLabel}> Plan Tier 1 </div>{" "}
                                <div className={styles.planValue}>
                                    {" "}
                                    {currentPlan &&
                                        subscription &&
                                        subscription.status === "trialing" &&
                                        !currentPlan.nickname.toLowerCase().includes("boost") && (
                                            <>
                                                {" "}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("boost") &&
                                                (visiblePlan === "booster" || !subscription.appSumoSubscription)
                                                    ? currentPlan.nickname
                                                    : subscription.appSumoSubscription.plan.nickname}{" "}
                                                Plan(Free Trial){" "}
                                            </>
                                        )}{" "}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                        <div> Canceled </div>
                                    ) : (
                                        currentPlan &&
                                        subscription &&
                                        (subscription.status !== "trialing" ||
                                            currentPlan.nickname.toLowerCase().includes("boost")) && (
                                            <>
                                                {" "}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}{" "}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}{" "}
                                                {subscription &&
                                                subscription.appSumoSubscription &&
                                                visiblePlan === "primary"
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}{" "}
                                                Plan{" "}
                                            </>
                                        )
                                    )}{" "}
                                    {!subscription && (
                                        <strong>
                                            <span> ! </span> Limit Reached.{" "}
                                        </strong>
                                    )}{" "}
                                </div>{" "}
                                {currentPlan &&
                                    subscription &&
                                    subscription.status === "trialing" &&
                                    !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                        <p className={styles.trialRemaining}>
                                            {" "}
                                            {moment.unix(subscription.trial_end).diff(moment(), "days")}
                                            days remain{" "}
                                        </p>
                                    )}{" "}
                            </div>{" "}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Cost </div>{" "}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                        <div className={styles.planValue}>
                                            {" "}
                                            {currencySymbols[currency.value] || "$"}0{" "}
                                        </div>
                                    ) : (
                                        <div className={styles.planValue}>
                                            {" "}
                                            {`${
                                                subscription && subscription.status === "trialing"
                                                    ? "Free"
                                                    : currentPlan && currentPlan.nickname
                                                      ? Utils.convertToCurrency(
                                                            accounts.conversionRates,
                                                            subscription &&
                                                                subscription.appSumoSubscription &&
                                                                visiblePlan === "primary"
                                                                ? subscription.appSumoSubscription.plan.metadata
                                                                      .plan_value - currentDiscount
                                                                : currentPlan.amount - currentDiscount,
                                                            currency.value
                                                        )
                                                      : Utils.convertToCurrency(
                                                            accounts.conversionRates,
                                                            0,
                                                            currency.value
                                                        )
                                            }`}{" "}
                                            {currentPlan &&
                                                (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                                    (currentPlan.nickname.toLowerCase().includes("boost") &&
                                                        visiblePlan === "booster")) &&
                                                subscription &&
                                                subscription.status !== "trialing" && (
                                                    <>
                                                        /{" "}
                                                        {currentPlan.interval === "month" &&
                                                        currentPlan.interval_count === 1
                                                            ? "mo"
                                                            : currentPlan.interval === "month" &&
                                                                currentPlan.interval_count === 3
                                                              ? "qr"
                                                              : "yr"}{" "}
                                                    </>
                                                )}{" "}
                                        </div>
                                    )}{" "}
                                </div>{" "}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Ad Clicks </div>{" "}
                                    <div className={styles.planValue}>
                                        {" "}
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? 0
                                            : currentPlan &&
                                              Number(
                                                  subscription &&
                                                      subscription.appSumoSubscription &&
                                                      visiblePlan === "primary"
                                                      ? subscription.appSumoSubscription.plan.metadata.clicks
                                                      : planDropdownOptions.find((item) => item.id === currentPlan.id)
                                                            .clicks
                                              ).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })}{" "}
                                        ad clicks{" "}
                                    </div>{" "}
                                </div>{" "}
                            </div>{" "}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                {" "}
                                {currentPlan &&
                                    (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                        visiblePlan === "booster") && (
                                        <div className={styles.col50}>
                                            <div className={styles.planLabel}> Renewal Date </div>{" "}
                                            <div className={styles.planValue}>
                                                {" "}
                                                {subscription &&
                                                    (subscription.status !== "canceled" ? (
                                                        moment
                                                            .unix(subscription.current_period_end)
                                                            .format("MMMM D, ಅವರನ್ನು")
                                                    ) : moment.unix(subscription.trial_end).diff(moment(), "days") >=
                                                      0 ? (
                                                        <>
                                                            Expires{" "}
                                                            {subscription
                                                                ? moment
                                                                      .unix(subscription.current_period_end)
                                                                      .format("MMMM D, ಅವರನ್ನು")
                                                                : ""}{" "}
                                                        </>
                                                    ) : (
                                                        "Expired"
                                                    ))}{" "}
                                            </div>{" "}
                                        </div>
                                    )}{" "}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}> Websites </div>{" "}
                                    <div className={styles.planValue}>
                                        {" "}
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? "0 websites"
                                            : currentPlan &&
                                              (subscription.appSumoSubscription && visiblePlan === "primary"
                                                  ? getVisibleDomains(
                                                        subscription.appSumoSubscription &&
                                                            subscription.appSumoSubscription.metadata &&
                                                            subscription.appSumoSubscription.metadata.domains
                                                            ? subscription.appSumoSubscription.metadata.domain
                                                            : subscription.appSumoSubscription.plan.metadata.domains
                                                    )
                                                  : getVisibleDomains(
                                                        subscription.metadata.domain || currentPlan.metadata.domains
                                                    ))}{" "}
                                    </div>{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                    {currentPlan && (
                        <div className={styles.currentTotal}>
                            <div className={styles.totalCurrent}> Total Price: </div>{" "}
                            <div className={styles.totalCurrentValue}>
                                {" "}
                                {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                    Utils.convertToCurrency(accounts.conversionRates, 0, currency.value)
                                ) : (
                                    <>
                                        {" "}
                                        {Utils.convertToCurrency(
                                            accounts.conversionRates,
                                            currentPlan.amount - currentDiscount,
                                            currency.value
                                        )}
                                        /{" "}
                                        {currentPlan.nickname.toLowerCase().includes("appsumo tier")
                                            ? ""
                                            : currentPlan.interval === "month" && currentPlan.interval_count === 1
                                              ? "mo"
                                              : currentPlan.interval === "month" && currentPlan.interval_count === 3
                                                ? "qr"
                                                : "yr"}{" "}
                                    </>
                                )}{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                    <div className={styles.currPlanBtns}>
                        {" "}
                        {currentPlan &&
                        !currentPlan.nickname.toLowerCase().includes("appsumo tier") &&
                        subscription &&
                        auth.user &&
                        auth.user.role !== "Manager" ? (
                            <Button
                                onClick={() => openComparePlanModal("switch", currentPlan, subscription)}
                                title="Change Plan"
                                color="changePlanBtn"
                                style={isSubscriptionCancelled ? customStyles.redButton : {}}
                            />
                        ) : null}{" "}
                        {currentPlan &&
                        currentPlan.nickname.toLowerCase().includes("appsumo tier") &&
                        subscription &&
                        auth.user &&
                        auth.user.role !== "Manager" ? (
                            <Button
                                onClick={() => openComparePlanModal("switch", currentPlan, subscription)}
                                title="Change Plan"
                                color="changePlanBtn"
                                style={isSubscriptionCancelled ? customStyles.redButton : {}}
                            />
                        ) : null}{" "}
                        {currentPlan && !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                            <Link to="/account/billing/invoices"> View Invoices </Link>
                        )}{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
            <AddDomainModal
                onCancel={closeDomainCancelModal}
                onSuccess={toggleDomainSuccessModal}
                isOpen={showAddDomainModal}
                forceToAdd={forceToAdd && noDomains}
                onCancelAccount={handleCancelAccount}
            />{" "}
            <AddDomainSuccessModal
                isOpen={showDomainSuccessModal}
                toggleModal={toggleDomainSuccessModal}
                history={history}
            />
            {showDomainLimitModal && (
                <DomainLimitModal
                    isOpen={showDomainLimitModal}
                    toggleModal={closeDomainLimitModal}
                    sid={domains[domainLimitIndex] && domains[domainLimitIndex].id}
                    onSuccess={() => closeDomainLimitModal(true)}
                    onCancel={closeDomainLimitModal}
                    totalClicks={currentPlan && parseInt(currentPlan.metadata.clicks, 10)}
                    availableClicks={currentPlan ? parseInt(currentPlan.metadata.clicks, 10) - totalLimitClicks : 0}
                    currentClicks={domains[domainLimitIndex] ? clicks[domains[domainLimitIndex].id] || 0 : 0}
                    currentLimit={domains[domainLimitIndex] && parseInt(domains[domainLimitIndex].clicks_limit, 10)}
                />
            )}
            <div style={customStyles.divider} />
            {/* <div style={customStyles.totalMonthlyPriceContainer}>
              <p style={customStyles.totalPrice}>{`$${this.getTotalPrice()}`}</p>
            </div> */}{" "}
            {(!currentPlan || !currentPlan.nickname.toLowerCase().includes("appsumo tier")) && (
                <p style={customStyles.billedToText}>
                    {" "}
                    {source.last4 ? (
                        <>
                            Billed to {getCardIcon(source.brand.toLowerCase())}{" "}
                            {!getCardIcon(source.brand.toLowerCase()) ? source.brand : ""}
                            ending in ** ** ** ** {source.last4}{" "}
                        </>
                    ) : (
                        ""
                    )}{" "}
                    {!!source.last4 && (
                        <span style={customStyles.updateCard}>
                            <a onClick={onClickUpdateCard} style={customStyles.link}>
                                Update your card{" "}
                            </a>{" "}
                        </span>
                    )}{" "}
                    {!source.last4 && (
                        <div style={customStyles.noCardWrap}>
                            <CCImage style={customStyles.ccIcon} />{" "}
                            <div style={customStyles.payInfo}> PAYMENT INFORMATION </div>{" "}
                            <div style={customStyles.noCard}> You currently have no credit card on file. </div>{" "}
                            <div>
                                <a onClick={toggleUpdateCardModal} style={customStyles.newCard}>
                                    Add one now{" "}
                                </a>{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                </p>
            )}{" "}
            {/* <div style={customStyles.footerBtnContainer}>
                          <Button
                            title="Save"
                            color="blue"
                            style={customStyles.saveBtn}
                            onClick={this.onClickSaveBtn}
                            loading={saveLoading}
                          />
                          <Button
                            title="Delete Account and Data"
                            style={customStyles.deleteAccountBtn}
                            onClick={this.onClickDeleteAccountBtn}
                          />
                        </div> */}
            {/* <ActionRequiredModal
                          isOpen={showActionRequiredModal}
                          toggleModal={this.toggleActionRequiredModal}
                          onClickUpdateCard={this.onClickUpdateCard}
                          type={'free_trial'}
                        /> */}
            <StripeProvider apiKey={Constants.stripePublicKey}>
                <Elements>
                    <>
                        {" "}
                        {showUpdateCardModal && (
                            <UpdateCardModal
                                isOpen={showUpdateCardModal}
                                toggleModal={toggleUpdateCardModal}
                                accounts={accounts}
                                source={source}
                                fetchLatestSubscriptionInfo={fetchLatestSubscriptionInfo}
                            />
                        )}{" "}
                        {showPaymentModal && (
                            <BoosterPaymentModal
                                isOpen={showPaymentModal}
                                toggleModal={toggleBoostPaymentModal}
                                accounts={accounts}
                                source={source}
                                conversionRates={accounts.conversionRates}
                                currency={currency.value}
                                selectedPlan={selectedBilling}
                                proceed={boostPlan}
                                currentPlan={currentPlan}
                            />
                        )}{" "}
                    </>{" "}
                </Elements>{" "}
            </StripeProvider>{" "}
            <div id="calendy-scheduler"> </div>{" "}
        </div>
    );
};

Subscription.propTypes = {
    accounts: PropTypes.object,
    activeDomain: PropTypes.object,
    auth: PropTypes.object,
    getUserSubscriptions: PropTypes.func,
    fetchLatestAccount: PropTypes.func,
    location: PropTypes.object,
    history: PropTypes.object,
    setDomain: PropTypes.func,
};

const mapStateToProps = (state) => ({
    accounts: state.accounts,
    activeDomain: state.activeDomain,
    auth: state.auth,
});

const mapDispatchToProps = (dispatch) => {
    return {
        getUserSubscriptions: (customerId) => dispatch(Account.getUserSubscriptions(customerId, true)),
        fetchLatestAccount: (accountId, cb) => dispatch(Account.fetchLatestAccount(accountId, cb)),
        setDomain: (domain) => dispatch(ActiveDomain.setDomainActive(domain)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Subscription);
