import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Tooltip } from 'react-tooltip';

// Components
import ProgressBar from '../../components/ProgressBar/ProgressBar';

// Assets
import { ReactComponent as LogoutIcon } from '../../assets/exit-icon.svg';
import { ReactComponent as TacoIcon } from '../../assets/taco.svg';
import PlanIcon from '../../assets/starter-icon.png';
import CrownIcon from '../../assets/pro-icon.png';
import CanceledPlanIcon from '../../assets/canceled_icon.svg';
import CROWN from '../../assets/crown-blue.svg';

// Styles
import styles from './CurrentUserBox.module.scss';

// Utils & Services
const handleSignOut = () => {
    // Move sign out logic here instead of importing User
    localStorage.clear();
    window.location.href = '/login';
};

const fetchSiteClicks = async (userId, subscriptionId, timezone) => {
    try {
        const response = await fetch('/api/site-clicks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, subscriptionId, timezone }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching clicks:', error);
        return null;
    }
};

function CurrentUserBox({ user, accounts, history, activeDomain }) {
    const [clicksData, setClicksData] = useState({
        clicks: 0,
        error: ''
    });

    const getSingleSubscription = (accounts, accountId) => {
        if (!accounts?.data?.subscriptions) return null;
        return accounts.data.subscriptions.find(sub => sub.account_id === accountId);
    };

    const updateClicks = async () => {
        try {
            const subscription = getSingleSubscription(accounts, accounts.data.id);
            if (!subscription) {
                setClicksData(prev => ({ ...prev, clicks: 0 }));
                return;
            }

            const result = await fetchSiteClicks(
                user.account_id,
                subscription.id,
                user.timezone
            );

            if (result?.length && !result.errno) {
                const total = result.reduce((acc, item) => acc + item.clicks, 0);
                setClicksData({
                    clicks: total,
                    error: ''
                });
            } else {
                setClicksData(prev => ({ ...prev, clicks: 0 }));
            }
        } catch (error) {
            setClicksData(prev => ({
                ...prev,
                error: error.message
            }));
        }
    };

    useEffect(() => {
        updateClicks();
    }, []);

    useEffect(() => {
        if (activeDomain?.data?.id) {
            updateClicks();
        }
    }, [activeDomain?.data?.id]);

    const handleUpgradePlan = () => {
        history.push('/account/billing/subscription');
    };

    const getPlanName = subscription => {
        if (!subscription?.plan) return 'Starter Plan';
        return subscription.appSumoSubscription
            ? subscription.appSumoSubscription.plan.nickname
            : subscription.plan.nickname;
    };

    const getUsagePercentage = (currentClicks, totalClicks) => {
        return (currentClicks * 100) / totalClicks;
    };

    const renderPlanIcon = (subscription, planName) => {
        if (!subscription || subscription.status === 'canceled') {
            return (
                <div className={styles.planIcon}>
                    <img src={CanceledPlanIcon} alt="Canceled Plan" />
                </div>
            );
        }

        if (planName.toLowerCase().includes('appsumo')) {
            return (
                <div className={styles.appsumoPlanIcon}>
                    <TacoIcon />
                </div>
            );
        }

        const isStarterPlan = planName.toLowerCase().includes('starter');
        return (
            <div className={styles.planIcon}>
                <img 
                    src={isStarterPlan ? PlanIcon : CrownIcon}
                    alt={isStarterPlan ? "Starter Plan" : "Pro Plan"}
                />
            </div>
        );
    };

    const renderPlanStatus = (subscription, planName) => {
        if (!subscription) return null;

        if (subscription.status !== 'canceled' && planName) {
            return (
                <div className={styles.currentPlan}>
                    <div className={styles.current}>Currently on the</div>
                    <div className={styles.planName}>{planName}</div>
                </div>
            );
        }

        const daysRemaining = moment.unix(subscription.current_period_end).diff(moment(), 'days');
        
        if (daysRemaining >= 0) {
            return (
                <div className={styles.currentPlan}>
                    <div className={styles.canceledPlan}>Canceled Plan</div>
                    <div className={styles.planActiveUntil}>
                        Active until {moment.unix(subscription.current_period_end).format('MMMM D, YYYY')}
                    </div>
                </div>
            );
        }

        return <div className={styles.canceledPlan}>Canceled Plan</div>;
    };

    const subscription = getSingleSubscription(accounts, user.account_id);
    const planName = getPlanName(subscription);
    const totalClicks = subscription?.plan?.metadata?.clicks 
        ? parseInt(subscription.plan.metadata.clicks, 10) 
        : 0;

    return (
        <div className={styles.userBox}>
            <div className={styles.nameBox}>
                <div className={styles.nameAndEmail}>
                    <p className={styles.userName}>
                        {`${user.first_name || 'Your'} ${user.last_name || 'Name'}`}
                    </p>
                    <p className={styles.userEmail}>{user.email}</p>
                </div>
                <Tooltip>
                    <Tooltip.Button className={styles.logout} onClick={handleSignOut}>
                        <LogoutIcon />
                    </Tooltip.Button>
                    <Tooltip.Panel className="z-10 p-2 text-sm bg-white rounded shadow-lg">
                        Sign out
                    </Tooltip.Panel>
                </Tooltip>
            </div>

            {user && !['Viewer', 'Client'].includes(user.role) && (
                <div className={styles.planBox}>
                    <div className={styles.planRow}>
                        {renderPlanIcon(subscription, planName)}
                        {renderPlanStatus(subscription, planName)}
                    </div>

                    <ProgressBar
                        color={clicksData.clicks > totalClicks ? '#fc584e' : '#10cd24'}
                        percentage={getUsagePercentage(clicksData.clicks, totalClicks)}
                    />

                    <div className={styles.clicks}>
                        <div className={styles.clicksSection}>
                            <div className={`${styles.clicksCount} ${clicksData.clicks > totalClicks ? styles.limit : ''}`}>
                                {clicksData.clicks.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                            </div>
                            <div className={styles.clicksText}>ad clicks</div>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.clicksSection}>
                            <div className={`${styles.clicksCount} ${clicksData.clicks > totalClicks ? styles.limit : ''}`}>
                                {totalClicks.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                            </div>
                            <div className={styles.clicksText}>monthly ad clicks</div>
                        </div>
                    </div>

                    {!planName.toLowerCase().includes('appsumo') && (
                        <button 
                            onClick={handleUpgradePlan}
                            className={clicksData.clicks <= totalClicks ? styles.upgradeLink : styles.upgradeLinkRed}
                        >
                            {clicksData.clicks <= totalClicks ? (
                                <>
                                    <img src={CROWN} alt="Upgrade" />
                                    {planName.toLowerCase().includes('starter') 
                                        ? 'Upgrade Now To Pro' 
                                        : 'Upgrade Now'
                                    }
                                </>
                            ) : (
                                <>
                                    <span>!</span>
                                    Limit Reached. Upgrade Now!
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

CurrentUserBox.propTypes = {
    user: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string.isRequired,
        account_id: PropTypes.string.isRequired,
        timezone: PropTypes.string,
        role: PropTypes.string.isRequired
    }).isRequired,
    accounts: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string.isRequired,
            subscriptions: PropTypes.array
        }).isRequired
    }).isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired,
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string.isRequired
        })
    })
};

export default CurrentUserBox;