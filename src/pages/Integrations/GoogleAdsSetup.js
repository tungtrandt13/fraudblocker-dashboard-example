import React, {
    PureComponent
} from 'react';
import { GoogleLogin } from '@react-oauth/google';
import PropTypes from 'prop-types';
import {
    connect
} from 'react-redux';
import styles from './Integrations.module.scss';
import Button from '../../components/Button/Button';
import GoogleAds from '../../api/GoogleAds';
// import SuccessBox from '../../components/SuccessBox/SuccessBox';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import ActiveDomain from '../../redux/actions/ActiveDomain';
import Input from '../../components/Input/Input';
import Account from '../../redux/actions/Account';
import DriveIcon from '../../assets/googleconnected.svg';
import ArrowRight from '../../assets/dropdown-arrow.svg';
import CheckIcon from '../../assets/connected.svg';
import ConnectionErrorIcon from '../../assets/google-connection-error.svg';
import GoogleIcon from '../../assets/google-logo.svg';
import Spinner from 'react-spinkit';
import ConfirmAccountDisconnectionModal from '../../containers/ConfirmAccountDisconnectionModal/ConfirmAccountDisconnectionModal';

const customStyles = {
    subTitle: {
        marginTop: 40
    },
    connectBtn: {
        maxWidth: 350,
        marginTop: 20,
        marginBottom: 20
    },
    removeConnectionGrayButton: {
        border: 'none',
        background: 'transparent',
        color: '#7e7e7e',
        fontWeight: 'normal'
    },
    divider: {
        marginTop: 20,
        width: '100%',
        height: 1,
        backgroundColor: '#d5d9de'
    },
    invited: {
        color: '#0caf1d',
        fontSize: '14px',
        fontWeight: '500',
        marginLeft: '10px'
    },
    mccInput: {
        width: '90px',
        height: '36px',
        fontSize: '14px',
        fontWeight: 'normal',
        textAlign: 'center',
        paddingLeft: '18px',
        paddingRight: '18px'
    }
};
class GoogleAdsSetup extends PureComponent {
    state = {
        loading: {},
        success: {},
        status: 'all',
        email: '',
        accountName: '',
        error: {},
        clients: [],
        filteredClients: [],
        invited: false,
        managerAccountId: '',
        showMangerDesc: false,
        disconnectingAds: false,
        showAdDisconnectConfirmation: null,
        showConnectionRemoveConfirmation: false
    };

    sendInvitation = async () => {
        const {
            activeDomain
        } = this.props;
        if (!this.state.managerAccountId ||
            !activeDomain ||
            !activeDomain.data ||
            !activeDomain.data.id
        ) {
            return null;
        }
        try {
            this.setState({
                loading: { ...this.state.loading,
                    manager: true
                }
            });
            const inviteResult = await GoogleAds.inviteManagerAccount({
                managerId: this.state.managerAccountId.replace(/-/g, ''),
                domainId: activeDomain.data.id
            });
            console.log('Invitation Result', inviteResult);
            this.setState({
                loading: { ...this.state.loading,
                    manager: false
                },
                invited: true
            });
            return null;
        } catch (error) {
            this.setState({
                error: {
                    manager: error.message
                },
                loading: { ...this.state.loading,
                    manager: false
                }
            });
            return null;
        }
    };

    handleManagerAccountChange = e => {
        this.setState({
            managerAccountId: e.target.value
        });
    };

    handleEmailChange = e => {
        this.setState({
            email: e.target.value
        });
    };

    applyFilters = clients => {
        if (!clients.length) {
            return [];
        }
        const filtered = clients.filter(client => {
            const {
                accountName,
                status
            } = this.state;
            return (
                (client.customerClient.descriptiveName || '')
                .toLowerCase()
                .includes(accountName.toLowerCase()) &&
                (status === 'all' ? true : status === 'connected' ? client.connected : !client.connected)
            );
        });
        this.setState({
            filteredClients: filtered
        });
        return null;
    };

    handleAccountNameFilterChange = e => {
        this.setState({
            accountName: e.target.value
        }, () => this.applyFilters(this.state.clients));
    };

    handleStatusFilterChange = e => {
        this.setState({
            status: e.target.value
        }, () => this.applyFilters(this.state.clients));
    };

    getAndSetCustomerClients = async (accountId, domainId) => {
        try {
            this.setState({
                loading: { ...this.state.loading,
                    clients: true
                }
            });
            const clientsResult = await GoogleAds.getCustomerClients(accountId, domainId);
            console.log('Connected Clients', clientsResult);
            this.setState({
                clients: clientsResult,
                loading: { ...this.state.loading,
                    clients: false
                }
            });
            this.applyFilters(clientsResult);
        } catch (error) {
            this.setState({
                error: {
                    authorize: error.message
                },
                loading: { ...this.state.loading,
                    clients: false
                }
            });
        }
    };

    onGoogleLoginResponse = async response => {
        const {
            accounts,
            setDomain,
            activeDomain,
            fetchLatestAccount
        } = this.props;

        console.log(response);
        if (response.code) {
            try {
                console.log(response);
                const authUserResult = await GoogleAds.authorizeUser(
                    response.code,
                    activeDomain.data.id,
                    accounts.data.id
                );
                console.log(authUserResult);
                if (authUserResult) {
                    window.Intercom('trackEvent', 'connect_oauth', {
                        domain: activeDomain.data.domain_name
                    });
                    this.getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
                    fetchLatestAccount(accounts.data.id);
                    setDomain({ ...activeDomain.data,
                        google_ads_token: authUserResult.refresh_token
                    });
                }
            } catch (error) {
                console.log(error.message);
                this.setState({
                    error: {
                        authorize: error.message
                    }
                });
            }
        }
        if (response.error) {
            console.error(response);
        }
    };

    componentDidMount = () => {
        if (
            this.props.accounts &&
            this.props.accounts.data &&
            this.props.accounts.data.id &&
            this.props.activeDomain &&
            this.props.activeDomain.data &&
            this.props.activeDomain.data.id &&
            this.props.activeDomain.data.google_ads_token
        ) {
            this.getAndSetCustomerClients(this.props.accounts.data.id, this.props.activeDomain.data.id);
        }
    };

    componentDidUpdate = preProps => {
        if (
            this.props.activeDomain &&
            this.props.activeDomain.data &&
            preProps.activeDomain &&
            preProps.activeDomain.data &&
            preProps.activeDomain.data.id !== this.props.activeDomain.data.id
        ) {
            this.setState({
                clients: [],
                error: {},
                success: {},
                loading: {}
            });
            if (this.props.activeDomain.data.google_ads_token) {
                this.getAndSetCustomerClients(this.props.accounts.data.id, this.props.activeDomain.data.id);
            }
        }
    };

    testGoogleAdsIntegration = async () => {
        const {
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                test: true
            }
        });
        try {
            const result = await GoogleAds.testGoogleAdsIntegration(activeDomain.data.id);
            if (result === 'Unauthorized') {
                await GoogleAds.refreshAccessToken(activeDomain.data.id);
                this.testGoogleAdsIntegration();
            } else {
                const {
                    resourceNames
                } = result;
                if (resourceNames) {
                    this.setState({
                        success: {
                            test: true
                        },
                        error: {},
                        loading: {
                            test: false
                        }
                    });
                } else {
                    throw Error(`No Accounts found.`);
                }
            }
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    test: error.message
                },
                loading: {
                    test: false
                }
            });
        }
    };

    disconnectClient = async clientRecordId => {
        const {
            loading
        } = this.state;
        if (loading.disconnect) {
            return;
        }
        const {
            accounts,
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                disconnect: true
            },
            disconnected: false
        });
        try {
            await GoogleAds.disconnectClient(clientRecordId);
            this.setState({
                disconnected: true
            });
            setTimeout(() => {
                this.setState({
                    success: {
                        disconnect: true
                    },
                    error: {},
                    loading: {
                        disconnect: false
                    },
                    clients: [],
                    showAdDisconnectConfirmation: false
                });
                this.getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
            }, 1500);
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    disconnect: error.message
                },
                loading: {
                    disconnect: false
                },
                showAdDisconnectConfirmation: false
            });
        }
    };

    disconnectDomain = async () => {
        console.log(this.props);
        const {
            loading
        } = this.state;
        if (loading.disconnect) {
            return;
        }

        const {
            accounts,
            activeDomain,
            fetchLatestAccount,
            setDomain
        } = this.props;
        this.setState({
            loading: {
                disconnect: true
            }
        });
        try {
            await GoogleAds.disconnectDomain(activeDomain.data.id);
            fetchLatestAccount(accounts.data.id);
            this.setState({
                loading: {
                    disconnect: false
                },
                error: {}
            });
            setDomain({ ...activeDomain.data,
                google_ads_token: null,
                google_email: null
            });
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    disconnectDomain: error.message
                },
                loading: {
                    disconnect: false
                }
            });
        }
    };

    disconnectGoogleAds = async (clearConnection = false) => {
        console.log(this.props);
        const {
            loading
        } = this.state;
        if (loading.disconnectingAds) {
            return;
        }

        const {
            accounts,
            activeDomain,
            fetchLatestAccount,
            setDomain,
            auth
        } = this.props;
        this.setState({
            loading: {
                disconnectingAds: true
            }
        });
        try {
            if (clearConnection) {
                await GoogleAds.clearConnection(activeDomain.data.id);
            } else {
                await GoogleAds.disconnectGoogleAds(this.state.email || auth.user.email);
            }
            fetchLatestAccount(accounts.data.id);
            this.setState({
                loading: {
                    disconnectingAds: false
                },
                error: {},
                showConnectionRemoveConfirmation: false
            });
            if (clearConnection) {
                setDomain({
                    ...activeDomain.data,
                    google_ads_token: null,
                    google_email: null,
                    oauth_problem: false,
                    mcc_manager_id: null,
                    mcc_link_id: null
                });
            } else {
                setDomain({ ...activeDomain.data,
                    google_ads_token: null,
                    google_email: null
                });
            }
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    disconnectDomain: error.message
                },
                loading: {
                    disconnectingAds: false
                },
                showConnectionRemoveConfirmation: false
            });
        }
    };

    redirectToDomain = (domainId) => {
        const domain = this.props.accounts.data.domains.find(dom => dom.id === domainId);
        this.props.setDomain(domain);
    };

    connectAccount = async client => {
        const {
            loading
        } = this.state;
        if (loading.connect) {
            return;
        }
        const {
            accounts,
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                connect: `${client.customerClient.id}${client.managerId}`
            }
        });
        try {
            await GoogleAds.connectClient({
                customer_account: client.customerClient,
                account_id: accounts.data.id,
                domain_id: activeDomain.data.id,
                customer_id: client.customerId,
                manager_id: client.managerId
            });
            setTimeout(() => {
                this.setState({
                    success: {
                        connect: true
                    },
                    error: {},
                    loading: {
                        connect: false
                    }
                });
                this.getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
                window.Intercom('trackEvent', 'connect_adwords', {
                    domain: activeDomain.data.domain_name
                });
            }, 2000);
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    connect: error.message.includes('already') ? (
                        <span>
                            This Google Ads Account is already connected to another domain name{' '}
                            <button
                                className={`${styles.linkedDomainWithGoogle} ${styles.linkButton}`} 
                                onClick={() => this.redirectToDomain(error.message.split('domainId:')[1])}
                            >
                                here
                            </button>
                            . Please select a different account.
                        </span>
                    ) : error.message
                },
                loading: {
                    connect: false
                }
            });
        }
    };

    openManagerDesc = () => {
        this.setState({
            showMangerDesc: !this.state.showMangerDesc
        });
    };

    toggleAdDisconnectionConfirmation = (clientRecordId = null) => {
        this.setState({
            showAdDisconnectConfirmation: clientRecordId
        })
    };

    toggleConnectionRemovalConfirmation = () => {
        this.setState({
            showConnectionRemoveConfirmation: !this.state.showConnectionRemoveConfirmation
        })
    };

    render() {
        const { loading, error, clients } = this.state;
        const { activeDomain } = this.props;
        const connected = activeDomain?.data?.google_ads_token;

        return (
            <div className={styles.content}>
                <h1 className={styles.title}>Google Ads Setup</h1>
                <p>
                    In order for us to block the fraudulent clicks coming from your Google Ads campaigns, 
                    you will need to provide us access to your Google Ads account so we can import any 
                    fraudulent IP addresses in real time.
                </p>
                <br />

                {!connected && (
                    <>
                        <h3 style={customStyles.subTitle} className={styles.subTitle}>
                            Connect Google Ads
                        </h3>
                        <p>
                            Press the button below to send a request to Google Ads for us to access your account.
                        </p>
                        <div className={styles.googleLoginContainer}>
                            <GoogleLogin
                                onSuccess={credentialResponse => {
                                    this.onGoogleLoginResponse({
                                        code: credentialResponse.credential
                                    });
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                useOneTap
                                scope="https://www.googleapis.com/auth/adwords"
                                type="standard"
                                theme="filled_blue"
                                text="signin_with"
                                shape="rectangular"
                                logo_alignment="left"
                            />
                        </div>
                    </>
                )}

                {((connected && clients.length === 0 && !loading.clients && !error.connect) || 
                  (error.authorize && (error.authorize.includes('Refresh token not available') || 
                   error.authorize.includes('no customers')))) && (
                    <>
                        <h3 style={customStyles.subTitle} className={styles.subTitle}>
                            <img src={ConnectionErrorIcon} alt="error" />
                            {' '}There is an issue with your Google Ads connection
                        </h3>
                        {error.authorize && error.authorize.includes('no customers') ? (
                            <p>
                                This Google Ads account does not have any campaigns created. 
                                Please remove your connection and sign in to a different Google Ads account.
                            </p>
                        ) : (
                            <p>
                                We were unable to fetch your Google Ads customer account with the authorization provided. 
                                This means that we cannot sync your blocked IPs to your campaigns. 
                                This may have been any issue with your cache. 
                                Please remove your connection and try again.
                            </p>
                        )}
                        <Button
                            customClassNames={styles.removeConnectionBtn}
                            title="Remove Connection"
                            color="outline-red"
                            loading={loading.disconnectingAds}
                            onClick={() => this.disconnectGoogleAds(true)}
                        />
                        <p style={{marginBottom: '20px'}}>
                            Still have trouble?{' '}
                            <a 
                                className={styles.blueLink}
                                href="https://fraudblocker.com/contact-us"
                                rel="noreferrer noopener"
                                target="_blank"
                            >
                                Contact us
                            </a>
                        </p>
                        {error.disconnectDomain && (
                            <ErrorBox error={error.disconnectDomain} />
                        )}
                    </>
                )}

                {!loading.clients && connected && clients.length > 0 && (
                    <div className={styles.connectedWrap}>
                        <img src={DriveIcon} alt="drive icon" className={styles.driveIcon} />
                        <div className={styles.connectedText}>
                            {/* ... rest of connected account display ... */}
                        </div>
                    </div>
                )}

                {/* Manager Accounts Section */}
                <div className={styles.managerAdsSec}>
                    <div 
                        className={styles.secHeading}
                        onClick={this.openManagerDesc}
                    >
                        For "Manager" Accounts ("MCC")
                        <span className={`${styles.icon} ${this.state.showMangerDesc ? 'active' : ''}`}>
                            <img src={ArrowRight} alt="arrow" />
                        </span>
                    </div>

                    <div className={`${styles.managerAdsDesc} ${this.state.showMangerDesc ? 'active' : ''}`}>
                        <div className={styles.managerAdsInner}>
                            <p>
                                You must first join our Manager Account before you can connect to your customer accounts. 
                                Please send an invite by entering your MCC Account number below.
                            </p>
                            <div className={styles.mangerAccountForm}>
                                <Input
                                    style={customStyles.mccInput}
                                    placeholder="Account #"
                                    value={this.state.managerAccountId}
                                    onChange={this.handleManagerAccountChange}
                                />
                                <button
                                    onClick={this.sendInvitation}
                                    className={styles.sendInviteBtn}
                                    disabled={loading.manager}
                                    type="button"
                                >
                                    Send Manager Invite
                                </button>
                                {this.state.invited && (
                                    <span style={customStyles.invited}>✓ Invitation Sent</span>
                                )}
                            </div>
                            {error.manager && <ErrorBox error={error.manager} />}
                        </div>
                    </div>
                </div>

                {/* Why We Need This Section */}
                <h3 style={customStyles.subTitle} className={styles.subTitle}>
                    Why We Need This
                </h3>
                <p>
                    By providing us access to your Google Ads account, we can import any fraudulent IP 
                    Addresses we detect directly to your Google Ads account in real time. Without this access 
                    you will be unable to automatically block bad clicks from your account. Our software does 
                    not edit or change any other elements of your Google Ad campaigns.
                </p>

                {/* About Your Security Section */}
                <h3 style={customStyles.subTitle} className={styles.subTitle}>
                    About Your Security
                </h3>
                <p>
                    Our mission is to protect our clients from the rampant ad fraud occurring on the internet today. 
                    We also aim to provide more transparency with our service with access to detailed fraud reporting 
                    and analytics. We have taken steps and put security measures in place to protect your data. 
                    Learn more in our{' '}
                    <a 
                        href="https://fraudblocker.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>

                {loading.connect && (
                    <Spinner fadeIn="none" name="ball-clip-rotate" color="#17d281" />
                )}

                {this.state.showAdDisconnectConfirmation && (
                    <ConfirmAccountDisconnectionModal
                        isLoading={loading.disconnect}
                        type="google"
                        recordId={this.state.showAdDisconnectConfirmation}
                        onConfirm={this.disconnectClient}
                        onCancel={this.toggleAdDisconnectionConfirmation}
                    />
                )}
            </div>
        );
    }
}

GoogleAdsSetup.propTypes = {
    accounts: PropTypes.object,
    setDomain: PropTypes.func,
    auth: PropTypes.object,
    activeDomain: PropTypes.object,
    fetchLatestAccount: PropTypes.func
};

const mapStateToProps = state => ({
    accounts: state.accounts,
    auth: state.auth,
    activeDomain: state.activeDomain
});

const mapDispatchToProps = dispatch => {
    return {
        setDomain: domain => dispatch(ActiveDomain.setDomainActive(domain)),
        fetchLatestAccount: accountId => dispatch(Account.fetchLatestAccount(accountId))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(GoogleAdsSetup);