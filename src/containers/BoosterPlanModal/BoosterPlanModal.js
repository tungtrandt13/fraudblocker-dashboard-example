import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { Button, Typography, Box, Slider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./BoosterPlanModal.module.scss";
import Utils from "../../utils/Utils";
import TacoImage from "../../assets/taco1.svg";
import Taco0BoosterImage from "../../assets/taco0.svg";
import Taco1BoosterImage from "../../assets/taco2.svg";
import Taco2BoosterImage from "../../assets/taco3.svg";
import Taco3BoosterImage from "../../assets/taco4.svg";
import RocketImage from "../../assets/rocket.svg";

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
        inset: "20px 0 0 0", // Using 'inset'
        width: 551,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "40px 45px",
        position: "relative",
    },
};

const rangeMap = {
    10000: 1,
    50000: 2,
    200000: 3,
    500000: 4,
};

const clicksMap = {
    1: 10000,
    2: 50000,
    3: 200000,
    4: 500000,
};

const BoosterPlanModal = ({
    isOpen,
    toggleModal,
    toggleCancelPlan,
    toggleConfirmPlanModal,
    billingOptions = [],
    isCancelable,
    currentPlan,
    subscription,
    currency,
    discount,
    conversionRates,
    currentDiscount,
}) => {
    const [boosterClicks, setBoosterClicks] = useState(10000);
    const [defaultBoosterClicks, setDefaultBoosterClicks] = useState(10000);

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const setBillingOptionsState = useCallback(() => {
        let defaultClicks = 10000;
        if (currentPlan && billingOptions.length && checkIfBooster()) {
            const selectedItem = billingOptions.find((item) => item.id === currentPlan.id);
            if (selectedItem) {
                defaultClicks = selectedItem.clicks;
            }
        }
        setDefaultBoosterClicks(defaultClicks);
        setBoosterClicks(defaultClicks);
    }, [currentPlan, billingOptions, checkIfBooster]);

    useEffect(() => {
        setBillingOptionsState();
    }, [setBillingOptionsState]);

    const getBoosterWebsites = useCallback(() => {
        if (billingOptions.length) {
            const found = billingOptions.find(
                (item) => item.plan.toLowerCase().includes("booster") && item.clicks === boosterClicks
            );
            return found ? (found.domains === "unlimited" ? "Unlimited" : found.domains) : "Unlimited";
        }
        return "Unlimited"; // Default
    }, [billingOptions, boosterClicks]);

    const updateClicks = useCallback((event, newValue) => {
        // No mapping needed, directly use newValue which will be from clicksMap
        setBoosterClicks(clicksMap[newValue] || newValue);
    }, []);

    const changePlan = useCallback(
        (plan) => {
            toggleConfirmPlanModal(plan);
        },
        [toggleConfirmPlanModal]
    );

    const checkIfBooster = useCallback(() => {
        return currentPlan?.nickname.toLowerCase().includes("boost");
    }, [currentPlan]);

    const getAppSumoPlanDetails = useCallback(() => {
        if (!subscription || !billingOptions.length || !currentPlan) {
            return null;
        }
        if (subscription.appSumoSubscription) {
            return {
                ...subscription.appSumoSubscription.plan,
                amount: billingOptions.find((item) => item.id === subscription.appSumoSubscription.plan.id).price,
            };
        }
        return {
            ...currentPlan,
            amount: billingOptions.find((item) => item.id === currentPlan.id).price,
        };
    }, [subscription, billingOptions, currentPlan]);

    const getPrice = useCallback(
        (price) => {
            if (
                (currentPlan.nickname.toLowerCase().includes("booster") && defaultBoosterClicks === boosterClicks) ||
                !discount
            ) {
                return price;
            }
            if (!discount && currentDiscount) {
                return price - currentDiscount;
            }
            return price - (price * discount) / 100;
        },
        [boosterClicks, currentDiscount, currentPlan, defaultBoosterClicks, discount]
    );

    const boosterPlan =
        billingOptions.length &&
        billingOptions.find((item) => item.plan.toLowerCase().includes("booster") && item.clicks === boosterClicks);

    // Early return if required props are missing
    if (!billingOptions.length || !currentPlan || !currentPlan.id) {
        return null;
    }
    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Compare Plans">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                        Change Your Plan
                        <Typography variant="subtitle1" className={styles.headerSubText}>
                            No contracts. Downgrade anytime.
                        </Typography>
                    </Typography>

                    <Box className={styles.gridContent}>
                        {/* AppSumo Plan */}
                        <Box className={styles.gridCell}>
                            <Typography variant="h6" className={`${styles.planHeading} ${styles.light}`}>
                                APPSUMO PLAN
                            </Typography>
                            <Box className={styles.wrapIcon}>
                                <img src={TacoImage} alt="taco" />
                            </Box>
                            <Typography variant="h5" className={styles.planValue}>
                                {currentPlan.id &&
                                    getAppSumoPlanDetails() &&
                                    Utils.convertToCurrency(conversionRates, getAppSumoPlanDetails().amount, currency)}
                                <span>/ lifetime</span>
                            </Typography>
                            <Box className={styles.planAdv}>
                                <Typography className={styles.clicksDigit}>
                                    {getAppSumoPlanDetails() &&
                                        Number(getAppSumoPlanDetails().metadata.clicks).toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                    Ad Clicks
                                </Typography>
                                <Typography className={styles.clicksDigit}>
                                    {getAppSumoPlanDetails() &&
                                        (getAppSumoPlanDetails().metadata.domains === "unlimited"
                                            ? "Unlimited"
                                            : getAppSumoPlanDetails().metadata.domains)}{" "}
                                    Websites
                                </Typography>
                                <Box className={styles.btnOuter}>
                                    <Button
                                        onClick={() => {}}
                                        disabled
                                        variant="outlined"
                                        color="primary"
                                        sx={customStyles.currentBtn} // Assuming you want to keep some custom styles
                                    >
                                        Current Plan
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Booster Plan */}
                        <Box className={`${styles.gridCell} ${styles.activeCell}`}>
                            <Typography variant="h6" className={styles.planHeading}>
                                BOOSTER PLAN
                            </Typography>
                            <Box className={styles.wrapIcon}>
                                {boosterClicks === 10000 ? (
                                    <img src={Taco0BoosterImage} alt="taco" />
                                ) : boosterClicks === 50000 ? (
                                    <img src={Taco1BoosterImage} alt="taco" />
                                ) : boosterClicks === 200000 ? (
                                    <img src={Taco2BoosterImage} alt="taco" />
                                ) : (
                                    <img src={Taco3BoosterImage} alt="taco" />
                                )}
                                <Box className={styles.boostIcon}>
                                    <img src={RocketImage} alt="boost" />
                                </Box>
                            </Box>
                            <Box className={styles.rangeSlider}>
                                <Slider
                                    value={rangeMap[boosterClicks] || 1}
                                    onChange={updateClicks}
                                    min={1}
                                    max={4}
                                    step={1}
                                    marks={[
                                        { value: 1, label: "10K" },
                                        { value: 2, label: "50K" },
                                        { value: 3, label: "200K" },
                                        { value: 4, label: "500K" },
                                    ]}
                                />
                            </Box>
                            <Typography variant="h5" className={styles.planValue}>
                                {boosterPlan &&
                                    Utils.convertToCurrency(conversionRates, getPrice(boosterPlan.price), currency)}
                                <span>/ month</span>
                            </Typography>
                            <Box className={styles.planAdv}>
                                <Typography className={styles.clicksDigit}>
                                    <span>
                                        +{Number(boosterClicks).toLocaleString("en-US", { maximumFractionDigits: 1 })}
                                    </span>{" "}
                                    Ad Clicks
                                </Typography>
                                <Typography className={styles.clicksDigit}>{getBoosterWebsites()} Websites</Typography>
                                <Box className={styles.btnOuter}>
                                    {currentPlan.nickname.toLowerCase().includes("booster") &&
                                    defaultBoosterClicks === boosterClicks ? (
                                        <Button
                                            onClick={() => {}}
                                            disabled
                                            variant="outlined"
                                            color="primary"
                                            sx={customStyles.currentBtn} // Keep custom styles if needed
                                        >
                                            Current Plan
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => changePlan(boosterPlan)}
                                            variant="contained"
                                            color="info"
                                        >
                                            {!checkIfBooster() || boosterPlan.clicks > defaultBoosterClicks
                                                ? "Upgrade"
                                                : "Downgrade"}
                                        </Button>
                                    )}
                                </Box>
                                {isCancelable &&
                                    currentPlan &&
                                    currentPlan.nickname.toLowerCase().includes("boost") && (
                                        <Box
                                            onClick={() => toggleCancelPlan(true)}
                                            className={styles.cancelAcc}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <span>Cancel My Booster Plan</span>
                                        </Box>
                                    )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Cancel All Plans (Conditional) */}
                    {subscription &&
                        (!subscription.appSumoSubscription ||
                            subscription.appSumoSubscription.status !== "canceled") && (
                            <Box>
                                <a
                                    href="https://appsumo.com/account/products/"
                                    className={styles.cancelAcc}
                                    sx={{ cursor: "pointer" }}
                                >
                                    <span>Cancel All Plans</span>
                                </a>
                            </Box>
                        )}
                </Box>
            </Box>
        </Modal>
    );
};

BoosterPlanModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    toggleCancelPlan: PropTypes.func,
    toggleConfirmPlanModal: PropTypes.func,
    billingOptions: PropTypes.array,
    isCancelable: PropTypes.bool,
    currentPlan: PropTypes.shape({
        nickname: PropTypes.string,
        id: PropTypes.string,
    }),
    subscription: PropTypes.shape({
        appSumoSubscription: PropTypes.shape({
            status: PropTypes.string,
        }),
    }),
    currency: PropTypes.string,
    conversionRates: PropTypes.any, // Could be more specific (e.g., object)
    discount: PropTypes.number,
    currentDiscount: PropTypes.number,
};

export default BoosterPlanModal;
