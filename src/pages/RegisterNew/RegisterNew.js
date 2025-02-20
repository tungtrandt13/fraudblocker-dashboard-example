import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import qs from "qs";
import { useNavigate, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import styles from "./RegisterNew.module.scss";
import LOGO from "../../assets/small-logo.svg";
import { ReactComponent as MAINLOGO } from "../../assets/main-logo.svg";
import SignUpForm from "../../containers/Register/components/StepForms/SignUpForm";
import User from "../../redux/actions/User";
import Account from "../../redux/actions/Account";
import Validation from "../../utils/Validation";
import Payments from "../../api/Payments";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";
import RegisterSteps from "../../containers/Register/RegisterSteps";
import RegisterTestimonial from "../../containers/Register/components/RegisterTestimonial/RegisterTestimonial";

let leadHandled = false;

function RegisterNew() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux state
    const auth = useSelector((state) => state.auth);
    const accounts = useSelector((state) => state.accounts);
    const activeDomain = useSelector((state) => state.activeDomain);

    // Local state
    const [formState, setFormState] = useState({
        email: "",
        discount: 0,
        couponError: "",
        activeForm: 0,
        toDashboard: false,
        toSignIn: false,
    });

    const { email, discount, couponError, activeForm, toDashboard, toSignIn } = formState;

    // Actions
    const createUser = (data) => dispatch(User.createUser(data));
    const updateUser = (id, data) => dispatch(User.updateUser(id, data));
    const updateUserAccount = (accountId, data) => dispatch(Account.updateUserAccount(accountId, data));
    const getUserAccounts = (id) => dispatch(Account.getUserAccounts(id));
    const fetchLatestAccount = (id) => dispatch(Account.fetchLatestAccount(id));

    const handleLeads = () => {
        // User has left Registration on SignUpForm
        if (activeForm === 0 && !leadHandled) {
            leadHandled = true; // Check to make sure its not called twice.
            const data = { email };

            const invalidEmail = Validation.validateForm(data);
            if (invalidEmail) return;

            User.createLead(data);
        }
    };

    useEffect(() => {
        const initializeRegistration = async () => {
            console.log("PKDEBUG", process.env.REACT_APP_STRIPE_KEY);
            console.log("PKNEW", Constants.stripePublicKey);

            document.getElementById("favicon").href = "signup-favicon.ico";

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
                        setFormState((prev) => ({
                            ...prev,
                            discount: coupon.percent_off,
                        }));
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
                        setFormState((prev) => ({
                            ...prev,
                            discount: otherCoupon.percent_off,
                        }));
                    }
                } catch (err) {
                    Utils.setCookie("offer_id", "", -1);
                    couponRes.error = err.message;
                }
            }

            if ((afmcCoupon || offerCoupon) && !couponRes.discount) {
                setFormState((prev) => ({
                    ...prev,
                    couponError: couponRes.error,
                }));
            }
        };

        initializeRegistration();

        // Event listeners
        window.addEventListener("beforeunload", handleLeads);
        window.addEventListener("unload", handleLeads);

        return () => {
            window.removeEventListener("beforeunload", handleLeads);
            window.removeEventListener("unload", handleLeads);
        };
    }, []);

    useEffect(() => {
        if (auth.user && accounts.data) {
            console.log("Checking for current reg step");
            if (
                Validation.userHasAllRequiredFields(auth.user, accounts.data, accounts.subscription) &&
                Validation.userHasSubscription(accounts.subscription)
            ) {
                console.log("STEP - to dashboard");
                setFormState((prev) => ({
                    ...prev,
                    toDashboard: true,
                }));
            } else if (
                accounts.data.initial_plan &&
                activeForm !== 4 &&
                !Validation.userHasSubscription(accounts.subscription)
            ) {
                console.log("STEP - to 4");
                setFormState((prev) => ({
                    ...prev,
                    activeForm: 4,
                }));
            } else if (activeForm !== 3) {
                console.log("STEP - to 3");
                setFormState((prev) => ({
                    ...prev,
                    activeForm: 3,
                }));
            }
        }
    }, [auth.user, accounts.data, accounts.subscription, activeForm]);

    const setEmail = (email) => {
        setFormState((prev) => ({
            ...prev,
            email,
        }));
    };

    const onClickNextSignupClick = () => {
        setFormState((prev) => ({
            ...prev,
            activeForm: 1,
        }));
    };

    const updateActiveForm = (step) => {
        setFormState((prev) => ({
            ...prev,
            activeForm: step,
        }));
    };

    if (toDashboard) {
        return <Navigate to="/integrations/fraud-blocker-tracker" replace />;
    }

    if (toSignIn) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={styles.all}>
            <Helmet>
                <title>Register | Fraud Blocker</title>
            </Helmet>
            {activeForm === 0 ? (
                <div className={styles.content}>
                    <div className={styles.rightContentContainer}>
                        <div className={styles.regForm}>
                            <img src={LOGO} className={styles.logo} alt="Logo" />
                            <SignUpForm
                                setEmail={setEmail}
                                email={email}
                                discount={discount}
                                createUser={createUser}
                                onClickNext={onClickNextSignupClick}
                            />
                        </div>
                    </div>
                    <div className={styles.leftContentContainer}>
                        <RegisterTestimonial />
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.stepContent}>
                        <div className={styles.logoContainer}>
                            <div className={styles.mHide}>
                                <MAINLOGO />
                            </div>
                            <div className={styles.mShow}>
                                <img src={LOGO} className={styles.logo} alt="Logo" />
                            </div>
                        </div>
                        <div className={styles.stepsContent}>
                            <div className={styles.stepsContentInner}>
                                <RegisterSteps
                                    discount={discount}
                                    couponError={couponError}
                                    activeForm={activeForm}
                                    updatedActiveForm={updateActiveForm}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerSec}>
                        <span>©2024 All Rights Reserved.</span> Fraud Blocker™ is a registered trademark of Fraud
                        Blocker LLC.
                        <div>
                            <a
                                className="blue"
                                href="https://fraudblocker.com/privacy/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Privacy Policy
                            </a>{" "}
                            and{" "}
                            <a
                                className="blue"
                                href="https://fraudblocker.com/terms/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Terms
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

RegisterNew.propTypes = {
    auth: PropTypes.object,
    createUser: PropTypes.func,
    updateUser: PropTypes.func,
    accounts: PropTypes.object,
    updateUserAccount: PropTypes.func,
    getUserAccounts: PropTypes.func,
    fetchLatestAccount: PropTypes.func,
    activeDomain: PropTypes.object,
    history: PropTypes.object,
};

export default RegisterNew;
