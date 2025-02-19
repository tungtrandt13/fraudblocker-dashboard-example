import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from '../../RegisterSteps.module.scss';
import Button from '../../../../components/Button/Button';
import Payments from '../../../../api/Payments';
import Constants from '../../../../utils/Constants';
import PRO from '../../../../assets/pro.svg';
import STATER from '../../../../assets/stater.svg';
import CREDITCARD from '../../../../assets/credit-card.svg';
import PAYPAL from '../../../../assets/paypal-gray.svg';
import ENTERPRISE from '../../../../assets/enterprise.svg';
import BRANDON from '../../../../assets/brandon-headshot.svg';
import Dropdown from '../../../../components/Dropdown/Dropdown';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';
import { ReactComponent as UnlockDiscountIcon } from '../../../../assets/unlock-discount.svg';
import Utils from '../../../../utils/Utils';
import ErrorBox from '../../../../components/ErrorBox/ErrorBox';

const { currencyOptions, clicksValueMap } = Constants;
const planOptions = ['Pro', 'Starter', 'Enterprise'];

function AccountCreationForm({
    onClickNext,
    updateUser,
    updateUserAccount,
    user,
    accounts,
    currency: propCurrency,
    conversionRates,
    discount,
    couponError
}) {
    // State
    const [formState, setFormState] = useState({
        city: accounts?.data?.billing_city || '',
        state: accounts?.data?.billing_state ? {
            value: accounts.data.billing_state,
            label: accounts.data.billing_state
        } : '',
        zip: accounts?.data?.billing_zip || '',
        errors: {},
        loading: false,
        formHasBeenSubmitted: false,
        currency: currencyOptions[0],
        selectedPlan: '',
        selectedBilling: {},
        billingOptions: [],
        paymentMethod: 'CreditCard',
        allPlans: [],
        proClicks: 10000,
        showScheduleCall: false
    });

    // Destructure state for easier access
    const {
        errors,
        loading,
        selectedPlan,
        selectedBilling,
        billingOptions,
        paymentMethod,
        proClicks,
        currency,
        showScheduleCall
    } = formState;

    useEffect(() => {
        window.scrollTo(0, 100);
        console.log(window.gtag);
        fetchAllPlans();

        if (propCurrency) {
            setFormState(prev => ({
                ...prev,
                currency: currencyOptions.find(item => item.value === propCurrency)
            }));
        }

        if (window.gtag) {
            const script = document.createElement('script');
            const inlineScript = document.createTextNode(
                `gtag('event', 'conversion', {'send_to': 'AW-743398152/qC2mCIn-wa0DEIi2veIC'});`
            );
            script.appendChild(inlineScript);
            document.head.appendChild(script);
        }
    }, [propCurrency]);

    const fetchAllPlans = async () => {
        try {
            const result = await Payments.getAllPlans();
            const newBillingOptions = [];
            
            result.data.forEach(plan => {
                const option = plan.nickname.split(' ')[0];
                const billingOption = {
                    id: plan.id,
                    plan: option,
                    nickname: plan.nickname,
                    trial_period_days: plan.trial_period_days || 30,
                    interval: plan.interval,
                    interval_count: plan.interval_count,
                    price: plan.amount / 100,
                    clicks: parseInt(plan.metadata.clicks, 10),
                    domains: plan.metadata.domains
                };
                newBillingOptions.push(billingOption);
            });

            if (result) {
                const defaultValues = {
                    proClicks: newBillingOptions.find(
                        item =>
                            item.plan === planOptions[0] && 
                            item.interval === 'month' && 
                            item.interval_count === 1
                    ).clicks,
                    selectedPlan: planOptions[1],
                    selectedBilling: newBillingOptions.find(
                        item =>
                            item.plan === planOptions[1] && 
                            item.interval === 'month' && 
                            item.interval_count === 1
                    )
                };

                if (!newBillingOptions.find(
                    item =>
                        item.plan === planOptions[0] &&
                        item.interval === 'year' &&
                        item.clicks === defaultValues.proClicks
                )) {
                    defaultValues.proClicks = 10000;
                }

                setFormState(prev => ({
                    ...prev,
                    allPlans: result.data,
                    selectedPlan: accounts?.data?.initial_plan?.plan || defaultValues.selectedPlan,
                    selectedBilling: accounts?.data?.initial_plan 
                        ? newBillingOptions.find(
                            item =>
                                item.plan === accounts.data.initial_plan.plan &&
                                item.interval === accounts.data.initial_plan.interval &&
                                item.interval_count === accounts.data.initial_plan.interval_count &&
                                item.clicks === accounts.data.initial_plan.clicks
                        ) || defaultValues.selectedBilling
                        : defaultValues.selectedBilling,
                    billingOptions: newBillingOptions,
                    proClicks: accounts?.data?.initial_plan?.plan === 'Pro'
                        ? accounts.data.initial_plan.clicks || defaultValues.proClicks
                        : defaultValues.proClicks
                }));
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Handler functions
    const onSelectOption = (type, value) => {
        setFormState(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const changePlan = plan => {
        setFormState(prev => ({
            ...prev,
            selectedPlan: plan.plan,
            selectedBilling: plan
        }));
    };

    const updateClicks = val => {
        let clicks = val;
        if (clicks > 10000 && clicks <= 20000) clicks = 25000;
        else if (clicks > 20000 && clicks <= 30000) clicks = 50000;
        else if (clicks > 30000 && clicks <= 40000) clicks = 75000;
        else if (clicks > 40000) clicks = 100000;

        const newSelectedBilling = billingOptions.find(
            item =>
                item.plan === 'Pro' &&
                item.clicks === clicks &&
                item.interval === selectedBilling.interval &&
                item.interval_count === selectedBilling.interval_count
        );

        setFormState(prev => ({
            ...prev,
            proClicks: clicks,
            selectedPlan: planOptions[0],
            selectedBilling: newSelectedBilling
        }));
    };

    const handleScheduleCall = () => {
        setFormState(prev => ({
            ...prev,
            showScheduleCall: true
        }));

        const existingScript = document.getElementById('calendy-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.id = 'calendy-script';
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://assets.calendly.com/assets/external/widget.css';
            document.body.appendChild(script);
            document.body.appendChild(link);
        }
    };

    const onClickNextAccountCreation = async (planSelected, currencyVal = 'USD', scheduleCall = false) => {
        let createCustomerResult = null;
        const updateAccountBody = {};

        try {
            if (user.currency !== currencyVal) {
                await updateUser(user.id, { currency: currencyVal });
            }

            if (!accounts.data || !accounts.data.stripe_token) {
                const createCustomerBody = {
                    account_id: user.account_id,
                    email: user.email,
                    name: user.email,
                    metadata: {
                        account_id: user.account_id
                    },
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

            if (!accounts.data?.initial_plan || planSelected.id !== accounts.data.initial_plan.id) {
                updateAccountBody.initial_plan = JSON.stringify(planSelected);
            }

            if (Object.keys(updateAccountBody).length) {
                const customerResult = await updateUserAccount(user.account_id, updateAccountBody);
                if (customerResult) {
                    if (scheduleCall) handleScheduleCall();
                    else onClickNext();
                }
            } else {
                if (scheduleCall) handleScheduleCall();
                else onClickNext();
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    };

    const saveAccountDetails = async (scheduleCall = false) => {
        setFormState(prev => ({
            ...prev,
            loading: true,
            formHasBeenSubmitted: true
        }));

        try {
            await onClickNextAccountCreation(selectedBilling, currency.value, scheduleCall);
            window.Intercom('trackEvent', 'register-step-4');
        } catch (error) {
            console.log(error);
            setFormState(prev => ({
                ...prev,
                errors: {
                    accountCreation: error.message
                },
                loading: false
            }));
        }
    };

    const getPrice = price => {
        if (discount !== 0) {
            return price - (price * discount) / 100;
        }
        return price;
    };

    const getPlanClicks = plan => {
        if (billingOptions.length && selectedBilling.id) {
            if (plan === 'Starter' && selectedBilling.interval === 'month') {
                const found = billingOptions.find(
                    item =>
                        item.plan.includes(plan) &&
                        item.interval === 'month' &&
                        item.interval_count === selectedBilling.interval_count
                );
                if (found) return found.clicks;
            } else if (plan === 'Starter' && selectedBilling.interval === 'year') {
                const found = billingOptions.find(
                    item => item.plan.includes(plan) && item.interval === 'year'
                );
                if (found) return found.clicks;
            } else if (plan === 'Pro') {
                return proClicks;
            }
        }
        return '';
    };

    // Render functions (split into smaller components if needed)
    const renderPlanSection = () => {
        // ... plan section JSX
    };

    const renderPlanDesc = () => {
        // ... plan description JSX
    };

    return (
        <div className={`${styles.slideLeft} ${styles.planBox} ${styles.active}`}>
            {!showScheduleCall ? (
                billingOptions.length && selectedBilling.id && (
                    <>
                        {/* Main content */}
                        {renderPlanSection()}
                        {renderPlanDesc()}
                    </>
                )
            ) : (
                <div className={styles.scheduleCallWrap}>
                    {/* Schedule call content */}
                </div>
            )}
        </div>
    );
}

AccountCreationForm.propTypes = {
    onClickNext: PropTypes.func,
    onClickBack: PropTypes.func,
    updateUser: PropTypes.func,
    updateUserAccount: PropTypes.func,
    user: PropTypes.object,
    accounts: PropTypes.object,
    currency: PropTypes.string,
    conversionRates: PropTypes.any,
    discount: PropTypes.number,
    couponError: PropTypes.string
};

export default AccountCreationForm;