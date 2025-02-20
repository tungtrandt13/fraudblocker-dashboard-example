import React, { useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./ConfirmPlanModal.module.scss";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";

const { currencySymbols } = Constants;

const customStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        overflow: "auto",
        padding: "40px 0",
    },
    content: {
        inset: "20px 0 0 0", // Using inset for positioning
        width: 577,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "40px 75px",
        position: "relative",
    },
};

const ConfirmPlanModal = ({
    isOpen = false,
    currentPlan,
    selectedPlan,
    switching,
    conversionRates,
    currency,
    renewDate,
    source,
    plans,
    toggleModal,
    switchPlan,
    discount,
    currentDiscount,
}) => {
    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const proceed = useCallback(() => {
        const upgradeOrDowngrade =
            selectedPlan.price - currentPlan.amount > 0 || selectedPlan.plan.toLowerCase().includes("boost") ? 1 : -1;
        switchPlan(selectedPlan, upgradeOrDowngrade);
    }, [selectedPlan, switchPlan, currentPlan]);

    const getPrice = useCallback(
        (price) => {
            if (!discount && currentDiscount) {
                return price - currentDiscount;
            }
            if (!discount) {
                return price;
            }
            return price - (price * discount) / 100;
        },
        [discount, currentDiscount]
    );

    const getCurrentPlanPrice = useCallback(
        (price) => {
            return currentDiscount ? price - currentDiscount : price;
        },
        [currentDiscount]
    );

    if (!currentPlan || !selectedPlan) {
        return null; // Or some placeholder if you prefer
    }

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Compare Plans">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                        Confirm Your Plan
                    </Typography>
                    <Box className={styles.gridContent}>
                        {/* Current Plan Column */}
                        <Box className={styles.priceCol}>
                            <Typography variant="subtitle1" className={styles.colLabel}>
                                Current Plan
                            </Typography>
                            <Typography className={styles.planLabel}>Plan</Typography>
                            <Typography className={styles.planValue}>{currentPlan.nickname} Plan</Typography>
                            <Typography className={styles.planLabel}>Cost</Typography>
                            <Typography className={styles.planValue}>
                                {Utils.convertToCurrency(
                                    conversionRates,
                                    getCurrentPlanPrice(currentPlan.amount),
                                    currency
                                )}
                                /
                                {currentPlan.nickname.toLowerCase().includes("appsumo tier")
                                    ? "Lifetime"
                                    : currentPlan.interval_count === 3
                                      ? "quarter"
                                      : currentPlan.interval}
                            </Typography>
                            <Typography className={styles.planLabel}>Ad Clicks</Typography>
                            <Typography className={styles.planValue}>
                                {plans.length &&
                                    plans
                                        .find((item) => item.id === currentPlan.id)
                                        .clicks.toLocaleString("en-US", {
                                            maximumFractionDigits: 1,
                                        })}
                            </Typography>
                            <Typography className={styles.planLabel}>Websites</Typography>
                            <Typography className={`${styles.planValue} ${styles.lastPlanValue}`}>
                                {plans.length &&
                                plans.find((item) => item.id === currentPlan.id).domains === "unlimited"
                                    ? "Unlimited"
                                    : plans.find((item) => item.id === currentPlan.id).domains}
                            </Typography>
                        </Box>

                        {/* New Plan Column */}
                        <Box className={styles.priceCol}>
                            <Typography variant="subtitle1" className={styles.colLabel}>
                                New Plan
                            </Typography>
                            <Typography className={styles.planLabel}>Plan</Typography>
                            <Typography className={styles.planValue}>
                                {selectedPlan.nickname || selectedPlan.plan} Plan
                            </Typography>
                            <Typography className={styles.planLabel}>Cost</Typography>
                            <Typography className={styles.planValue}>
                                {Utils.convertToCurrency(conversionRates, getPrice(selectedPlan.price), currency)}/
                                {selectedPlan.interval_count === 3 ? "quarter" : selectedPlan.interval}
                            </Typography>
                            <Typography className={styles.planLabel}>Ad Clicks</Typography>
                            <Typography className={styles.planValue}>
                                +
                                {selectedPlan.clicks.toLocaleString("en-US", {
                                    maximumFractionDigits: 1,
                                })}
                            </Typography>
                            <Typography className={styles.planLabel}>Websites</Typography>
                            <Typography className={`${styles.planValue} ${styles.lastPlanValue}`}>
                                {selectedPlan.domains !== "unlimited" ? selectedPlan.domains : "Unlimited"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Price Adjustment Section */}
                    <Box className={styles.priceAdust}>
                        <Typography className={styles.planLabel}>Total Adjustment Today</Typography>
                        {getCurrentPlanPrice(currentPlan.amount) < getPrice(selectedPlan.price) ||
                        (selectedPlan.plan.toLowerCase().includes("boost") &&
                            currentPlan.nickname.toLowerCase().includes("appsumo tier")) ? (
                            <Typography
                                className={styles.planValue}
                                sx={{
                                    marginBottom: currentPlan.nickname.toLowerCase().includes("appsumo")
                                        ? "38px"
                                        : "16px",
                                }}
                            >
                                +
                                {Utils.convertToCurrency(
                                    conversionRates,
                                    getPrice(selectedPlan.price) -
                                        (selectedPlan.plan.toLowerCase().includes("boost") &&
                                        currentPlan.nickname.toLowerCase().includes("appsumo tier")
                                            ? 0
                                            : getCurrentPlanPrice(currentPlan.amount)),
                                    currency
                                )}
                                /{selectedPlan.interval_count === 3 ? "quarter" : selectedPlan.interval}
                            </Typography>
                        ) : (
                            <Typography className={styles.planValue}>{currencySymbols[currency] || "$"}0</Typography>
                        )}
                        <Typography className={styles.planLabel}>Next Billing Amount</Typography>
                        <Typography className={`${styles.planValue} ${styles.planPriceSec}`}>
                            {Utils.convertToCurrency(conversionRates, getPrice(selectedPlan.price), currency)}
                        </Typography>
                        <Typography className={styles.planLabel}>Next Billing Date</Typography>
                        <Typography className={`${styles.planValue} ${styles.lastPlanValue}`}>{renewDate}</Typography>
                    </Box>

                    {/* Plan State Description */}
                    {(!selectedPlan || !selectedPlan.plan.toLowerCase().includes("boost") || source) && (
                        <Box className={styles.planState}>
                            <Typography>
                                {getCurrentPlanPrice(currentPlan.amount) < getPrice(selectedPlan.price)
                                    ? "By selecting this plan your credit card will be charged a pro-rated amount of your “Total Adjustment” based on the remaining days until your “Next Billing Date.” If you are still in your free trial period, your card will only be charged once the trial ends."
                                    : 'By selecting this plan you agree to the adjustment of your "Billing Amount". Your current plan will remain active until the "Next Billing Date".'}
                            </Typography>
                        </Box>
                    )}

                    {/* Confirm Button */}
                    <Box className={styles.btnWrapper}>
                        <Button
                            disabled={switching}
                            variant="contained"
                            onClick={proceed}
                            color={
                                selectedPlan && selectedPlan.plan.toLowerCase().includes("boost") && !source
                                    ? "info"
                                    : "success"
                            } // Use MUI color prop
                        >
                            {switching
                                ? "Loading..."
                                : selectedPlan && selectedPlan.plan.toLowerCase().includes("boost") && !source
                                  ? "Continue"
                                  : "Confirm Updates To Plan"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

ConfirmPlanModal.propTypes = {
    isOpen: PropTypes.bool,
    switching: PropTypes.bool,
    toggleModal: PropTypes.func,
    currentPlan: PropTypes.object,
    selectedPlan: PropTypes.object,
    switchPlan: PropTypes.func,
    currency: PropTypes.string,
    conversionRates: PropTypes.any,
    renewDate: PropTypes.string,
    plans: PropTypes.array,
    source: PropTypes.any,
    discount: PropTypes.number,
    currentDiscount: PropTypes.number,
};

export default ConfirmPlanModal;
