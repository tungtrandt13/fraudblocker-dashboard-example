import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useLocation } from 'react-router-dom';
import { parseDomain, fromUrl } from 'parse-domain';
import { Tooltip } from 'react-tooltip';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import qs from 'qs';

import Input from '../../components/Input/Input';
import styles from './AppSumoRegister.module.scss';
import LOGO from '../../assets/main-logo.svg';
import LOGO_SMALL from '../../assets/small-logo.svg';
import User from '../../redux/actions/User';
import Account from '../../redux/actions/Account';
import Button from '../../components/Button/Button';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import Validation from '../../utils/Validation';
import { ReactComponent as TooltipIcon } from '../../assets/tooltip.svg';
import LockIcon from '../../assets/lock_icon_email.svg';
import Achievements from '../../assets/achievements.svg';
import SumoWelcome from '../../assets/welcome-appsumo.svg';
import SumoLings from '../../assets/sumo-ling.svg';
import Taco from '../../assets/taco-sumo.svg';
import Separator from '../../assets/separator.svg';
import AccountReadyModal from './components/AccountReady';
import AccountExistModal from './components/AccountExistModal';

const customStyles = {
    input: {
        marginBottom: 25
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666'
    }
};

function AppSumoRegister({
    auth,
    accounts,
    completeAppSumoUser
}) {

    const location = useLocation();

    const [formState, setFormState] = useState({
        email: '',
        domain: '',
        password: '',
        errors: {},
        toDashboard: false,
        toSignIn: false,
        loading: false,
        isAccountExistModalOpen: false,
        isAccountReadyModalOpen: false,
        appSumoPlanId: '',
        planId: '',
        invoiceId: ''
    });

    useEffect(() => {
        
        const favicon = document.getElementById('favicon');
        if (favicon) {
            favicon.href = 'signup-favicon.ico';
        }

        const query = qs.parse(location.search, {
            ignoreQueryPrefix: true
        });

        if (location?.search) {
            const query = qs.parse(location.search, {
                ignoreQueryPrefix: true
            });

            setFormState(prev => ({
                ...prev,
                email: query.email || '',
                appSumoPlanId: query.appSumoPlanId || '',
                planId: query.planId || '',
                invoiceId: query.invoiceId || ''
            }));
        }
    }, [location?.search]);

    const handleInputChange = event => {
        const { value, name } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const parseDomainUrl = domain => {
        try {
            const parseResult = parseDomain(fromUrl(domain));
            let parsedDomain = `${parseResult.icann.domain}.${parseResult.icann.topLevelDomains.join('.')}`;
            
            if (parseResult.icann.subDomains?.length) {
                const subDomains = parseResult.icann.subDomains.filter(
                    name => name.toLowerCase() !== 'www'
                );
                if (subDomains.length) {
                    parsedDomain = `${subDomains.join('.')}.${parsedDomain}`;
                }
            }
            
            return parsedDomain;
        } catch (error) {
            console.error('Error parsing domain:', error);
            return domain;
        }
    };

    const handleSubmit = async () => {
        setFormState(prev => ({ ...prev, loading: true }));

        const { domain, password, email, appSumoPlanId, planId } = formState;
        const data = { domain, email, password };

        const newErrors = Validation.validateForm(data);
        if (newErrors) {
            setFormState(prev => ({
                ...prev,
                errors: newErrors,
                loading: false
            }));
            return;
        }

        try {
            const result = await User.createUserWithEmailAndPassword(email, password);
            if (!result) {
                throw new Error('Error creating user account');
            }

            const parsedDomain = parseDomainUrl(domain);
            const userData = {
                domain: parsedDomain,
                email: data.email,
                id: result.user.uid,
                appSumoPlanId
            };

            const createUserResponse = await completeAppSumoUser(userData, planId);
            if (createUserResponse) {
                setFormState(prev => ({ ...prev, toDashboard: true }));
            } else {
                throw new Error('Error creating user account');
            }
        } catch (error) {
            console.error('Submit error:', error);
            
            if (error.message.includes('already') || (error.code && error.code.includes('already'))) {
                setFormState(prev => ({
                    ...prev,
                    isAccountExistModalOpen: true,
                    loading: false
                }));
                return;
            }

            setFormState(prev => ({
                ...prev,
                errors: { signUp: error.message },
                loading: false
            }));
        }
    };

    const handleKeyPress = e => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleModalToggles = {
        accountExist: () => setFormState(prev => ({
            ...prev,
            isAccountExistModalOpen: false
        })),
        
        accountReady: () => setFormState(prev => ({
            ...prev,
            isAccountReadyModalOpen: false
        })),

        onAccountLinked: () => setFormState(prev => ({
            ...prev,
            isAccountExistModalOpen: false,
            isAccountReadyModalOpen: true
        })),

        goToLogin: () => setFormState(prev => ({
            ...prev,
            toSignIn: true
        }))
    };

    if (formState.toDashboard) {
        return <Navigate to="/integrations/fraud-blocker-tracker" />;
    }

    if (formState.toSignIn) {
        return <Navigate to="/login" />;
    }

    return (
        <div className={`${styles.all} ${styles.appSumoReg}`}>
            <Helmet>
                <title>Register | Fraud Blocker</title>
            </Helmet>
            
            <div className={styles.content}>
                <div className={styles.rightContentContainer}>
                    <div className={styles.regForm}>
                        <img src={LOGO} alt="Logo" className={styles.logo} />
                        <img src={LOGO_SMALL} alt="Small Logo" className={styles.logoSmall} />
                        
                        <Tooltip className={styles.tooltip} data-tooltip-id="moreWebsites">
                            You can add more websites or change them later
                        </Tooltip>

                        <div className={styles.formContainer}>
                            <h1 className={styles.headerText}>Create your account</h1>
                            
                            <Input
                                name="domain"
                                value={formState.domain}
                                onChange={handleInputChange}
                                className={styles.inputContainer}
                                labelStyle={customStyles.inputLabel}
                                containerStyle={customStyles.input}
                                label={
                                    <span>
                                        Website to Protect{' '}
                                        <TooltipIcon 
                                            className={styles.registerHelpTip}
                                            data-tooltip-id="moreWebsites"
                                        />
                                    </span>
                                }
                                placeholder="example.com"
                                error={formState.errors.domain}
                            />

                            <Input
                                name="email"
                                value={formState.email}
                                disabled
                                onChange={() => {}}
                                onKeyPress={handleKeyPress}
                                labelStyle={customStyles.inputLabel}
                                containerStyle={customStyles.input}
                                label="Email"
                                placeholder="joanna@example.com"
                                error={formState.errors.email}
                                icon={LockIcon}
                            />

                            <Input
                                name="password"
                                value={formState.password}
                                type="password"
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                labelStyle={customStyles.inputLabel}
                                label="Password"
                                showEye
                                error={formState.errors.password}
                            />

                            <p className={styles.passwordInfo}>
                                Your password must be at least 8 characters. 
                                We recommend at least 1 lowercase, 1 uppercase, and 1 number.
                            </p>

                            {formState.errors.signUp && (
                                <ErrorBox error={formState.errors.signUp} />
                            )}

                            <div className={styles.formFooterContainer}>
                                <Button
                                    title="Next"
                                    onClick={handleSubmit}
                                    style={customStyles.nextBtn}
                                    loading={formState.loading}
                                    customClassNames="signUpForm__nextBtn"
                                    color="new-green"
                                />
                                
                                <p>
                                    By clicking this button you agree to Fraud Blocker's{' '}
                                    <a
                                        href="https://fraudblocker.com/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`blue ${styles.link}`}
                                    >
                                        Terms of Service
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.leftContentContainer}>
                    <div className={styles.sumoLings}>
                        <div className={styles.tacoIcon}>
                            <img src={Taco} alt="Taco" />
                        </div>
                        <div className={styles.welcomeIcon}>
                            <img src={SumoWelcome} alt="Welcome" />
                        </div>
                        <div className={styles.sumoIcon}>
                            <img src={SumoLings} alt="Sumo Lings" />
                        </div>
                        
                        <div className={styles.thanksForPurchase}>
                            Thanks for purchasing Fraud Blocker
                        </div>
                        
                        <div className={styles.fraudProtectLeader}>
                            the leader in click fraud protection
                        </div>
                        
                        <div className={styles.sharpSeparator}>
                            <img src={Separator} alt="Separator" />
                        </div>

                        <div className={styles.customerStats}>
                            <div className={styles.customStatsBlock}>
                                <div className={styles.customStatsNumbers}>4,000</div>
                                <div className={styles.customStatsDesc}>Client accounts</div>
                            </div>
                            
                            <div className={styles.customStatsBlock}>
                                <div className={styles.customStatsNumbers}>12 Million</div>
                                <div className={styles.customStatsDesc}>IPs analyzed per month</div>
                            </div>
                            
                            <div className={styles.customStatsBlock}>
                                <div className={styles.customStatsNumbers}>11,000</div>
                                <div className={styles.customStatsDesc}>Domain names on our Platform</div>
                            </div>
                        </div>

                        <div className={styles.achievements}>
                            <img src={Achievements} alt="Achievements" />
                        </div>
                    </div>
                </div>
            </div>

            {formState.isAccountReadyModalOpen && (
                <AccountReadyModal
                    isOpen={formState.isAccountReadyModalOpen}
                    buttons={[{
                        title: 'Login to Dashboard',
                        color: 'lt-blue',
                        action: handleModalToggles.goToLogin
                    }]}
                    toggleModal={handleModalToggles.accountReady}
                />
            )}

            {formState.isAccountExistModalOpen && (
                <AccountExistModal
                    appSumoPlanId={formState.appSumoPlanId}
                    planId={formState.planId}
                    invoiceId={formState.invoiceId}
                    redirectUser={handleModalToggles.onAccountLinked}
                    isOpen={formState.isAccountExistModalOpen}
                    email={formState.email}
                />
            )}
        </div>
    );
}

AppSumoRegister.propTypes = {
    auth: PropTypes.object,
    accounts: PropTypes.object,
    completeAppSumoUser: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    accounts: state.accounts
});

const mapDispatchToProps = dispatch => ({
    completeAppSumoUser: (data, planId) => 
        dispatch(User.completeAppSumoUser(data, planId))
});

export default connect(mapStateToProps, mapDispatchToProps)(AppSumoRegister);