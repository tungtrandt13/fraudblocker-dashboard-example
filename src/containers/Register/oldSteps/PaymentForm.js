import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import styles from "./RegisterForms.module.scss";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import { ReactComponent as ARROW_LEFT } from "../../../assets/arrow-left.svg";
import { ReactComponent as GREENCHECK } from "../../../assets/green-check.svg";
import { ReactComponent as SECURE } from "../../../assets/secure.svg";
import InputContainer from "../../../components/InputContainer/InputContainer";
import ErrorBox from "../../../components/ErrorBox/ErrorBox";
import Constants from "../../../utils/Constants";
import Utils from "../../../utils/Utils";

const { currencySymbols } = Constants;

const customStyles = {
    input: {
        marginBottom: 25,
    },
    zipInput: {
        width: 100,
        marginBottom: 25,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666666",
    },
    comingSoon: {
        paddingTop: "10px",
        marginBottom: "-10px",
        fontWeight: 500,
        fontSize: "10px",
    },
    disabledRadio: {
        background: "#f1f1f1",
        border: "none",
        pointerEvents: "none",
    },
    currencyDropdown: {
        width: "100px",
    },
};

function PaymentForm({ onSubmit, onClickBack, currency, conversionRates, user, updateUser, accounts, discount }) {
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
    });

    const checkMobile = () => {
        let check = false;
        ((a) => {
            if (
                /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                    a
                ) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    a.substr(0, 4)
                )
            )
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);

        setFormState((prev) => ({
            ...prev,
            isMobile: check,
        }));
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        checkMobile();

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
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

    const submit = async (skipPayment = false) => {
        if (!stripe || !elements) {
            return;
        }

        const { cardNumber, cardExpiry, cardCvc, firstName, lastName, zip } = formState;

        setFormState((prev) => ({
            ...prev,
            loading: true,
        }));

        try {
            if (firstName && lastName) {
                const updateUserData = {
                    first_name: firstName,
                    last_name: lastName,
                };
                await updateUser(user.id, updateUserData);
            }

            if (!skipPayment) {
                if (cardNumber && cardExpiry && cardCvc && firstName && lastName) {
                    const { token, error } = await stripe.createToken(elements.getElement(CardNumberElement), {
                        name: `${firstName} ${lastName}`,
                    });

                    if (error || !token) {
                        throw new Error(error?.message || "Please enter valid payment details to continue.");
                    }

                    await onSubmit(token, zip, `${firstName} ${lastName}`);
                } else {
                    throw new Error("Please enter valid payment details to continue.");
                }
            } else {
                await onSubmit(null);
            }

            window.Intercom("update", {
                user_id: user.id,
                name: `${firstName} ${lastName}`,
            });
            window.Intercom("trackEvent", "register-step-3");
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
            interval_count: 0,
        };
    };

    const { loading, errors, firstName, lastName, zip, isMobile } = formState;
    const { interval, amount, interval_count: intervalCount } = getSelectedPlan();

    return (
        <div className={styles.formContainer} style={{ maxWidth: "520px" }}>
            <h1 className={styles.headerText}>This is your final step</h1>

            <section className={styles.amountWrap}>
                <label>Payment Amount</label>
                <div>
                    <strong>{Utils.convertToCurrency(conversionRates, getPrice(amount), currency)}</strong> /
                    {intervalCount === 3 ? "quarter" : interval}
                </div>
                <ul className={styles.noDueToday}>
                    <li>
                        <GREENCHECK />
                        <span>Amount due today - {currencySymbols[currency] || "$"}0</span>
                        (Your credit card will not be charged until the end of your 7-day free trial period).
                    </li>
                    <li>
                        <GREENCHECK />
                        No contracts - downgrade or cancel anytime from your dashboard.
                    </li>
                </ul>
            </section>

            <div className={styles.cardFormBox}>
                <form autoComplete="off">
                    <Input
                        name="firstName"
                        value={firstName}
                        onChange={onChangeText}
                        labelStyle={customStyles.inputLabel}
                        containerStyle={customStyles.input}
                        label="First Name on Card"
                        autoSuggest={false}
                    />
                    <Input
                        name="lastName"
                        value={lastName}
                        onChange={onChangeText}
                        labelStyle={customStyles.inputLabel}
                        containerStyle={customStyles.input}
                        label="Last Name on Card"
                        autoSuggest={false}
                    />
                </form>

                <InputContainer
                    labelStyle={customStyles.inputLabel}
                    containerStyle={customStyles.input}
                    label="Card Number"
                >
                    <CardNumberElement onChange={handleChange} />
                </InputContainer>

                <div className={styles.twoInputsContainer}>
                    <InputContainer
                        labelStyle={customStyles.inputLabel}
                        containerStyle={customStyles.input}
                        label="Expiry Date"
                    >
                        <CardExpiryElement onChange={handleChange} />
                    </InputContainer>

                    <InputContainer
                        labelStyle={customStyles.inputLabel}
                        containerStyle={customStyles.input}
                        label="CVV"
                    >
                        <CardCvcElement onChange={handleChange} />
                    </InputContainer>

                    <Input
                        name="zip"
                        value={zip}
                        pattern="[A-Za-z\d\s]+"
                        onChange={onChangeText}
                        containerStyle={customStyles.zipInput}
                        labelStyle={customStyles.inputLabel}
                        label={isMobile ? "Postal Code" : "ZIP / Postal Code"}
                    />
                </div>
            </div>

            {errors.paymentError && <ErrorBox errorStyle={{ marginRight: "35px" }} error={errors.paymentError} />}

            <div className={`${styles.formFooterContainer} ${styles.cardFormFooter}`}>
                <div className={`${styles.goBackContainer} ${styles.backToAccountInfo}`} onClick={onClickBack}>
                    <ARROW_LEFT />
                    <p>Go Back</p>
                </div>

                <Button
                    title="Start 7-Day Trial"
                    loading={loading}
                    onClick={() => submit(false)}
                    className={styles.cardNextBtn}
                    customClassNames="paymentForm__nextBtn"
                    color="green"
                />
            </div>

            <SECURE className={styles.secure} />
        </div>
    );
}

PaymentForm.propTypes = {
    onSubmit: PropTypes.func,
    onClickBack: PropTypes.func,
    conversionRates: PropTypes.any,
    currency: PropTypes.string,
    user: PropTypes.object,
    updateUser: PropTypes.func,
    accounts: PropTypes.any,
    discount: PropTypes.number,
};

const SelectOption = React.memo(({ selected, children, onSelect, type, value, customStyle }) => {
    const handleClick = () => {
        onSelect(type, value);
    };

    return (
        <div
            className={selected ? styles.selectContainerActive : styles.selectContainer}
            style={customStyle}
            onClick={handleClick}
        >
            {children}
            {selected && <GREENCHECK className={styles.greenCheck} />}
        </div>
    );
});

SelectOption.propTypes = {
    selected: PropTypes.bool,
    children: PropTypes.node,
    onSelect: PropTypes.func,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    customStyle: PropTypes.any,
};

export default PaymentForm;
