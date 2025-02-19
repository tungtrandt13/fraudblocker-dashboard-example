import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './RegisterForms.module.scss';
import Button from '../../../components/Button/Button';
import Payments from '../../../api/Payments';
import Constants from '../../../utils/Constants';
import Dropdown from '../../../components/Dropdown/Dropdown';
import RangeSlider from '../../../components/RangeSlider/RangeSlider';
import PaypalGrey from '../../../assets/paypal-grey.svg';
import CardGreen from '../../../assets/creditcard-green.svg';
import CouponTick from '../../../assets/coupon-tick.svg';
import Utils from '../../../utils/Utils';
import ErrorBox from '../../../components/ErrorBox/ErrorBox';

const { currencyOptions } = Constants;
const planOptions = ['Pro', 'Starter'];

const customStyles = {
    input: { marginBottom: 25 },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666'
    },
    comingSoon: {
        paddingTop: '10px',
        marginBottom: '-10px',
        fontWeight: 500,
        fontSize: '10px'
    },
    disabledRadio: {
        background: '#f1f1f1',
        border: 'none',
        pointerEvents: 'none'
    }
};

function AccountCreationForm({
    user = {},
    accounts,
    onClickNext,
    currency: propCurrency,
    conversionRates,
    discount,
    couponError
}) {
    const { data = {} } = accounts;

    const [formState, setFormState] = useState({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        city: data.billing_city || '',
        state: data.billing_state ? {
            value: data.billing_state,
            label: data.billing_state
        } : '',
        zip: data.billing_zip || '',
        errors: {},
        loading: false,
        formHasBeenSubmitted: false,
        currency: currencyOptions[0],
        selectedPlan: '',
        selectedBilling: {},
        billingOptions: [],
        paymentMethod: 'CreditCard',
        allPlans: [],
        proClicks: 10000
    });

    useEffect(() => {
        window.scrollTo(0, 0);
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
            script.text = `gtag('event', 'conversion', {'send_to': 'AW-743398152/qC2mCIn-wa0DEIi2veIC'});`;
            document.head.appendChild(script);
            return () => {
                document.head.removeChild(script);
            };
        }
    }, [propCurrency]);

    const fetchAllPlans = async () => {
        try {
            const result = await Payments.getAllPlans();
            const billingOptions = result.data.map(plan => {
                const option = plan.nickname.split(' - ')[0];
                return {
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
            });

            if (result) {
                const defaultValues = {
                    proClicks: billingOptions.find(
                        item => item.plan === planOptions[0] &&
                            item.interval === 'month' &&
                            item.interval_count === 1
                    )?.clicks || 10000,
                    selectedPlan: planOptions[1],
                    selectedBilling: billingOptions.find(
                        item => item.plan === planOptions[1] &&
                            item.interval === 'month' &&
                            item.interval_count === 1
                    )
                };

                setFormState(prev => ({
                    ...prev,
                    allPlans: result.data,
                    billingOptions,
                    selectedPlan: accounts.data?.initial_plan?.plan || defaultValues.selectedPlan,
                    selectedBilling: accounts.data?.initial_plan
                        ? billingOptions.find(
                            item => item.plan === accounts.data.initial_plan.plan &&
                                item.interval === accounts.data.initial_plan.interval &&
                                item.interval_count === accounts.data.initial_plan.interval_count &&
                                item.clicks === accounts.data.initial_plan.clicks
                        ) || defaultValues.selectedBilling
                        : defaultValues.selectedBilling,
                    proClicks: accounts.data?.initial_plan?.plan === 'Pro'
                        ? accounts.data.initial_plan.clicks || defaultValues.proClicks
                        : defaultValues.proClicks
                }));
            }
        } catch (error) {
            console.log(error);
        }
    };

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

    const updateClicks = e => {
        e.preventDefault();
        e.stopPropagation();
        const { billingOptions, selectedBilling = {} } = formState;

        let clicks = parseInt(e.target.value, 10);
        if (clicks > 10000 && clicks < 25000) clicks = 25000;
        else if (clicks > 25000 && clicks < 50000) clicks = 50000;
        else if (clicks > 50000 && clicks < 75000) clicks = 75000;
        else if (clicks > 75000) clicks = 100000;

        setFormState(prev => ({
            ...prev,
            proClicks: clicks,
            selectedPlan: planOptions[0],
            selectedBilling: billingOptions.find(
                item => item.plan === 'Pro' &&
                    item.clicks === clicks &&
                    item.interval === selectedBilling.interval &&
                    item.interval_count === selectedBilling.interval_count
            )
        }));
    };

    const handleNext = async () => {
        setFormState(prev => ({
            ...prev,
            loading: true,
            formHasBeenSubmitted: true
        }));

        try {
            const { selectedBilling, currency } = formState;
            await onClickNext(selectedBilling, currency.value);
            window.Intercom('trackEvent', 'register-step-2');
        } catch (error) {
            console.log(error);
            setFormState(prev => ({
                ...prev,
                errors: { accountCreation: error.message },
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
        const { selectedBilling = {}, billingOptions } = formState;
        if (billingOptions.length && selectedBilling.id) {
            if (plan === 'Starter') {
                const found = billingOptions.find(
                    item => item.plan.includes(plan) &&
                        item.interval === selectedBilling.interval &&
                        item.interval_count === selectedBilling.interval_count
                );
                return found?.clicks || '';
            } else if (plan === 'Pro') {
                return formState.proClicks;
            }
        }
        return '';
    };

    const {
        selectedPlan,
        selectedBilling,
        loading,
        billingOptions,
        errors,
        proClicks,
        currency
    } = formState;

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.headerText}>Awesome! Keep going.</h1>

            {!!billingOptions.length && selectedBilling.id && (
                <div className={styles.chosePlanBox}>
                    <div className={`${styles.secValue} ${styles.currencyWrap}`}>
                        <div style={{ whiteSpace: 'nowrap' }}>
                            Select Plan{' '}
                            {discount !== 0 && (
                                <span className={styles.discountApplied}>
                                    <img src={CouponTick} alt="coupon" />
                                    <strong>{discount}%</strong> discount applied!
                                </span>
                            )}
                        </div>
                        <Dropdown
                            options={currencyOptions}
                            value={currency}
                            selectClass={styles.currencySelect}
                            name="currency"
                            onOptionChange={value => onSelectOption('currency', value)}
                        />
                    </div>

                    <div className={styles.radioBox}>
                        {/* Starter Plan */}
                        <div
                            className={`${styles.radioSec} ${selectedBilling.plan === planOptions[1] ? styles.activeRadioSec : ''
                                }`}
                            onClick={() =>
                                changePlan(
                                    billingOptions.find(
                                        option =>
                                            option.plan === planOptions[1] &&
                                            option.interval === selectedBilling.interval &&
                                            option.interval_count === 1
                                    )
                                )
                            }
                        >
                            <div className={styles.planType}>{planOptions[1]}</div>
                            <div className={styles.planTypeSub}>7-day free trial</div>
                            <div className={styles.planDuration}>
                                {billingOptions.length &&
                                    selectedBilling &&
                                    selectedBilling.id &&
                                    Utils.convertToCurrency(
                                        conversionRates,
                                        getPrice(
                                            billingOptions.find(
                                                item =>
                                                    item.plan === planOptions[1] &&
                                                    item.interval === selectedBilling.interval &&
                                                    item.interval_count === selectedBilling.interval_count
                                            ).price
                                        ),
                                        currency.value
                                    )}
                                <span>
                                    {' '}
                                    /{selectedBilling.interval_count === 3 ? 'quarter' : selectedBilling.interval}
                                </span>
                            </div>
                            <div className={styles.rangeSlider}>&nbsp;</div>
                            <div className={styles.clicksAd}>
                                Up to{' '}
                                {getPlanClicks(planOptions[1]).toLocaleString('en-US', {
                                    maximumFractionDigits: 1
                                })}{' '}
                                Ad Clicks
                            </div>
                            <div className={`${styles.clicksAd} ${styles.websites}`}>
                                {billingOptions &&
                                    selectedBilling &&
                                    selectedBilling.id &&
                                    billingOptions.find(
                                        item =>
                                            item.plan === planOptions[1] &&
                                            item.interval === selectedBilling.interval &&
                                            item.interval_count === selectedBilling.interval_count
                                    ).domains}{' '}
                                Website
                            </div>
                        </div>

                        {/* Pro Plan */}
                        <div
                            className={`${styles.radioSec} ${selectedBilling.plan === planOptions[0] ? styles.activeRadioSec : ''
                                }`}
                            onClick={() =>
                                changePlan(
                                    billingOptions.find(
                                        option =>
                                            option.plan === planOptions[0] &&
                                            option.interval === selectedBilling.interval &&
                                            option.interval_count === 1 &&
                                            option.clicks === proClicks
                                    )
                                )
                            }
                        >
                            <div className={styles.planType}>{planOptions[0]}</div>
                            <div className={styles.planTypeSub}>7-day free trial</div>
                            <div className={styles.planDuration}>
                                {billingOptions.length &&
                                    selectedBilling &&
                                    selectedBilling.id &&
                                    Utils.convertToCurrency(
                                        conversionRates,
                                        getPrice(
                                            billingOptions.find(
                                                item =>
                                                    item.plan === planOptions[0] &&
                                                    item.interval === selectedBilling.interval &&
                                                    item.interval_count === selectedBilling.interval_count &&
                                                    item.clicks === proClicks
                                            ).price
                                        ),
                                        currency.value
                                    )}
                                <span>
                                    {' '}
                                    /{selectedBilling.interval_count === 3 ? 'quarter' : selectedBilling.interval}
                                </span>
                            </div>
                            <div className={styles.rangeSlider}>
                                <RangeSlider
                                    markers={[10000, 20000, 30000, 40000, 50000]}
                                    value={proClicks}
                                    handleChange={updateClicks}
                                />
                            </div>
                            <div className={styles.clicksAd}>
                                Up to{' '}
                                <span>
                                    {getPlanClicks(planOptions[0]).toLocaleString('en-US', {
                                        maximumFractionDigits: 1
                                    })}
                                </span>{' '}
                                Ad Clicks
                            </div>
                            {billingOptions.length && selectedBilling && selectedBilling.id && (
                                billingOptions.find(
                                    item =>
                                        item.plan === planOptions[0] &&
                                        item.interval === selectedBilling.interval &&
                                        item.interval_count === selectedBilling.interval_count &&
                                        item.clicks === proClicks
                                ).domains !== 'unlimited' ? (
                                    <div className={`${styles.clicksAd} ${styles.websites}`}>
                                        Up to{' '}
                                        <span>
                                            {billingOptions.find(
                                                item =>
                                                    item.plan === planOptions[0] &&
                                                    item.interval === selectedBilling.interval &&
                                                    item.interval_count === selectedBilling.interval_count &&
                                                    item.clicks === proClicks
                                            ).domains}
                                        </span>{' '}
                                        Websites
                                    </div>
                                ) : (
                                    <div className={`${styles.clicksAd} ${styles.websites}`}>
                                        <span>Unlimited</span> Websites
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div className={styles.secValue}>Select Payment Term</div>
                    <div className={`${styles.radioBox} ${styles.radioBoxPlan}`}>
                        {/* Monthly */}
                        <div
                            onClick={() =>
                                onSelectOption(
                                    'selectedBilling',
                                    billingOptions &&
                                    billingOptions.find(
                                        item =>
                                            item.plan === selectedPlan &&
                                            (selectedPlan === 'Starter' || item.clicks === proClicks) &&
                                            item.interval === 'month' &&
                                            item.interval_count === 1
                                    )
                                )
                            }
                            className={`${styles.radioSec} ${selectedBilling.interval_count === 1 && selectedBilling.interval === 'month'
                                    ? styles.activeRadioSec
                                    : ''
                                }`}
                        >
                            <div className={styles.planTerms}>Monthly</div>
                        </div>

                        {/* Quarterly */}
                        <div
                            onClick={() =>
                                onSelectOption(
                                    'selectedBilling',
                                    billingOptions &&
                                    billingOptions.find(
                                        item =>
                                            item.plan === selectedPlan &&
                                            (selectedPlan === 'Starter' || item.clicks === proClicks) &&
                                            item.interval === 'month' &&
                                            item.interval_count === 3
                                    )
                                )
                            }
                            className={`${styles.radioSec} ${selectedBilling.interval_count === 3 && selectedBilling.interval === 'month'
                                    ? styles.activeRadioSec
                                    : ''
                                }`}
                        >
                            <div className={styles.planTerms}>
                                <div className={styles.planTermsInner}>
                                    Quarterly <span>(Save 12%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Annual */}
                        <div
                            onClick={() =>
                                onSelectOption(
                                    'selectedBilling',
                                    billingOptions &&
                                    billingOptions.find(
                                        item =>
                                            item.plan === selectedPlan &&
                                            (selectedPlan === 'Starter' || item.clicks === proClicks) &&
                                            item.interval === 'year'
                                    )
                                )
                            }
                            className={`${styles.radioSec} ${selectedBilling.interval && selectedBilling.interval === 'year'
                                    ? styles.activeRadioSec
                                    : ''
                                }`}
                        >
                            <div className={styles.planTerms}>
                                <div className={styles.planTermsInner}>
                                    Annual <span>(Save 20%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className={styles.secValue}>Select Payment Method</div>
                    <div className={styles.radioBox}>
                        <div
                            onClick={() => onSelectOption('paymentMethod', 'CreditCard')}
                            className={`${styles.radioSec} ${styles.activeRadioSec}`}
                        >
                            <div className={styles.planTerms}>
                                <img src={CardGreen} alt="credit card" />
                                Credit Card
                            </div>
                        </div>
                        <div className={styles.radioSec} style={customStyles.disabledRadio}>
                            <div className={styles.planTerms}>
                                <img src={PaypalGrey} alt="paypal" />
                                Paypal
                            </div>
                            <div className={styles.planTerms} style={customStyles.comingSoon}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(errors.accountCreation || couponError) && (
                <ErrorBox
                    errorStyle={{ marginRight: '35px' }}
                    error={errors.accountCreation || couponError}
                />
            )}

            {!!billingOptions.length && selectedBilling.id && (
                <div className={styles.formFooterContainer}>
                    <Button
                        title="Next"
                        onClick={handleNext}
                        loading={loading}
                        style={customStyles.nextBtn}
                        customClassNames="acctCreation__nextBtn"
                        color="green"
                    />
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