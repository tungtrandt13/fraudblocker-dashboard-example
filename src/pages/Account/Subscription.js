import React, { useState, useEffect, useRef } from "react";
import { Elements, StripeProvider } from "react-stripe-elements";
import { connect, useDispatch, useSelector } from "react-redux";
import ReactTooltip from "react-tooltip";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import qs from "qs";
import { Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import styles from "./Account.module.scss";
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
import Crown from "../../assets/crown-img.svg";
import Taco from "../../assets/taco.svg";
import Reactivate from "../../assets/reactivate.png";
import BoosterPaymentModal from "../../containers/BoosterPaymentModal/BoosterPaymentModal";
import CancelReasonModal from "../../containers/CancelReasonModal/CancelReasonModal";
import CancelReasonSolutionModal from "../../containers/CancelReasonSolutionModal/CancelReasonSolutionModal";
import ActionSuccessModal from "../../containers/ActionSuccessModal/ActionSuccessModal";

const { subscriptionWarnings, currencySymbols, currencyOptions } = Constants;

const Subscription = () => {
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
        window.location.href.includes("#") ? "switch" : null
    );
    const [showBoosterPlanModal, setShowBoosterPlanModal] = useState(null);
    const [showConfirmPlanModal, setShowConfirmPlanModal] = useState(false);
    const [upgradePlanModal, setUpgradePlanModal] = useState(false);
    const [showActionSuccessModal, setShowActionSuccessModal] = useState(false);
    const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
    const [showAddDomainModal, setShowAddDomainModal] = useState(false);
    const [forceToAdd, setForceToAdd] = useState(false);
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
    const [showActionRequiredModal, setShowActionRequiredModal] = useState(false);
    const [isBooster, setIsBooster] = useState(false);
    const [discount, setDiscount] = useState(0);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { accounts, activeDomain, auth } = useSelector((state) => state);
    const controller = useRef(new AbortController());
    const location = window.location;

    useEffect(() => {
        if (location.state && location.state.invalidSubscription) {
            navigate("/account/billing", { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        setShowAddDomainModal(location.state ? location.state.forceAddDomain : false);
        setForceToAdd(location.state ? location.state.forceAddDomain : false);
        setShowActionRequiredModal(location.state ? location.state.invalidSubscription : false);
        setShowComparePlanModal(
            window.location.href.includes("#") &&
                (!location.state || (!location.state.forceAddDomain && !location.state.invalidSubscription))
                ? "switch"
                : null
        );
    }, [location]);

    useEffect(() => {
        const fetchData = async () => {
            await fetchAllPlans();
            if (auth.user?.currency) {
                setCurrency(currencyOptions.find((item) => item.value === auth.user.currency));
            }
            await setInitialDiscount();
        };

        fetchData();

        return () => {
            controller.current.abort();
        };
    }, [auth.user]);

    useEffect(() => {
        if (accounts?.data?.domains && domains.length !== accounts.data.domains.length) {
            listDomains();
        }
        ReactTooltip.rebuild();
    }, [accounts?.data?.domains, domains.length]);

    const setInitialDiscount = async () => {
        const { offer_id: couponIdFromQuery, afmc: otherCouponIdFromQuery } = qs.parse(window.location.search, {
            ignoreQueryPrefix: true,
        });
        const afmcCoupon = otherCouponIdFromQuery || Utils.getCookie("afmc");
        const offerCoupon = couponIdFromQuery || Utils.getCookie("offer_id");

        let discountDetails = { error: "", discount: 0 };

        if (afmcCoupon) {
            discountDetails = await fetchDiscountDetails(afmcCoupon, "afmc");
        }

        if (offerCoupon && !discountDetails.discount) {
            discountDetails = await fetchDiscountDetails(offerCoupon, "offer_id");
        }

        setDiscount(discountDetails.discount);
        if ((afmcCoupon || offerCoupon) && !discountDetails.discount) {
            setDiscountError(discountDetails.error);
        }
    };

    const fetchDiscountDetails = async (couponId, cookieName) => {
        try {
            const coupon = await Payments.getCouponDetails(couponId);
            if (coupon) {
                Utils.setCookie(cookieName === "afmc" ? "offer_id" : "afmc", "", -1);
                return { discount: coupon.percent_off, error: "" };
            }
            return { discount: 0, error: "" };
        } catch (error) {
            Utils.setCookie(cookieName, "", -1);
            return { error: error.message, discount: 0 };
        }
    };

    const toggleVisiblePlan = () => {
        setVisiblePlan((prev) => (prev === "primary" ? "booster" : "primary"));
    };

    const toggleDeletedDomains = () => {
        setDeletedDomainsExpanded((prev) => !prev);
    };

    const onCurrencyChange = (val) => {
        setCurrency(val);
    };

    const fetchSitesClicks = async (accountId) => {
        try {
            const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
            if (!subscription) return 0;

            const result = await Data.getAllSitesClicks(
                accountId,
                subscription.id,
                auth.user.timezone,
                controller.current.signal
            );

            if (result && !result.errno) {
                const total = result.reduce((acc, item) => acc + item.clicks, 0);
                const clicksMap = result.reduce((acc, item) => ({ ...acc, [item.sid]: item.clicks }), {});
                setClicks(clicksMap);
                setTotalClicks(total);
                return result;
            }
            return 0;
        } catch (error) {
            console.error(error);
            return 0;
        }
    };

    const getSiteClicks = async () => {
        if (auth.user) {
            await fetchSitesClicks(auth.user.account_id);
        }
    };

    const listDomains = async () => {
        if (!accounts?.data) return;

        const allDomains = accounts.data.domains.map((domain) => ({
            id: domain.id,
            name: domain.domain_name,
            is_deleted: domain.is_deleted,
            clicks_limit: domain.clicks_limit,
        }));

        let filteredDomains = [
            allDomains.find((domain) => domain.id === activeDomain.data.id),
            ...allDomains.filter((domain) => domain.id !== activeDomain.data.id),
        ]
            .filter((item) => !!item)
            .sort((a, b) => (a.name > b.name ? 1 : -1));

        setOriginalDomains(JSON.parse(JSON.stringify(filteredDomains)));
        setDomains(filteredDomains);
        setErrors({});
        setLoading(false);

        window.setTimeout(() => {
            getSiteClicks();
        }, 100);
    };

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
            listDomains(); // Ensure domains are listed after plans are fetched.
        } catch (error) {
            console.error(error);
        }
    };

    const onClickAddDomain = () => {
        setShowAddDomainModal(true);
    };

    const onClickDeleteAccountBtn = () => {
        console.log("Delete Account");
    };

    const openUpgradeSuccessModal = () => {
        setShowUpgradeSuccessModal(true);
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
        setShowUpgradeErrorModal(true);
        setSwitching(false);
    };

    const onClickSaveBtn = async (plan, upgradeOrDowngrade) => {
        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
        const coupon = discount && (Utils.getCookie("afmc") || Utils.getCookie("offer_id"));

        try {
            setSaveLoading(true);
            setErrors({});
            setShowSuccess({});

            let promises = [];
            const baseData = {
                customer: accounts.data.stripe_token,
                metadata: { account_id: accounts.data.id },
                coupon: coupon || undefined,
            };

            if (
                subscription &&
                subscription.status !== "canceled" &&
                (!plan.plan.toLowerCase().includes("boost") ||
                    subscription.plan.nickname.toLowerCase().includes("boost"))
            ) {
                promises.push(
                    Payments.updateCustomerSubscription(subscription.id, {
                        items: [{ id: subscription.items.data[0].id, plan: plan.id }],
                        coupon: coupon || undefined,
                    })
                );
            } else {
                const subscribeData = {
                    ...baseData,
                    subscriptionId: subscription ? subscription.id : null,
                    items: [{ plan: plan.id }],
                };
                promises.push(Payments.subscribeCustomerToPlan(subscribeData));
            }

            await Promise.all(promises);

            const eventData = {
                plan: plan.plan,
                clicks: plan.clicks,
                interval: plan.interval,
                interval_count: plan.interval_count,
                coupon: coupon || undefined,
            };
            const eventType = plan.plan.toLowerCase().includes("boost") ? "booster" : "account";
            const actionType = upgradeOrDowngrade === 1 ? "upgrade" : "downgrade";

            if (!upgradeOrDowngrade) {
                window.Intercom("trackEvent", "account-subscription", {
                    plan: plan.plan,
                    coupon: coupon || undefined,
                });
            }
            if (upgradeOrDowngrade) {
                window.Intercom(
                    "trackEvent",
                    `<span class="math-inline">\{eventType\}\-</span>{actionType}`,
                    eventData
                );
            }

            await fetchLatestSubscriptionInfo();
            openUpgradeSuccessModal();
            setSaveLoading(false);
            setErrors({});
            setSwitching(false);
            setSelectedBilling(null);
            setShowConfirmPlanModal(false);
            setShowPaymentModal(false);
            setShowSuccess({ message: "Subscription plan updated" });
        } catch (error) {
            console.error(error);
            openUpgradeErrorModal();
            setSaveLoading(false);
            setShowPaymentModal(false);
            setSelectedBilling(null);
            setSwitching(false);
            setShowConfirmPlanModal(false);
            setShowSuccess({});
            setErrors({ saveError: error.message });
        }
    };

    const onClickRemoveDomain = async (index) => {
        const selectedDomain = domains[index];

        try {
            await Domains.removeDomain(selectedDomain.id);
            setRemoveIndex(index);
            await dispatch(
                Account.fetchLatestAccount(accounts.data.id, (accountsResponse) => {
                    listDomains();
                    setShowSuccess({
                        message: `${selectedDomain.name} has been removed.`,
                    });
                    setErrors({});
                    setRemoveIndex("");

                    if (
                        accountsResponse?.domains &&
                        !accountsResponse.domains.filter((item) => !item.is_deleted).length
                    ) {
                        dispatch(ActiveDomain.setDomainActive({}));
                        setShowAddDomainModal(true);
                        setForceToAdd(true);
                    }
                })
            );
        } catch (error) {
            setErrors({ removeError: error.message });
        }
    };

    const restoreDomain = async (index) => {
        if (restoreIndex) return;

        const selectedDomain = domains[index];

        try {
            await Domains.restoreDomain(selectedDomain.id);
            setRestoreIndex(index);
            await dispatch(
                Account.fetchLatestAccount(accounts.data.id, () => {
                    listDomains();
                    setShowSuccess({
                        message: `${selectedDomain.name} has been restored.`,
                    });
                    setErrors({});
                    setRestoreIndex("");
                })
            );
        } catch (error) {
            setErrors({ removeError: error.message });
        }
    };

    const onClickUpdateCard = () => {
        toggleUpdateCardModal();
    };

    const getCardIcon = (brand) => {
        switch (brand) {
            case "visa":
                return (
                    <>
                        <Visa className={styles.cardIcon} />
                        &nbsp;
                    </>
                );
            case "master":
            case "mastercard":
                return (
                    <>
                        <Master className={styles.cardIcon} />
                        &nbsp;
                    </>
                );
            case "discover":
                return (
                    <>
                        <Discover className={styles.cardIcon} />
                        &nbsp;
                    </>
                );
            case "amex":
            case "american":
            case "american express":
                return (
                    <>
                        <Amex className={styles.cardIcon} />
                        &nbsp;
                    </>
                );
            default:
                return "";
        }
    };

    const toggleUpdateCardModal = () => {
        setShowUpdateCardModal((prev) => !prev);
        setShowActionRequiredModal(false);
    };

    const toggleCancelModal = () => {
        setShowCancelModal((prev) => !prev);
    };

    const toggleCancelReasonModal = (isBoosterVal = false) => {
        setShowCancelReasonModal((prev) => !prev);
        setIsBooster(isBoosterVal);
        setShowComparePlanModal(false);
        setShowBoosterPlanModal(false);
    };

    const handleCancelBack = () => {
        setShowCancelReasonModal(true);
        setShowCancelResolutionModal(false);
    };

    const toggleConfirmPlanModal = (plan = null) => {
        setShowConfirmPlanModal((prev) => !prev);
        setShowComparePlanModal(false);
        setShowBoosterPlanModal(false);
        setSelectedBilling(plan);
    };

    const openComparePlanModal = (type = null, currentPlan, subscription) => {
        if (currentPlan && currentPlan.nickname.toLowerCase().includes("appsumo") && subscription) {
            if (
                subscription &&
                ((subscription.appSumoSubscription && subscription.appSumoSubscription.status !== "canceled") ||
                    subscription.status !== "cancelled")
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
        setShowActionRequiredModal((prev) => !prev);
    };

    const toggleDomainSuccessModal = () => {
        setShowDomainSuccessModal((prev) => !prev);
        setShowAddDomainModal(false);
    };

    const closeDomainCancelModal = () => {
        setShowAddDomainModal(false);
    };

    const getSource = (nullIfNotFound = false) => {
        if (accounts.subscription?.sources?.data && accounts.subscription.sources.data.length > 0) {
            return accounts.subscription.sources.data[0];
        }
        return nullIfNotFound ? null : {};
    };

    const fetchLatestSubscriptionInfo = async () => {
        try {
            await dispatch(Account.getUserSubscriptions(accounts.data.stripe_token));
        } catch (error) {
            console.error(error);
        }
    };

    const getWarningType = () => {
        if (showActionRequiredModal && accounts?.data) {
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
            const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
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
        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
        const upgradeOrDowngrade =
            subscription.appSumoSubscription && selectedBilling.plan.clicks < Number(subscription.plan.metadata.clicks)
                ? -1
                : 1;
        setSwitching(true);
        onClickSaveBtn(selectedBilling, upgradeOrDowngrade);
    };

    const cancelSubscription = async () => {
        setCancelling(true);
        setShowSuccess({});
        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);

        try {
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

            await dispatch(Account.getUserSubscriptions(accounts.data.stripe_token));

            if (isBooster || (subscription.appSumoSubscription && !isBooster)) {
                window.Intercom("trackEvent", "booster-canceled", {
                    account: accounts.data.id,
                    reason: cancelReason,
                });
                await dispatch(
                    Account.fetchLatestAccount(accounts.data.id, () => {
                        listDomains();
                        setIsBooster(false);
                        setShowCancelModal(false);
                        setCancelling(false);
                        setShowSuccess({
                            message: "Your plan has now been canceled.",
                        });
                        setSuccessActions([
                            {
                                title: "Back To Dashboard",
                                color: "lt-blue",
                                action: () => navigate("/dashboard"),
                            },
                        ]);
                    })
                );
                toggleActionSuccessModal();
                return;
            }

            listDomains();
            setShowCancelModal(false);
            setCancelling(false);
            setShowSuccess({ message: "Your plan has now been canceled." });
            setSuccessActions([
                {
                    title: "Back To Dashboard",
                    color: "lt-blue",
                    action: () => navigate("/dashboard"),
                },
            ]);
        } catch (error) {
            setErrors({ cancelError: error.message });
            setCancelling(false);
        }
    };

    const handleCancelAccount = () => {
        setShowAddDomainModal(false);
        if (!accounts.data) return;

        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
        if (subscription) {
            setShowCancelModal(true);
            setIsBooster(false);
        }
    };

    const getVisibleDomains = (domains) => {
        if (domains === "unlimited") return "Unlimited websites";
        if (domains === "1") return "1 website";
        return `Up to ${domains} websites`;
    };

    const toggleCancelResolutionModal = () => {
        setShowCancelResolutionModal((prev) => !prev);
    };

    const handleCancelReason = (reason) => {
        setCancelReason(reason);
        setShowCancelReasonModal(false);
        window.Intercom("trackEvent", cancelReason, {
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
        if (!accounts?.data) return;

        setApplyingDiscount(true);
        setErrors({});
        setShowSuccess({});

        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);

        if (!subscription) {
            setApplyingDiscount(false);
            return;
        }

        try {
            const coupon = await Payments.getCouponDetails(process.env.REACT_APP_COUPON_CODE_FIFTY_PERCENT);

            if (!coupon) {
                setDiscountError("Offer could not be applied at the moment.");
                setApplyingDiscount(false);
                return;
            }

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
                    action: () => navigate("/dashboard"),
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
        } catch (error) {
            setDiscountError(error.message);
            setApplyingDiscount(false);
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
            applyDiscountOnSubscription();
        }
    };

    const toggleActionSuccessModal = () => {
        setShowActionSuccessModal((prev) => !prev);
    };

    const subscription = accounts?.data ? Utils.getSingleSubscription(accounts, accounts.data.id) : null;

    const isSubscriptionCancelled =
        subscription &&
        (subscription.appSumoSubscription
            ? subscription.appSumoSubscription.status === "canceled"
            : subscription.status === "canceled");

    const noDomains = accounts?.data && accounts.data.domains.filter((item) => !item.is_deleted).length === 0;

    const deletedDomainsCount = accounts?.data && accounts.data.domains.filter((item) => item.is_deleted).length;

    const source = getSource();

    const totalLimitClicks =
        accounts?.data &&
        accounts.data.domains
            .filter((item) => !item.is_deleted)
            .reduce((acc, domain) => acc + parseInt(domain.clicks_limit || 0, 10), 0);

    let currentPlan = subscription?.plan || null;

    let currentDiscount = subscription?.discount?.coupon?.amount_off ? subscription.discount.coupon.amount_off : 0;

    if (currentPlan) {
        const planOption = planDropdownOptions.find((item) => item.id === currentPlan.id);
        if (planOption) {
            currentPlan.amount = planOption.price;
            if (subscription?.discount?.coupon?.percent_off) {
                currentDiscount = (currentPlan.amount * subscription.discount.coupon.percent_off) / 100;
            }
        }
    }

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

    return (
        <div className={styles.content}>
            <ReactTooltip id="restoreDomain" className={styles.tooltipContent}>
                <div>Reactivate</div>
            </ReactTooltip>

            {/* Modals */}
            {showCancelModal && (
                <CancelPlanModal
                    isOpen={showCancelModal}
                    toggleModal={toggleCancelModal}
                    isBooster={isBooster}
                    isLoading={isCancelling}
                    error={errors.cancelError}
                    lastDate={subscription ? subscription.current_period_end : 0}
                    cancelSubscription={cancelSubscription}
                />
            )}
            {showCancelReasonModal && (
                <CancelReasonModal
                    isOpen={showCancelReasonModal}
                    toggleModal={toggleCancelReasonModal}
                    isBooster={isBooster}
                    error={errors.cancelError}
                    handleCancelReason={handleCancelReason}
                />
            )}
            {showActionSuccessModal && (
                <ActionSuccessModal
                    isOpen={showActionSuccessModal}
                    toggleModal={toggleActionSuccessModal}
                    description={showSuccess?.message}
                    buttons={successActions}
                />
            )}
            {showCancelResolutionModal && (
                <CancelReasonSolutionModal
                    isOpen={showCancelResolutionModal}
                    toggleModal={toggleCancelResolutionModal}
                    error={discountError}
                    reason={cancelReason}
                    isLoading={applyingDiscount}
                    handleSolutionAction={handleSolutionAction}
                    goBack={handleCancelBack}
                />
            )}
            {showComparePlanModal && (
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
            )}
            {showBoosterPlanModal && (
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
            )}
            {showConfirmPlanModal && (
                <ConfirmPlanModal
                    isOpen={showConfirmPlanModal}
                    toggleModal={toggleConfirmPlanModal}
                    currentPlan={currentPlan}
                    discount={discount}
                    currentDiscount={currentDiscount}
                    plans={planDropdownOptions}
                    selectedPlan={selectedBilling}
                    switchPlan={switchPlan}
                    renewDate={
                        currentPlan && currentPlan.nickname.toLowerCase().includes("appsumo")
                            ? moment().add(31, "days").format("MMMM D, YYYY")
                            : (subscription &&
                                  (subscription.status !== "canceled" ||
                                      (subscription.status === "canceled" &&
                                          subscription.trial_end > moment().unix())) &&
                                  moment.unix(subscription.current_period_end).format("MMMM D, YYYY")) ||
                              moment().format("MMMM D, YYYY")
                    }
                    switching={switching}
                    conversionRates={accounts.conversionRates}
                    currency={currency.value}
                    source={getSource(true)}
                />
            )}
            <UpgradePlanSuccessModal
                isOpen={showUpgradeSuccessModal}
                toggleModal={openUpgradeSuccessModal}
                history={navigate}
            />
            <UpgradePlanDeclineModal
                isOpen={showUpgradeErrorModal}
                toggleModal={openUpgradeErrorModal}
                history={navigate}
            />
            <UnprotectedAccountModal
                isOpen={subscription && showActionRequiredModal && isSubscriptionCancelled}
                isAppSumo={false}
                onSelectPlanClick={() => openComparePlanModal("switch")}
            />

            {/* Main Content */}
            <h1 className={styles.title}>Current Subscription</h1>
            <p>
                Easily adjust your subscription plans for each of your domains here. When upgrading or downgrading
                plans, billed rates are pro-rated based on click usage and, for new domains, the billing period begins
                once the free trial period ends.
            </p>

            <div className={styles.subscriptionWrapper}>
                <div className={styles.subsWebList}>
                    {/* List Header */}
                    <div className={styles.listHead}>
                        <div className={styles.listHeading}>Website</div>
                        <div className={styles.listHeading}>Usage</div>
                        <div className={styles.listHeading}>Limit</div>
                        <div className={styles.listHeading}></div>
                    </div>

                    {/* List Body */}
                    <div className={styles.listBody}>
                        {domains.map((domain, index) =>
                            !domain.is_deleted ? (
                                <div
                                    key={index}
                                    className={`${styles.listBodyRow} ${
                                        removeIndex === index ? styles.removeSubRow : ""
                                    }`}
                                >
                                    <div className={styles.domianName}>{domain.name}</div>
                                    <div
                                        className={`${styles.domianUsage} ${
                                            domain.clicks_limit && (clicks[domain.id] || 0) > domain.clicks_limit
                                                ? styles.redColor
                                                : ""
                                        }`}
                                    >
                                        {Number(clicks[domain.id] || 0).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}
                                    </div>
                                    <div className={styles.domainLimit}>
                                        <span className={styles.limitVal}>
                                            {domain.clicks_limit
                                                ? Number(domain.clicks_limit).toLocaleString("en-US", {
                                                      maximumFractionDigits: 1,
                                                  })
                                                : "-"}
                                        </span>
                                        <a
                                            className={styles.setLimit}
                                            href={null}
                                            onClick={() => openDomainLimitModal(index)}
                                        >
                                            {domain.clicks_limit ? "Edit" : "Set"}
                                        </a>
                                    </div>
                                    <div className={styles.damainDelete}>
                                        <span>
                                            <DeleteIcon
                                                style={customStyles.removeBtn}
                                                onClick={() => onClickRemoveDomain(index)}
                                            />
                                        </span>
                                    </div>
                                </div>
                            ) : null
                        )}

                        {/* Deleted Domains Accordion */}
                        {deletedDomainsCount > 0 && (
                            <button
                                onClick={toggleDeletedDomains}
                                className={`${styles.accordian} ${deletedDomainsExpanded ? styles.active : ""}`}
                            >
                                Deleted <strong>({deletedDomainsCount})</strong>
                            </button>
                        )}

                        {/* Deleted Domains List */}
                        <div
                            className={`${styles.deletedDomain} ${
                                deletedDomainsExpanded ? styles.open : styles.closed
                            }`}
                        >
                            {domains.map(
                                (domain, index) =>
                                    domain.is_deleted && (
                                        <div key={index} className={styles.listBodyRow}>
                                            <div className={styles.domianName}>{domain.name}</div>
                                            <div className={styles.domianUsage}>
                                                {`${Number(clicks[domain.id] || 0).toLocaleString("en-US", {
                                                    maximumFractionDigits: 1,
                                                })} / ${
                                                    currentPlan &&
                                                    currentPlan.metadata.clicks.toLocaleString("en-US", {
                                                        maximumFractionDigits: 1,
                                                    })
                                                }`}
                                            </div>
                                            <div className={styles.domainLimit}>
                                                <span className={styles.limitVal}>-</span>
                                            </div>
                                            {restoreIndex === index ? (
                                                <div className={styles.restoring}>...</div>
                                            ) : (
                                                <div className={styles.deleted}>
                                                    Deleted
                                                    {currentPlan &&
                                                        (currentPlan.metadata.domains === "unlimited" ||
                                                            domains.filter((item) => !item.is_deleted).length <
                                                                parseInt(currentPlan.metadata.domains, 10) ||
                                                            (subscription.metadata.domain &&
                                                                domains.filter((item) => !item.is_deleted).length <
                                                                    parseInt(subscription.metadata.domain, 10))) && (
                                                            <img
                                                                data-tip
                                                                data-for="restoreDomain"
                                                                className={styles.restoreBtn}
                                                                src={Reactivate}
                                                                onClick={() => restoreDomain(index)}
                                                                alt="Reactivate"
                                                            />
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    )
                            )}
                        </div>
                    </div>

                    {/* List Footer */}
                    <div className={styles.listFooter}>
                        <div className={styles.usageLabel}>Total usage</div>
                        <div className={styles.usageValue}>
                            <strong>
                                {totalClicks.toLocaleString("en-US", {
                                    maximumFractionDigits: 1,
                                })}
                                /
                                {currentPlan &&
                                    Number(currentPlan.metadata.clicks).toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                            </strong>
                        </div>
                    </div>

                    {/* Add Domain Button */}
                    <div className={styles.addDomain}>
                        <Button variant="outlined" style={customStyles.addDomainBtn} onClick={onClickAddDomain}>
                            + Add Website
                        </Button>
                    </div>

                    {/* Message Section */}
                    <div className={styles.messageSection}>
                        {errors.removeError && <ErrorBox error={errors.removeError} />}
                        {showSuccess.message && <SuccessBox message={showSuccess.message} />}
                    </div>
                </div>

                {/* Current Subscription Details */}
                <div className={styles.subsCurrent}>
                    <div className={styles.curHeading}>
                        Plan Details
                        {currentPlan && !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                            <span
                                onClick={() => openComparePlanModal("compare")}
                                style={{
                                    ...customStyles.headerDescription,
                                    textDecoration: "underline",
                                }}
                            >
                                Compare Plans
                            </span>
                        )}
                        {subscription?.appSumoSubscription && (
                            <div className={styles.planToggle}>
                                <div
                                    onClick={toggleVisiblePlan}
                                    className={visiblePlan === "primary" ? styles.active : ""}
                                    role="button"
                                >
                                    Primary
                                </div>
                                <div
                                    onClick={toggleVisiblePlan}
                                    className={visiblePlan !== "primary" ? styles.active : ""}
                                    role="button"
                                >
                                    Booster
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Plan Details */}
                    {subscription && visiblePlan === "primary" && planDropdownOptions.length > 0 && (
                        <div className={styles.animatedSection}>
                            <div className={styles.planRow}>
                                <div className={styles.planLabel}>Plan Tier</div>
                                <div className={styles.planValue}>
                                    {currentPlan &&
                                        subscription &&
                                        subscription.status === "trialing" &&
                                        !currentPlan.nickname.toLowerCase().includes("boost") && (
                                            <>
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") &&
                                                subscription.appSumoSubscription?.plan
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}
                                                Plan(Free Trial)
                                            </>
                                        )}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled && (
                                        <div>Canceled</div>
                                    )}
                                    {currentPlan &&
                                        subscription &&
                                        accounts.subscriptionValid &&
                                        (subscription.status !== "trialing" ||
                                            currentPlan.nickname.toLowerCase().includes("boost")) && (
                                            <>
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}
                                                {subscription?.appSumoSubscription && visiblePlan === "primary"
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}
                                                Plan
                                            </>
                                        )}
                                    {!subscription && (
                                        <strong>
                                            <span>!</span> Limit Reached.
                                        </strong>
                                    )}
                                </div>
                                {currentPlan &&
                                    subscription &&
                                    subscription.status === "trialing" &&
                                    !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                        <p className={styles.trialRemaining}>
                                            {moment.unix(subscription.trial_end).diff(moment(), "days")}
                                            days remain
                                        </p>
                                    )}
                            </div>

                            {/* Cost and Clicks */}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Cost</div>
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                        <div className={styles.planValue}>
                                            {currencySymbols[currency.value] || "$"}0
                                        </div>
                                    ) : (
                                        <div className={styles.planValue}>
                                            {subscription && subscription.status === "trialing"
                                                ? "Free"
                                                : currentPlan && currentPlan.nickname
                                                  ? Utils.convertToCurrency(
                                                        accounts.conversionRates,
                                                        subscription?.appSumoSubscription && visiblePlan === "primary"
                                                            ? subscription.appSumoSubscription.plan.metadata
                                                                  .plan_value - currentDiscount
                                                            : currentPlan.amount - currentDiscount,
                                                        currency.value
                                                    )
                                                  : Utils.convertToCurrency(
                                                        accounts.conversionRates,
                                                        0,
                                                        currency.value
                                                    )}
                                            {currentPlan &&
                                                (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                                    (currentPlan.nickname.toLowerCase().includes("boost") &&
                                                        visiblePlan === "booster")) &&
                                                subscription &&
                                                subscription.status !== "trialing" && (
                                                    <>
                                                        /
                                                        {currentPlan.interval === "month" &&
                                                        currentPlan.interval_count === 1
                                                            ? "mo"
                                                            : currentPlan.interval === "month" &&
                                                                currentPlan.interval_count === 3
                                                              ? "qr"
                                                              : "yr"}
                                                    </>
                                                )}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Ad Clicks</div>
                                    <div className={styles.planValue}>
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? 0
                                            : currentPlan &&
                                              Number(
                                                  subscription?.appSumoSubscription && visiblePlan === "primary"
                                                      ? subscription.appSumoSubscription.plan.metadata.clicks
                                                      : planDropdownOptions.find((item) => item.id === currentPlan.id)
                                                            .clicks
                                              ).toLocaleString("en-US", {
                                                  maximumFractionDigits: 1,
                                              })}
                                        ad clicks
                                    </div>
                                </div>
                            </div>

                            {/* Renewal and Websites */}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                {currentPlan &&
                                    (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                        visiblePlan === "booster") && (
                                        <div className={styles.col50}>
                                            <div className={styles.planLabel}>Renewal Date</div>
                                            <div className={styles.planValue}>
                                                {subscription &&
                                                    (subscription.status !== "canceled" &&
                                                    currentPlan &&
                                                    !currentPlan.nickname.toLowerCase().includes("appsumo") ? (
                                                        moment
                                                            .unix(subscription.current_period_end)
                                                            .format("MMMM D, YYYY")
                                                    ) : moment
                                                          .unix(subscription.current_period_end)
                                                          .diff(moment(), "days") >= 0 ? (
                                                        <div>
                                                            <div className={styles.expiring}>Canceled</div>
                                                            <div className={styles.activeUntil}>
                                                                Active until
                                                                {subscription
                                                                    ? moment
                                                                          .unix(subscription.current_period_end)
                                                                          .format("MMMM D, একসঙ্গে")
                                                                    : ""}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        "Expired"
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Websites</div>
                                    <div className={styles.planValue}>
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? "0 websites"
                                            : currentPlan &&
                                              (subscription.appSumoSubscription && visiblePlan === "primary"
                                                  ? getVisibleDomains(
                                                        subscription.appSumoSubscription?.metadata?.domain ||
                                                            subscription.appSumoSubscription.plan.metadata.domains
                                                    )
                                                  : getVisibleDomains(
                                                        subscription.metadata.domain || currentPlan.metadata.domains
                                                    ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Booster Plan Details (if applicable) */}
                    {subscription && visiblePlan === "booster" && (
                        <div className={styles.animatedSection}>
                            <div className={styles.planRow}>
                                <div className={styles.planLabel}>Plan Tier 1</div>
                                <div className={styles.planValue}>
                                    {currentPlan &&
                                        subscription &&
                                        subscription.status === "trialing" &&
                                        !currentPlan.nickname.toLowerCase().includes("boost") && (
                                            <>
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("boost") &&
                                                (visiblePlan === "booster" || !subscription.appSumoSubscription)
                                                    ? currentPlan.nickname
                                                    : subscription.appSumoSubscription.plan.nickname}
                                                Plan(Free Trial)
                                            </>
                                        )}
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled && (
                                        <div>Canceled</div>
                                    )}
                                    {currentPlan &&
                                        subscription &&
                                        (subscription.status !== "trialing" ||
                                            currentPlan.nickname.toLowerCase().includes("boost")) && (
                                            <>
                                                {currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                                    <img src={Taco} alt="AppSumo" />
                                                )}
                                                {currentPlan.nickname.toLowerCase().includes("pro") && (
                                                    <img src={Crown} alt="Pro" />
                                                )}
                                                {subscription &&
                                                subscription.appSumoSubscription &&
                                                visiblePlan === "primary"
                                                    ? subscription.appSumoSubscription.plan.nickname
                                                    : currentPlan.nickname}
                                                Plan
                                            </>
                                        )}
                                    {!subscription && (
                                        <strong>
                                            <span>!</span> Limit Reached.
                                        </strong>
                                    )}
                                </div>
                                {currentPlan &&
                                    subscription &&
                                    subscription.status === "trialing" &&
                                    !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                                        <p className={styles.trialRemaining}>
                                            {moment.unix(subscription.trial_end).diff(moment(), "days")}
                                            days remain
                                        </p>
                                    )}
                            </div>

                            {/* Cost and Clicks */}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Cost</div>
                                    {subscription && !accounts.subscriptionValid && isSubscriptionCancelled ? (
                                        <div className={styles.planValue}>
                                            {currencySymbols[currency.value] || "$"}0
                                        </div>
                                    ) : (
                                        <div className={styles.planValue}>
                                            {subscription && subscription.status === "trialing"
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
                                                    )}
                                            {currentPlan &&
                                                (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                                    (currentPlan.nickname.toLowerCase().includes("boost") &&
                                                        visiblePlan === "booster")) &&
                                                subscription &&
                                                subscription.status !== "trialing" && (
                                                    <>
                                                        /
                                                        {currentPlan.interval === "month" &&
                                                        currentPlan.interval_count === 1
                                                            ? "mo"
                                                            : currentPlan.interval === "month" &&
                                                                currentPlan.interval_count === 3
                                                              ? "qr"
                                                              : "yr"}
                                                    </>
                                                )}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Ad Clicks</div>
                                    <div className={styles.planValue}>
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
                                              ).toLocaleString("en-US", { maximumFractionDigits: 1 })}
                                        ad clicks
                                    </div>
                                </div>
                            </div>

                            {/* Renewal and Websites */}
                            <div className={`${styles.planRow} ${styles.planDuoRow}`}>
                                {currentPlan &&
                                    (!currentPlan.nickname.toLowerCase().includes("appsumo") ||
                                        visiblePlan === "booster") && (
                                        <div className={styles.col50}>
                                            <div className={styles.planLabel}>Renewal Date</div>
                                            <div className={styles.planValue}>
                                                {subscription &&
                                                    (subscription.status !== "canceled" ? (
                                                        moment
                                                            .unix(subscription.current_period_end)
                                                            .format("MMMM D, একসঙ্গে")
                                                    ) : moment.unix(subscription.trial_end).diff(moment(), "days") >=
                                                      0 ? (
                                                        <>
                                                            Expires
                                                            {subscription
                                                                ? moment
                                                                      .unix(subscription.current_period_end)
                                                                      .format("MMMM D, একসঙ্গে")
                                                                : ""}
                                                        </>
                                                    ) : (
                                                        "Expired"
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                <div className={styles.col50}>
                                    <div className={styles.planLabel}>Websites</div>
                                    <div className={styles.planValue}>
                                        {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                            ? "0 websites"
                                            : currentPlan &&
                                              (subscription.appSumoSubscription && visiblePlan === "primary"
                                                  ? getVisibleDomains(
                                                        subscription.appSumoSubscription?.metadata?.domains ||
                                                            subscription.appSumoSubscription.plan.metadata.domains
                                                    )
                                                  : getVisibleDomains(
                                                        subscription.metadata.domain || currentPlan.metadata.domains
                                                    ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total Price */}
                    {currentPlan && (
                        <div className={styles.currentTotal}>
                            <div className={styles.totalCurrent}>Total Price:</div>
                            <div className={styles.totalCurrentValue}>
                                {subscription && !accounts.subscriptionValid && isSubscriptionCancelled
                                    ? Utils.convertToCurrency(accounts.conversionRates, 0, currency.value)
                                    : `${Utils.convertToCurrency(
                                          accounts.conversionRates,
                                          currentPlan.amount - currentDiscount,
                                          currency.value
                                      )}${
                                          currentPlan.nickname.toLowerCase().includes("appsumo tier")
                                              ? ""
                                              : `/${
                                                    currentPlan.interval === "month" && currentPlan.interval_count === 1
                                                        ? "mo"
                                                        : currentPlan.interval === "month" &&
                                                            currentPlan.interval_count === 3
                                                          ? "qr"
                                                          : "yr"
                                                }`
                                      }`}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className={styles.currPlanBtns}>
                        {currentPlan &&
                            !currentPlan.nickname.toLowerCase().includes("appsumo tier") &&
                            subscription &&
                            auth.user &&
                            auth.user.role !== "Manager" && (
                                <Button
                                    onClick={() => openComparePlanModal("switch", currentPlan, subscription)}
                                    variant="contained"
                                    color={isSubscriptionCancelled ? "error" : "primary"}
                                    style={isSubscriptionCancelled ? customStyles.redButton : {}}
                                >
                                    Change Plan
                                </Button>
                            )}
                        {currentPlan &&
                            currentPlan.nickname.toLowerCase().includes("appsumo tier") &&
                            subscription &&
                            auth.user &&
                            auth.user.role !== "Manager" && (
                                <Button
                                    onClick={() => openComparePlanModal("switch", currentPlan, subscription)}
                                    variant="contained"
                                    color={isSubscriptionCancelled ? "error" : "primary"}
                                    style={isSubscriptionCancelled ? customStyles.redButton : {}}
                                >
                                    Change Plan
                                </Button>
                            )}
                        {currentPlan && !currentPlan.nickname.toLowerCase().includes("appsumo") && (
                            <Link to="/account/billing/invoices">View Invoices</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Other Modals */}
            <AddDomainModal
                onCancel={closeDomainCancelModal}
                onSuccess={toggleDomainSuccessModal}
                isOpen={showAddDomainModal}
                forceToAdd={forceToAdd && noDomains}
                onCancelAccount={handleCancelAccount}
            />
            <AddDomainSuccessModal
                isOpen={showDomainSuccessModal}
                toggleModal={toggleDomainSuccessModal}
                history={navigate}
            />
            {showDomainLimitModal && (
                <DomainLimitModal
                    isOpen={showDomainLimitModal}
                    toggleModal={closeDomainLimitModal}
                    sid={domains[domainLimitIndex]?.id}
                    onSuccess={() => closeDomainLimitModal(true)}
                    onCancel={closeDomainLimitModal}
                    totalClicks={currentPlan && parseInt(currentPlan.metadata.clicks, 10)}
                    availableClicks={currentPlan ? parseInt(currentPlan.metadata.clicks, 10) - totalLimitClicks : 0}
                    currentClicks={domains[domainLimitIndex] ? clicks[domains[domainLimitIndex].id] || 0 : 0}
                    currentLimit={domains[domainLimitIndex] && parseInt(domains[domainLimitIndex].clicks_limit, 10)}
                />
            )}

            {/* Divider */}
            <div style={customStyles.divider} />

            {/* Billing Information */}
            {(!currentPlan || !currentPlan.nickname.toLowerCase().includes("appsumo tier")) && (
                <p style={customStyles.billedToText}>
                    {source.last4 ? (
                        <>
                            Billed to {getCardIcon(source.brand.toLowerCase())}
                            {!getCardIcon(source.brand.toLowerCase()) ? source.brand : ""}
                            ending in ** ** ** ** {source.last4}
                        </>
                    ) : (
                        ""
                    )}
                    {!!source.last4 && (
                        <span style={customStyles.updateCard}>
                            <a onClick={onClickUpdateCard} style={customStyles.link}>
                                Update your card
                            </a>
                        </span>
                    )}
                    {!source.last4 && (
                        <div style={customStyles.noCardWrap}>
                            <CCImage style={customStyles.ccIcon} />
                            <div style={customStyles.payInfo}>PAYMENT INFORMATION</div>
                            <div style={customStyles.noCard}>You currently have no credit card on file.</div>
                            <div>
                                <a onClick={toggleUpdateCardModal} style={customStyles.newCard}>
                                    Add one now
                                </a>
                            </div>
                        </div>
                    )}
                </p>
            )}

            {/* Stripe Elements */}
            <StripeProvider apiKey={Constants.stripePublicKey}>
                <Elements>
                    <>
                        {showUpdateCardModal && (
                            <UpdateCardModal
                                isOpen={showUpdateCardModal}
                                toggleModal={toggleUpdateCardModal}
                                accounts={accounts}
                                source={source}
                                fetchLatestSubscriptionInfo={fetchLatestSubscriptionInfo}
                            />
                        )}
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
                        )}
                    </>
                </Elements>
            </StripeProvider>
            <div id="calendy-scheduler"></div>
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

export default Subscription;
