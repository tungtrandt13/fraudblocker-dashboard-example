import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { loadStripe } from "@stripe/stripe-js";
import {
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    Elements,
} from "@stripe/react-stripe-js";
import { Tooltip } from "react-tooltip";
import styles from "../../RegisterSteps.module.scss";
import Input from "../../../../components/Input/Input";
import Button from "../../../../components/Button/Button";
import { ReactComponent as GREENCHECK } from "../../../../assets/green-check.svg";
import InputContainer from "../../../../components/InputContainer/InputContainer";
import ErrorBox from "../../../../components/ErrorBox/ErrorBox";
import Constants from "../../../../utils/Constants";
import Utils from "../../../../utils/Utils";
import { ReactComponent as TooltipIcon } from "../../../../assets/tooltip.svg";
import { ReactComponent as UnlockDiscountIcon } from "../../../../assets/unlock-discount.svg";
import Payments from "../../../../api/Payments";

const { currencySymbols } = Constants;

const customStyles = {
    // ... (giữ nguyên customStyles)
};

function PaymentForm({ onClickNext, onClickBack, conversionRates, currency, user, updateUser, accounts, discount }) {
    const stripe = useStripe();
    const elements = useElements();

    const [formState, setFormState] = useState({
        cardName: "",
        cardNumber: false,
        cardExpiry: false,
        cardCvc: false,
        cardError: {},
        errors: {},
        loading: false,
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        zip: "",
        isMobile: false,
        error: "",
    });

    const { loading, errors, firstName, lastName, zip, cardNumber, cardExpiry, cardCvc } = formState;

    useEffect(() => {
        // ... (giữ nguyên useEffect cho mobile check)
    }, []);

    const onChangeText = (event) => {
        const { value, name } = event.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleChange = (change) => {
        if (change.complete) {
            setFormState((prev) => ({
                ...prev,
                [change.elementType]: true,
            }));
        }
    };

    const onSubmitPayment = async (token, zip, name) => {
        try {
            if (token) {
                const data = {
                    source: token.id,
                    ...(zip && { address: { postal_code: zip } }),
                    ...(name && { name }),
                };

                await Payments.updateCustomer(accounts.data.stripe_token, data);
                window.Intercom("trackEvent", "credit-card", {
                    timestamp: new Date(),
                    added: true,
                    account: accounts.data.id,
                });
            }
            onClickNext();
        } catch (error) {
            setFormState((prev) => ({
                ...prev,
                error: error.message,
            }));
            throw error;
        }
    };

    const submit = async (skipPayment = false) => {
        if (!stripe || !elements) {
            return;
        }

        setFormState((prev) => ({ ...prev, loading: true }));

        try {
            if (firstName !== user.first_name || lastName !== user.last_name) {
                const updateUserData = {
                    first_name: firstName,
                    last_name: lastName,
                };
                await updateUser(user.id, updateUserData);
                window.Intercom("update", {
                    user_id: user.id,
                    name: `${firstName} ${lastName}`,
                });
            }

            if (!skipPayment) {
                if (cardNumber && cardExpiry && cardCvc && firstName && lastName) {
                    const { token, error } = await stripe.createToken(elements.getElement(CardNumberElement), {
                        name: `${firstName} ${lastName}`,
                    });

                    if (error) {
                        throw error;
                    }

                    if (!token) {
                        throw new Error("Please enter valid payment details to continue.");
                    }

                    await onSubmitPayment(token, zip, `${firstName} ${lastName}`);
                } else {
                    throw new Error("Please enter valid payment details to continue.");
                }
            } else {
                await onSubmitPayment(null);
            }

            window.Intercom("trackEvent", "register-step-5");
        } catch (error) {
            setFormState((prev) => ({
                ...prev,
                errors: {
                    paymentError: error.message,
                },
                loading: false,
            }));
        }
    };

    // Utility functions
    const getPrice = (price) => {
        if (discount !== 0) {
            return price - (price * discount) / 100;
        }
        return price;
    };

    const getSelectedPlan = () => {
        const defaultPlan = accounts?.data?.initial_plan;
        if (defaultPlan) {
            return {
                amount: defaultPlan.price,
                interval: defaultPlan.interval,
                interval_count: defaultPlan.interval_count,
            };
        }
        return {
            interval: "month",
            amount: 0,
            interval_count: 1,
        };
    };

    const { interval, amount, interval_count: intervalCount } = getSelectedPlan();

    // JSX remains mostly the same, just update the card elements
    return (
        <div className={`${styles.slideLeft} ${styles.planBox}`}>
            {/* ... (các phần JSX khác giữ nguyên) */}

            <InputContainer
                labelStyle={customStyles.inputLabel}
                containerStyle={customStyles.input}
                label="Card Number"
            >
                <CardNumberElement
                    onChange={handleChange}
                    options={{
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#424770",
                                "::placeholder": {
                                    color: "#aab7c4",
                                },
                            },
                            invalid: {
                                color: "#9e2146",
                            },
                        },
                    }}
                />
            </InputContainer>

            <div className={styles.twoInputsContainer}>
                <InputContainer
                    labelStyle={customStyles.inputLabel}
                    containerStyle={customStyles.input}
                    label="Expiry Date"
                >
                    <CardExpiryElement
                        onChange={handleChange}
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    color: "#424770",
                                },
                            },
                        }}
                    />
                </InputContainer>

                <InputContainer
                    labelStyle={customStyles.inputLabel}
                    containerStyle={customStyles.input}
                    label={
                        <span>
                            CVV <TooltipIcon className={styles.registerHelpTip} data-tooltip-id="cvvNote" />
                        </span>
                    }
                >
                    <CardCvcElement
                        onChange={handleChange}
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    color: "#424770",
                                },
                            },
                        }}
                    />
                </InputContainer>

                {/* ... (phần còn lại của JSX) */}
            </div>
        </div>
    );
}

PaymentForm.propTypes = {
    onClickNext: PropTypes.func.isRequired,
    onClickBack: PropTypes.func.isRequired,
    conversionRates: PropTypes.object.isRequired,
    currency: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
    updateUser: PropTypes.func.isRequired,
    accounts: PropTypes.object.isRequired,
    discount: PropTypes.number,
};

// Wrap component với Elements provider trong component cha
const WrappedPaymentForm = (props) => (
    <Elements stripe={loadStripe("your_publishable_key")}>
        <PaymentForm {...props} />
    </Elements>
);

export default WrappedPaymentForm;
