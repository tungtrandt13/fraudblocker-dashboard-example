import React, { useState, useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { loadStripe } from "@stripe/stripe-js";
import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    Elements,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Button, TextField, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./BoosterPaymentModal.module.scss";
import Payments from "../../api/Payments";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Utils from "../../utils/Utils";
import CardSSL from "../../assets/card_ssl.svg";

const customStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    content: {
        position: "initial",
        inset: "auto", // Use 'inset'
        width: 501,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: 0, // Remove default padding
    },
};

const BoosterPaymentModal = ({
    isOpen,
    toggleModal,
    accounts,
    selectedPlan,
    currentPlan,
    currency,
    conversionRates,
    proceed,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState(false);
    const [cardExpiry, setCardExpiry] = useState(false);
    const [cardCvc, setCardCvc] = useState(false);
    const [zip, setZip] = useState("");
    const [errors, setErrors] = useState({});

    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        if (name === "firstName") {
            setFirstName(value);
        }
        if (name === "lastName") {
            setLastName(value);
        }
        if (name === "zip") {
            setZip(value);
        }
    }, []);

    const handleStripeChange = useCallback((change) => {
        if (change.complete) {
            setErrors((prevErrors) => ({ ...prevErrors, [change.elementType]: undefined }));
            switch (change.elementType) {
                case "cardNumber":
                    setCardNumber(true);
                    break;
                case "cardExpiry":
                    setCardExpiry(true);
                    break;
                case "cardCvc":
                    setCardCvc(true);
                    break;
                default:
                    break;
            }
        } else {
            switch (change.elementType) {
                case "cardNumber":
                    setCardNumber(false);
                    break;
                case "cardExpiry":
                    setCardExpiry(false);
                    break;
                case "cardCvc":
                    setCardCvc(false);
                    break;
                default:
                    break;
            }
        }
    }, []);

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const onClickUpdateCard = useCallback(async () => {
        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setErrors({});

        const newErrors = {};
        if (!firstName) newErrors.firstName = "Please enter first name";
        if (!lastName) newErrors.lastName = "Please enter last name";
        if (!cardNumber) newErrors.cardNumber = "Please enter card number";
        if (!cardExpiry) newErrors.cardExpiry = "Please enter card expiry";
        if (!cardCvc) newErrors.cardCvc = "Please enter card CVC";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const { token } = await stripe.createToken(
                elements.getElement(CardNumberElement),
                { name: `${firstName} ${lastName}` }
            );

            if (!token) {
                throw new Error("Please enter a valid credit card.");
            }

            const data = { source: token.id };
            if (zip) {
                data.address = { postal_code: zip };
            }

            const result = await Payments.updateCustomer(accounts.subscription.id, data);

            if (result) {
                proceed();
            }
        } catch (error) {
            console.error(error);
            setErrors({ update: error.message });
        } finally {
            setLoading(false);
        }
    }, [stripe, elements, firstName, lastName, zip, accounts.subscription?.id, proceed]);

    const getAmountToBePaid = useCallback(() => {
        if (!selectedPlan || !currentPlan) return 0;

        return selectedPlan.plan.toLowerCase().includes("boost") &&
            currentPlan.nickname.toLowerCase().includes("appsumo tier")
            ? selectedPlan.price
            : selectedPlan.price - currentPlan.amount > 0
              ? selectedPlan.price - currentPlan.amount
              : 0;
    }, [selectedPlan, currentPlan]);

    if (!selectedPlan || !currentPlan) return null;

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Confirm Your Payment">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box sx={{ padding: "20px" }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: "bold" }}>
                        Confirm Your Payment
                    </Typography>
                    <Typography variant="h6" component="p" className={styles.headerSubText}>
                        <Box className={styles.pricing}>
                            {Utils.convertToCurrency(conversionRates, getAmountToBePaid(), currency)}
                            <span> / {selectedPlan.interval}</span>
                        </Box>
                        <Box className={styles.info}>Your account will be charged monthly</Box>
                    </Typography>

                    <Box className={styles.inputWrap}>
                        <TextField
                            fullWidth
                            name="firstName"
                            label="First Name on Card"
                            value={firstName}
                            onChange={handleInputChange}
                            margin="normal"
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            name="lastName"
                            label="Last Name on Card"
                            value={lastName}
                            onChange={handleInputChange}
                            margin="normal"
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            sx={{ mb: 2 }}
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography component="label" sx={{ mb: 0.5, display: "block", color: "text.secondary" }}>
                            Card Number
                        </Typography>
                        <CardNumberElement
                            onChange={handleStripeChange}
                            className={errors.cardNumber ? "error-border" : ""}
                        />
                        {errors.cardNumber && (
                            <Typography variant="caption" color="error">
                                {errors.cardNumber}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography component="label" sx={{ mb: 0.5, display: "block", color: "text.secondary" }}>
                                Expiry Date
                            </Typography>
                            <CardExpiryElement
                                onChange={handleStripeChange}
                                className={errors.cardExpiry ? "error-border" : ""}
                            />
                            {errors.cardExpiry && (
                                <Typography variant="caption" color="error">
                                    {errors.cardExpiry}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography component="label" sx={{ mb: 0.5, display: "block", color: "text.secondary" }}>
                                CVC
                            </Typography>
                            <CardCvcElement
                                onChange={handleStripeChange}
                                className={errors.cardCvc ? "error-border" : ""}
                            />
                            {errors.cardCvc && (
                                <Typography variant="caption" color="error">
                                    {errors.cardCvc}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <TextField
                        name="zip"
                        label="ZIP / Postal Code"
                        value={zip}
                        onChange={handleInputChange}
                        margin="normal"
                        sx={{ width: 100, mb: 3 }}
                    />

                    {errors.update && <ErrorBox error={errors.update} />}

                    <Button
                        variant="contained"
                        onClick={onClickUpdateCard}
                        disabled={loading}
                        color="success"
                        sx={{ alignSelf: "center", mt: 2 }}
                    >
                        {loading ? "Placing Order..." : "Place Order"}
                    </Button>
                    <Typography variant="caption" display="block" className={styles.disclaimer}>
                        By clicking the “Place Order” button, you confirm that you have read, understand and accept our
                        Terms of Use and Privacy Policy.
                    </Typography>
                    <Box className={styles.cardSSL}>
                        <img src={CardSSL} alt="SSL" />
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

// Wrap the component with Stripe Elements
const StripeWrapper = (props) => {
    const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

    return (
        <Elements stripe={stripePromise}>
            <BoosterPaymentModal {...props} />
        </Elements>
    );
};

// Update PropTypes
BoosterPaymentModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    accounts: PropTypes.shape({
        subscription: PropTypes.shape({
            id: PropTypes.string.isRequired,
        }),
    }),
    selectedPlan: PropTypes.shape({
        price: PropTypes.number,
        interval: PropTypes.string,
        plan: PropTypes.string,
    }),
    currentPlan: PropTypes.shape({
        amount: PropTypes.number,
        nickname: PropTypes.string,
    }),
    currency: PropTypes.string,
    conversionRates: PropTypes.any,
    proceed: PropTypes.func,
};

export default StripeWrapper;
