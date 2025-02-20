import React, { useState, useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { injectStripe, CardNumberElement, CardExpiryElement, CardCvcElement } from "react-stripe-elements";
import { Button, TextField, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Payments from "../../api/Payments";
import ErrorBox from "../../components/ErrorBox/ErrorBox";

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
        inset: "auto", // Use 'inset' instead of top, right, left, bottom
        width: 501,
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: 0, // Remove default padding
    },
};

const UpdateCardModal = ({ isOpen, toggleModal, stripe, accounts, source, fetchLatestSubscriptionInfo }) => {
    const [firstName, setFirstName] = useState(source.name ? source.name.split(" ")[0] || "" : "");
    const [lastName, setLastName] = useState(source.name ? source.name.split(" ")[1] || "" : "");
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
            setErrors((prevErrors) => ({ ...prevErrors, [change.elementType]: undefined })); // Clear specific error
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

    const onClickUpdateCard = async () => {
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
            const { token } = await stripe.createToken({
                name: `${firstName} ${lastName}`,
            });

            if (!token) {
                throw new Error("Please enter a valid credit card.");
            }

            const data = { source: token.id };
            if (zip) {
                data.address = { postal_code: zip };
            }

            const result = await Payments.updateCustomer(accounts.subscription.id, data);

            if (result) {
                await fetchLatestSubscriptionInfo();
                toggleModal();
            }
        } catch (error) {
            console.error(error);
            setErrors({ update: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Update Credit Card">
            <Box sx={{ padding: "20px" }}>
                <IconButton onClick={toggleModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: "bold" }}>
                    Update Credit Card
                </Typography>

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
                    sx={{ width: 100, mb: 3 }} // You can adjust the width as needed
                />

                {errors.update && <ErrorBox error={errors.update} sx={{ mt: 2, mb: -2 }} />}

                <Button
                    variant="contained"
                    onClick={onClickUpdateCard}
                    disabled={loading}
                    sx={{ alignSelf: "center", mt: 3 }}
                >
                    {loading ? "Updating..." : "Update Card"}
                </Button>
            </Box>
        </Modal>
    );
};

UpdateCardModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    stripe: PropTypes.shape({
        createToken: PropTypes.func.isRequired,
    }),
    accounts: PropTypes.shape({
        subscription: PropTypes.shape({
            id: PropTypes.string.isRequired,
        }),
    }),
    source: PropTypes.object,
    fetchLatestSubscriptionInfo: PropTypes.func,
};

export default injectStripe(UpdateCardModal);
