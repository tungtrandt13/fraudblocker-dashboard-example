import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import qs from 'qs';
import { Navigate } from 'react-router-dom'; // Changed from Redirect
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Elements } from '@stripe/react-stripe-js'; // Updated Stripe imports
import { loadStripe } from '@stripe/stripe-js';
import styles from './Register.module.scss';
import LOGO from '../../assets/small-logo.svg';
import QUOTES from '../../assets/techtimesgoogle.svg';
import STARS from '../../assets/stars.svg';
import TESTIMONIAL from '../../assets/testimonial.png';
import TWO_FOUR from '../../assets/247.svg';
import CODE from '../../assets/ez.svg';
import SignUpForm from '../../containers/Register/oldSteps/SignUpForm';
import AccountCreationForm from '../../containers/Register/oldSteps/AccountCreationForm';
import PaymentForm from '../../containers/Register/oldSteps/PaymentForm';
import FinishedRegistration from '../../containers/Register/oldSteps/FinishedRegistration';
import Footer from '../../components/Footer/Footer';
import User from '../../redux/actions/User';
import Account from '../../redux/actions/Account';
import Validation from '../../utils/Validation';
import Payments from '../../api/Payments';
import Users from '../../api/Users';
import Constants from '../../utils/Constants';
import Utils from '../../utils/Utils';

const stripePromise = loadStripe(Constants.stripePublicKey);
let leadHandled = false;

function Register({
    auth,
    accounts,
    createUser,
    updateUser,
    updateUserAccount,
    getUserAccounts,
    fetchLatestAccount
}) {
    const [state, setState] = useState({
        email: '',
        discount: 0,
        couponError: '',
        activeForm: 0,
        toDashboard: false,
        toSignIn: false,
        error: ''
    });

    const handleLeads = () => {
        if (state.activeForm === 0 && !leadHandled) {
            leadHandled = true;
            const data = { email: state.email };

            const invalidEmail = Validation.validateForm(data);
            if (invalidEmail) return;

            User.createLead(data);
        }
    };

    const checkRegistrationStep = () => {
        if (auth.user && accounts.data) {
            console.log('Checking for current reg step');
            if (!accounts.data.initial_plan && state.activeForm !== 1) {
                setState(prev => ({ ...prev, activeForm: 1 }));
            } else if (
                accounts.data.initial_plan &&
                state.activeForm !== 2 &&
                !Validation.userHasSubscription(accounts.subscription)
            ) {
                setState(prev => ({ ...prev, activeForm: 2 }));
            } else if (
                Validation.userHasAllRequiredFields(auth.user, accounts.data, accounts.subscription)
            ) {
                setState(prev => ({ ...prev, toDashboard: true }));
            }
        }
    };

    useEffect(() => {
        const initializeRegister = async () => {
            console.log('PKDEBUG', process.env.REACT_APP_STRIPE_KEY);
            console.log('PKNEW', Constants.stripePublicKey);

            const favicon = document.getElementById('favicon');
            if (favicon) {
                favicon.href = 'signup-favicon.ico';
            }

            const { offer_id: couponIdFromQuery, afmc: otherCouponIdFromQuery } = qs.parse(
                window.location.search,
                { ignoreQueryPrefix: true }
            );

            const afmcCoupon = otherCouponIdFromQuery || Utils.getCookie('afmc');
            const offerCoupon = couponIdFromQuery || Utils.getCookie('offer_id');

            const couponRes = { error: '', discount: 0 };

            if (afmcCoupon) {
                try {
                    const coupon = await Payments.getCouponDetails(afmcCoupon);
                    if (coupon) {
                        Utils.setCookie('offer_id', '', -1);
                        couponRes.discount = coupon.percent_off;
                        setState(prev => ({ ...prev, discount: coupon.percent_off }));
                    }
                } catch (error) {
                    Utils.setCookie('afmc', '', -1);
                    couponRes.error = error.message;
                }
            }

            if (offerCoupon && !couponRes.discount) {
                try {
                    const otherCoupon = await Payments.getCouponDetails(offerCoupon);
                    if (otherCoupon) {
                        Utils.setCookie('afmc', '', -1);
                        couponRes.discount = otherCoupon.percent_off;
                        setState(prev => ({ ...prev, discount: otherCoupon.percent_off }));
                    }
                } catch (err) {
                    Utils.setCookie('offer_id', '', -1);
                    couponRes.error = err.message;
                }
            }

            if ((afmcCoupon || offerCoupon) && !couponRes.discount) {
                setState(prev => ({ ...prev, couponError: couponRes.error }));
            }

            checkRegistrationStep();
        };

        window.addEventListener('beforeunload', handleLeads);
        window.addEventListener('unload', handleLeads);

        initializeRegister();

        return () => {
            window.removeEventListener('beforeunload', handleLeads);
            window.removeEventListener('unload', handleLeads);
        };
    }, []);

    useEffect(() => {
        if (!accounts.data && auth.user && accounts.data) {
            checkRegistrationStep();
        }
    }, [accounts.data, auth.user]);

    const onClickNextAccountCreation = async (planSelected, currency = 'USD') => {
        let createCustomerResult = null;
        const updateAccountBody = {};

        try {
            if (auth.user.currency !== currency) {
                await updateUser(auth.user.id, { currency });
            }

            if (!accounts.data || !accounts.data.stripe_token) {
                const createCustomerBody = {
                    account_id: auth.user.account_id,
                    email: auth.user.email,
                    name: auth.user.email,
                    metadata: { account_id: auth.user.account_id },
                    address: {
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        postal_code: ''
                    }
                };
                createCustomerResult = await Payments.createCustomer(createCustomerBody);
            }

            if (createCustomerResult) {
                updateAccountBody.stripe_token = createCustomerResult.id;
            }

            if (!accounts.data ||
                !accounts.data.initial_plan ||
                planSelected.id !== accounts.data.initial_plan.id
            ) {
                updateAccountBody.initial_plan = JSON.stringify(planSelected);
            }

            if (Object.keys(updateAccountBody).length) {
                const customerResult = await updateUserAccount(auth.user.account_id, updateAccountBody);
                if (customerResult) {
                    setState(prev => ({ ...prev, activeForm: 2 }));
                }
            } else {
                setState(prev => ({ ...prev, activeForm: 2 }));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    };

    const onSubmitPayment = async (token, zip, name) => {
        try {
            if (token) {
                const data = {
                    source: token.id,
                    ...(zip && { address: { postal_code: zip } }),
                    ...(name && { name })
                };

                await Payments.updateCustomer(accounts.data.stripe_token, data);
                window.Intercom('trackEvent', 'credit-card', {
                    timestamp: new Date(),
                    added: true,
                    account: accounts.data.id
                });
            }
            
            setState(prev => ({ 
                ...prev, 
                activeForm: prev.activeForm + 1 
            }));
        } catch (error) {
            setState(prev => ({ 
                ...prev, 
                error: error.message 
            }));
            throw error;
        }
    };

    const renderContent = () => {
        switch (state.activeForm) {
            case 0:
                return (
                    <SignUpForm
                        setEmail={email => setState(prev => ({ ...prev, email }))}
                        email={state.email}
                        createUser={createUser}
                        onClickNext={() => setState(prev => ({ ...prev, activeForm: 1 }))}
                        discount={state.discount}
                    />
                );
            case 1:
                return (
                    <AccountCreationForm
                        onClickBack={() => setState(prev => ({ ...prev, activeForm: prev.activeForm - 1 }))}
                        onClickNext={onClickNextAccountCreation}
                        updateUser={updateUser}
                        updateUserAccount={updateUserAccount}
                        user={auth.user}
                        discount={state.discount}
                        couponError={state.couponError}
                        accounts={accounts}
                        currency={auth.user.currency}
                        conversionRates={accounts.conversionRates}
                    />
                );
            case 2:
                return (
                    <Elements stripe={stripePromise}>
                        <PaymentForm
                            onSubmit={onSubmitPayment}
                            onClickBack={() => setState(prev => ({ ...prev, activeForm: prev.activeForm - 1 }))}
                            currency={auth.user.currency}
                            user={auth.user}
                            updateUser={updateUser}
                            accounts={accounts}
                            discount={state.discount}
                            conversionRates={accounts.conversionRates}
                        />
                    </Elements>
                );
            default:
                return auth?.user ? (
                    <FinishedRegistration
                        accounts={accounts}
                        user={auth.user}
                        fetchLatestAccount={fetchLatestAccount}
                        getUserAccounts={getUserAccounts}
                        welcomeUser={() => Users.welcomeUser({ email: auth.user.email })}
                    />
                ) : null;
        }
    };

    if (state.toDashboard) {
        return <Navigate to="/integrations/fraud-blocker-tracker" />;
    }

    if (state.toSignIn) {
        return <Navigate to="/login" />;
    }

    return (
        <div className={styles.all}>
            <Helmet>
                <title>Register | Fraud Blocker</title>
            </Helmet>
            
            <div className={`${styles.content} ${state.activeForm === 2 ? styles.contentCenter : ''}`}>
                {state.activeForm <= 3 && (
                    <div className={styles.leftContentContainer}>
                        <img src={LOGO} alt="Logo" className={styles.logo} />
                        <div className={styles.testimonialContainer}>
                            <div className={styles.testimonialLogo}>
                                <img src={TESTIMONIAL} alt="Testimonial" />
                            </div>
                            <div>
                                <div className={styles.stars}>
                                    <img src={STARS} alt="Stars" />
                                </div>
                                <p className={styles.testimonialText}>
                                    "They greatly reduced my ad fraud and improved my campaign performance. 
                                    Highly recommend!"
                                </p>
                                <p className={styles.testimonialAuthor}>
                                    Matthew C., Sr. Marketing Manager
                                </p>
                            </div>
                        </div>
                        <img src={QUOTES} alt="Quotes" className={styles.techtimes} />
                        <div className={styles.checkFeatures}>
                            <img src={TWO_FOUR} alt="24/7" className={styles.icon} />
                            <div>
                                <div className={styles.checkTitle}>24/7 Account Support</div>
                                <div className={styles.checkText}>
                                    Email, call or chat with our team anytime
                                </div>
                            </div>
                        </div>
                        <div className={styles.checkFeatures}>
                            <img src={CODE} alt="Code" className={styles.icon} />
                            <div>
                                <div className={styles.checkTitle}>
                                    Easy Installation - No developer needed
                                </div>
                                <div className={styles.checkText}>
                                    Install in minutes and start blocking fraud today
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.rightContentContainer}>
                    <div className={styles.topContainer}>
                        {state.activeForm === 0 && (
                            <p>
                                Already have an account?{' '}
                                <span 
                                    onClick={() => setState(prev => ({ ...prev, toSignIn: true }))}
                                    className={styles.signInNowText}
                                >
                                    Sign in now
                                </span>
                            </p>
                        )}
                    </div>
                    {renderContent()}
                </div>
            </div>
            <Footer />
        </div>
    );
}

Register.propTypes = {
    auth: PropTypes.object,
    createUser: PropTypes.func,
    updateUser: PropTypes.func,
    accounts: PropTypes.object,
    updateUserAccount: PropTypes.func,
    getUserAccounts: PropTypes.func,
    fetchLatestAccount: PropTypes.func
};

const mapStateToProps = state => ({
    auth: state.auth,
    accounts: state.accounts,
    activeDomain: state.activeDomain
});

const mapDispatchToProps = dispatch => ({
    createUser: data => dispatch(User.createUser(data)),
    updateUser: (id, data) => dispatch(User.updateUser(id, data)),
    updateUserAccount: (accountId, data) => dispatch(Account.updateUserAccount(accountId, data)),
    getUserAccounts: id => dispatch(Account.getUserAccounts(id)),
    fetchLatestAccount: id => dispatch(Account.fetchLatestAccount(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(Register);