import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { Button, Typography, Box, Slider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./ComparePlanModal.module.scss";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";

const { clicksValueMap } = Constants;

const customStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 11,
        overflow: "auto",
        padding: "40px 0",
    },
    content: {
        inset: "20px 0 0 0", // Using inset for positioning
        width: 551,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "40px 45px",
        position: "relative",
    },
};

const ChangePlanModal = ({
    isOpen,
    toggleModal,
    toggleCancelPlan,
    toggleConfirmPlanModal,
    plans,
    compareOnly,
    isCancelable,
    currentPlan,
    currency,
    conversionRates,
    discount,
    currentDiscount,
}) => {
    const [proClicks, setProClicks] = useState(10000);
    const [billingOptions, setBillingOptions] = useState([]);
    const [selectedBilling, setSelectedBilling] = useState(currentPlan || {});

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const setBillingOptionsState = useCallback(() => {
        const options = plans.map((plan) => ({
            id: plan.id,
            plan: plan.nickname.split(" - ")[0],
            nickname: plan.nickname,
            trial_period_days: plan.trial_period_days || 30,
            interval: plan.interval,
            interval_count: plan.interval_count,
            price: plan.amount / 100,
            clicks: parseInt(plan.metadata.clicks, 10),
            domains: plan.metadata.domains,
        }));

        let defaultSelectedBilling = options.find(
            (item) =>
                (currentPlan && item.id === currentPlan.id) ||
                (item.plan === "Pro" && item.interval === "month" && item.interval_count === 1)
        );

        // Ensure defaultSelectedBilling is defined
        if (!defaultSelectedBilling) {
            defaultSelectedBilling = options[0]; // default to first option, improve later logic if no plan
        }

        let defaultProClicks = defaultSelectedBilling.clicks;
        if (
            !options.find(
                (item) =>
                    item.plan === "Pro" && item.interval === "year" && item.clicks === defaultSelectedBilling.clicks
            )
        ) {
            defaultProClicks = 10000; // Default if no yearly Pro with same clicks
        }

        setBillingOptions(options);
        setSelectedBilling(defaultSelectedBilling);
        setProClicks(currentPlan?.nickname.includes("Pro") ? Number(currentPlan.metadata.clicks) : defaultProClicks);
    }, [plans, currentPlan]);

    useEffect(() => {
        if (plans && plans.length) {
            setBillingOptionsState();
        }
    }, [plans, setBillingOptionsState]);

    useEffect(() => {
        if (currentPlan && !billingOptions.find((item) => item.id === currentPlan.id)) {
            setBillingOptionsState();
        }
    }, [currentPlan, billingOptions, setBillingOptionsState]);

    const getPlanClicks = useCallback(
        (plan) => {
            if (billingOptions.length && selectedBilling.id) {
                if (plan === "Starter") {
                    return billingOptions.find(
                        (item) =>
                            item.plan.includes(plan) &&
                            item.interval === selectedBilling.interval &&
                            item.interval_count === selectedBilling.interval_count
                    )?.clicks;
                } else if (plan === "Pro") {
                    return proClicks;
                }
            }
            return "";
        },
        [billingOptions, selectedBilling, proClicks]
    );

    const updateClicks = useCallback(
        (event, newValue) => {
            let clicks = clicksValueMap[newValue] || newValue; // Directly use the value from the slider

            setProClicks(clicks);
            setSelectedBilling(
                billingOptions.find(
                    (item) =>
                        item.plan === "Pro" &&
                        item.clicks === clicks &&
                        item.interval === selectedBilling.interval &&
                        item.interval_count === selectedBilling.interval_count
                ) || selectedBilling // Keep current if not found
            );
        },
        [billingOptions, selectedBilling]
    );

    const changePlan = useCallback(
        (plan, doSave = false) => {
            setSelectedBilling(plan);
            if (doSave) {
                toggleConfirmPlanModal(plan);
            }
        },
        [toggleConfirmPlanModal]
    );

    const getPrice = useCallback(
        (price) => {
            const { interval, interval_count, clicks } = selectedBilling;
            const isCurrentStarterPlan =
                currentPlan?.nickname.includes("Starter") &&
                currentPlan?.interval_count === interval_count &&
                currentPlan?.interval === interval;

            const isCurrentProPlan =
                currentPlan?.nickname.includes("Pro") &&
                currentPlan?.interval === interval &&
                currentPlan?.interval_count === interval_count &&
                Number(currentPlan?.metadata.clicks) === proClicks;
            if (currentDiscount && (isCurrentStarterPlan || isCurrentProPlan)) {
                return price - currentDiscount; // Apply existing discount.
            }

            if (!isCancelable && (!isCurrentStarterPlan || !isCurrentProPlan)) {
                return price;
            }

            if (currentDiscount && !discount) {
                return price - currentDiscount;
            }

            if (!discount) {
                return price;
            }
            return price - (price * discount) / 100; // Apply new discount
        },
        [currentPlan, isCancelable, discount, currentDiscount, selectedBilling, proClicks]
    );

    const getPriceDifference = useCallback(() => {
        return Utils.convertToCurrencyNumeric(
            conversionRates,
            getPrice(
                billingOptions.find(
                    (item) =>
                        item.plan === "Pro" &&
                        item.interval === selectedBilling.interval &&
                        item.interval_count === selectedBilling.interval_count &&
                        item.clicks === proClicks
                )?.price || 0 // safely get price, default to 0
            ) -
                (billingOptions.find(
                    (item) =>
                        item.plan === "Starter" &&
                        item.interval === selectedBilling.interval &&
                        item.interval_count === selectedBilling.interval_count
                )?.price || 0), // safely get price. default to 0
            currency
        );
    }, [billingOptions, selectedBilling, proClicks, conversionRates, currency, getPrice]);

    if (!billingOptions.length || !selectedBilling) {
        return null; // Or a loading indicator/placeholder
    }

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Compare Plans">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>

                <Box className={`${styles.content} ${styles.compareModalContent}`}>
                    <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                        {compareOnly ? "Compare Plans" : "Adjust Your Plan"}
                    </Typography>
                    <Box className={styles.switchDuration}>
                        <Box className={styles.switchButtons}>
                            <Button
                                onClick={() =>
                                    changePlan(
                                        billingOptions.find(
                                            (item) =>
                                                item.plan === selectedBilling.plan &&
                                                (selectedBilling.plan === "Starter" || item.clicks === proClicks) &&
                                                item.interval === "year"
                                        )
                                    )
                                }
                                variant={selectedBilling.interval === "year" ? "contained" : "outlined"}
                                color="primary"
                            >
                                Annual <span>Save 20%</span>
                            </Button>

                            <Button
                                onClick={() =>
                                    changePlan(
                                        billingOptions.find(
                                            (item) =>
                                                item.plan === selectedBilling.plan &&
                                                (selectedBilling.plan === "Starter" || item.clicks === proClicks) &&
                                                item.interval === "month" &&
                                                item.interval_count === 3
                                        )
                                    )
                                }
                                variant={
                                    selectedBilling.interval_count === 3 && selectedBilling.interval === "month"
                                        ? "contained"
                                        : "outlined"
                                }
                                color="primary"
                            >
                                Quarterly <span>Save 12%</span>
                            </Button>

                            <Button
                                onClick={() =>
                                    changePlan(
                                        billingOptions.find(
                                            (item) =>
                                                item.plan === selectedBilling.plan &&
                                                (selectedBilling.plan === "Starter" || item.clicks === proClicks) &&
                                                item.interval === "month" &&
                                                item.interval_count === 1
                                        )
                                    )
                                }
                                variant={
                                    selectedBilling.interval_count === 1 && selectedBilling.interval === "month"
                                        ? "contained"
                                        : "outlined"
                                }
                                color="primary"
                            >
                                Monthly
                            </Button>
                        </Box>
                    </Box>

                    <Box className={styles.gridContent}>
                        {/* Starter Plan */}
                        <Box className={styles.gridCell}>
                            <Typography variant="h6" className={styles.planHeading}>
                                Starter
                            </Typography>
                            <Typography variant="h5" className={styles.planValue} sx={{ mb: "38px" }}>
                                {billingOptions.length &&
                                    selectedBilling.id &&
                                    Utils.convertToCurrency(
                                        conversionRates,
                                        billingOptions.find(
                                            (item) =>
                                                item.plan === "Starter" &&
                                                item.interval === selectedBilling.interval &&
                                                item.interval_count === selectedBilling.interval_count
                                        ).price,
                                        currency
                                    )}
                                <span>
                                    /{selectedBilling.interval_count === 3 ? "quarter" : selectedBilling.interval}
                                </span>
                            </Typography>
                            <Box className={styles.planAdv}>
                                <Typography className={styles.clicksDigit}>
                                    Up to{" "}
                                    {getPlanClicks("Starter").toLocaleString("en-US", { maximumFractionDigits: 1 })} Ad
                                    Clicks
                                </Typography>

                                {!compareOnly &&
                                    (!(
                                        currentPlan &&
                                        currentPlan.nickname.includes("Starter") &&
                                        currentPlan.interval === selectedBilling.interval &&
                                        currentPlan.interval_count === selectedBilling.interval_count
                                    ) ||
                                        !isCancelable) &&
                                    (!currentPlan || currentPlan.nickname.includes("Starter") ? (
                                        <Box className={styles.btnOuter}>
                                            <Button
                                                onClick={() =>
                                                    changePlan(
                                                        billingOptions.find(
                                                            (option) =>
                                                                option.plan === "Starter" &&
                                                                option.interval === selectedBilling.interval &&
                                                                option.interval_count === selectedBilling.interval_count
                                                        ),
                                                        true
                                                    )
                                                }
                                                variant="contained"
                                                color="info"
                                            >
                                                Switch
                                            </Button>
                                        </Box>
                                    ) : (
                                        <a
                                            className={styles.contactUs}
                                            href="https://fraudblocker.com/contact-us"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Contact us to downgrade
                                        </a>
                                    ))}

                                {!compareOnly &&
                                    isCancelable &&
                                    currentPlan &&
                                    currentPlan.nickname.includes("Starter") &&
                                    currentPlan.interval === selectedBilling.interval &&
                                    currentPlan.interval_count === selectedBilling.interval_count && (
                                        <Box className={styles.btnOuter}>
                                            <Button disabled variant="contained" color="primary">
                                                Current Plan
                                            </Button>
                                        </Box>
                                    )}
                                <Box component="ul">
                                    <Box component="li" className={styles.active}>
                                        {billingOptions.length &&
                                            selectedBilling.id &&
                                            billingOptions.find(
                                                (item) =>
                                                    item.plan === "Starter" &&
                                                    item.interval === selectedBilling.interval &&
                                                    item.interval_count === selectedBilling.interval_count
                                            ).domains}{" "}
                                        Website
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Fraud Traffic Scoring
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Real-Time, 24/7 Monitoring
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Automated Blocking
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Google & Meta Protection
                                    </Box>
                                    <Box component="li" className={styles.inActive}>
                                        Dedicated Account Manager
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Pro Plan */}
                        <Box className={`${styles.gridCell} ${styles.activeCell}`}>
                            <Box className={`${styles.bestValue} ${discount ? styles.discountApplied : ""}`}>
                                {discount ? `${discount}% Discount Applied!` : "Best Value"}
                            </Box>
                            <Typography variant="h6" className={styles.planHeading}>
                                Pro
                            </Typography>
                            <Typography variant="h5" className={styles.planValue}>
                                {billingOptions.length &&
                                    selectedBilling &&
                                    selectedBilling.id &&
                                    Utils.convertToCurrency(
                                        conversionRates,
                                        getPrice(
                                            billingOptions.find(
                                                (item) =>
                                                    item.plan === "Pro" &&
                                                    item.interval === selectedBilling.interval &&
                                                    item.interval_count === selectedBilling.interval_count &&
                                                    item.clicks === proClicks
                                            )?.price || 0 //default to 0
                                        ),
                                        currency
                                    )}
                                <span>
                                    /{selectedBilling.interval_count === 3 ? "quarter" : selectedBilling.interval}
                                </span>
                            </Typography>
                            {getPriceDifference() > 0 && (
                                <Typography variant="body2" className={styles.planDiscount}>
                                    or <span>{Utils.formatCurrencyForLocale(getPriceDifference(), currency)}</span> more
                                    a {selectedBilling.interval_count === 3 ? "quarter" : selectedBilling.interval}
                                </Typography>
                            )}

                            <Box className={styles.planAdv}>
                                <Box className={styles.rangeSlider}>
                                    <Slider
                                        value={
                                            Object.keys(clicksValueMap).find(
                                                (key) => clicksValueMap[key] === proClicks
                                            ) || proClicks
                                        } // Use numeric value directly
                                        onChange={updateClicks}
                                        min={0}
                                        max={6}
                                        step={1}
                                        marks={[
                                            { value: 0, label: "10K" },
                                            { value: 1, label: "25K" },
                                            { value: 2, label: "50K" },
                                            { value: 3, label: "75K" },
                                            { value: 4, label: "100K" },
                                            { value: 5, label: "150K" }, // Custom mark
                                            { value: 6, label: "200K" }, // Custom mark
                                        ]}
                                    />
                                </Box>
                                <Typography className={styles.clicksDigit}>
                                    Up to{" "}
                                    <span>
                                        {getPlanClicks("Pro").toLocaleString("en-US", { maximumFractionDigits: 1 })}
                                    </span>{" "}
                                    Ad Clicks
                                </Typography>

                                {!compareOnly &&
                                    (!(
                                        currentPlan &&
                                        currentPlan.nickname.includes("Pro") &&
                                        currentPlan.interval === selectedBilling.interval &&
                                        currentPlan.interval_count === selectedBilling.interval_count &&
                                        Number(currentPlan.metadata.clicks) === proClicks
                                    ) ||
                                        !isCancelable) && (
                                        <Box className={styles.btnOuter}>
                                            <Button
                                                onClick={() =>
                                                    changePlan(
                                                        billingOptions.find(
                                                            (option) =>
                                                                option.plan === "Pro" &&
                                                                option.interval === selectedBilling.interval &&
                                                                option.interval_count ===
                                                                    selectedBilling.interval_count &&
                                                                option.clicks === proClicks
                                                        ),
                                                        true
                                                    )
                                                }
                                                variant="contained"
                                                color="info"
                                            >
                                                Switch
                                            </Button>
                                        </Box>
                                    )}

                                {!compareOnly &&
                                    isCancelable &&
                                    currentPlan &&
                                    currentPlan.nickname.includes("Pro") &&
                                    currentPlan.interval === selectedBilling.interval &&
                                    currentPlan.interval_count === selectedBilling.interval_count &&
                                    Number(currentPlan.metadata.clicks) === proClicks && (
                                        <Box className={styles.btnOuter}>
                                            <Button disabled variant="contained" color="primary">
                                                Current Plan
                                            </Button>
                                        </Box>
                                    )}

                                <Box component="ul">
                                    {selectedBilling?.id &&
                                    billingOptions.length &&
                                    billingOptions.find(
                                        (item) =>
                                            item.plan === "Pro" &&
                                            item.interval === selectedBilling.interval &&
                                            item.interval_count === selectedBilling.interval_count &&
                                            item.clicks === proClicks
                                    ).domains === "unlimited" ? (
                                        <Box component="li" className={styles.active}>
                                            Unlimited Websites
                                        </Box>
                                    ) : (
                                        <Box component="li" className={styles.active}>
                                            Up to{" "}
                                            {selectedBilling &&
                                                selectedBilling.id &&
                                                billingOptions.length &&
                                                billingOptions.find(
                                                    (item) =>
                                                        item.plan === "Pro" &&
                                                        item.interval === selectedBilling.interval &&
                                                        item.interval_count === selectedBilling.interval_count &&
                                                        item.clicks === proClicks
                                                ).domains}{" "}
                                            Websites
                                        </Box>
                                    )}
                                    <Box component="li" className={styles.greyColor}>
                                        Fraud Traffic Scoring
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Real-Time, 24/7 Monitoring
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Automated Blocking
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Google & Meta Protection
                                    </Box>
                                    <Box component="li" className={styles.greyColor}>
                                        Dedicated Account Manager
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Cancel Plan Link (Conditional) */}
                    {!compareOnly && isCancelable && (
                        <Box onClick={() => toggleCancelPlan()} className={styles.cancelAcc} sx={{ cursor: "pointer" }}>
                            <span>Cancel my plan</span>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

ChangePlanModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    toggleCancelPlan: PropTypes.func,
    toggleConfirmPlanModal: PropTypes.func,
    plans: PropTypes.array,
    compareOnly: PropTypes.bool,
    isCancelable: PropTypes.bool,
    currentPlan: PropTypes.shape({
        nickname: PropTypes.string,
        interval: PropTypes.string,
        interval_count: PropTypes.number,
        metadata: PropTypes.shape({
            clicks: PropTypes.string,
        }),
    }),
    currency: PropTypes.string,
    conversionRates: PropTypes.any, // Could be more specific (e.g., object)
    discount: PropTypes.number,
    currentDiscount: PropTypes.number,
};

export default ChangePlanModal;
