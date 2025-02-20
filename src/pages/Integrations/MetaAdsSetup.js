import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-spinkit';
import {
    connect
} from 'react-redux';
import {
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import styles from './Integrations.module.scss';
// import Button from '../../components/Button/Button';
import MetaAds from '../../api/MetaAds';
// import SuccessBox from '../../components/SuccessBox/SuccessBox';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import ActiveDomain from '../../redux/actions/ActiveDomain';
import Input from '../../components/Input/Input';
import Account from '../../redux/actions/Account';
import MetaIcon from '../../assets/meta-ads-icon.png';
import FacebookLoginIcon from '../../assets/facebook-login.svg';
import CheckIcon from '../../assets/connected.svg';
import BlueWarningIcon from '../../assets/blue-warn.svg';
import ConnectionErrorIcon from '../../assets/google-connection-error.svg';
import RefreshIcon from '../../assets/refresh.svg';
import Button from '../../components/Button/Button';
import Switch from '../../components/Switch/Switch';

const customStyles = {
    subTitle: {
        marginTop: 40
    },
    connectBtn: {
        maxWidth: 350,
        marginTop: 20,
        marginBottom: 20
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
    },
    fbIcon: {
        verticalAlign: 'middle',
        paddingRight: '5px'
    }
};
class MetaAdsSetup extends PureComponent {
    state = {
        loading: {},
        success: {},
        status: 'all',
        adName: '',
        error: {},
        fbUserDetails: {},
        pixels: [],
        adSets: [],
        areAllAdsConnected: false,
        filteredAdSets: [],
        invited: false,
        managerAccountId: '',
        showMangerDesc: false
    };

    applyFilters = adSets => {
        console.log('adsets', adSets);
        if (!adSets.length) {
            return [];
        }
        const filtered = adSets.filter(adSet => {
            const {
                adName,
                status
            } = this.state;
            return (
                (adSet.name || '').toLowerCase().includes(adName.toLowerCase()) &&
                (status === 'all' ? true : status === 'connected' ? adSet.connected : !adSet.connected)
            );
        });

        console.log('filtered', filtered);
        this.setState({
            filteredAdSets: filtered
        });
        return null;
    };

    handleAdNameFilterChange = e => {
        this.setState({
            adName: e.target.value
        }, () => this.applyFilters(this.state.adSets));
    };

    handleStatusFilterChange = e => {
        this.setState({
            status: e.target.value
        }, () => this.applyFilters(this.state.adSets));
    };

    getAndSetCustomerAdSets = async (
        pixels,
        accessToken,
        accountId,
        domainId,
        isRefreshing = false
    ) => {
        try {
            const connectedPixels = pixels.filter(pix => pix.connected === true);
            if (!connectedPixels.length) {
                return;
            }
            this.setState({
                loading: { ...this.state.loading,
                    adSets: true,
                    isRefreshing
                }
            });
            // This was breaking the loop because it was making an array of arrays
            const adSetsResult = await Promise.all(
                connectedPixels.map(pixel =>
                    MetaAds.getAccountAdSets(accessToken, pixel.accountId, accountId, domainId, pixel.pixelId)
                )
            );
            console.log('Account Adsets', adSetsResult);
            const adSetsFlattern = adSetsResult.flat();
            this.setState({
                adSets: adSetsFlattern,
                areAllAdsConnected: adSetsFlattern.filter(ad => !ad.connected).length === 0,
                loading: { ...this.state.loading,
                    adSets: false,
                    isRefreshing: false
                }
            });
            this.applyFilters(adSetsFlattern);
        } catch (error) {
            this.setState({
                error: {
                    authorize: error.message
                },
                loading: { ...this.state.loading,
                    adSets: false,
                    isRefreshing: false
                }
            });
        }
    };

    getAndSetPixels = async (accessToken, accountId, domainId, keepResults = false) => {
        console.log(accessToken);
        try {
            this.setState({
                loading: { ...this.state.loading,
                    pixels: !keepResults
                },
                error: { ...this.state.error,
                    pixels: ''
                }
            });
            const pixelsResult = await MetaAds.getPixels(accessToken, accountId, domainId);
            console.log('Connected Clients', pixelsResult);
            this.setState({
                pixels: pixelsResult,
                loading: { ...this.state.loading,
                    pixels: false
                }
            });
            // this.applyFilters(pixelsResult);
            if (pixelsResult.length) {
                this.getAndSetCustomerAdSets(pixelsResult, accessToken, accountId, domainId);
            }
        } catch (error) {
            this.setState({
                error: {
                    pixels: error.message
                },
                loading: { ...this.state.loading,
                    pixels: false
                }
            });
        }
    };

    refreshAdSets = () => {
        if (this.state.pixels.length) {
            this.getAndSetCustomerAdSets(
                this.state.pixels,
                this.props.activeDomain.data.meta_ads_token,
                this.props.accounts.data.id,
                this.props.activeDomain.data.id,
                true
            );
        }
    };

    getFbUserDetails = async (accessToken, metaUserId) => {
        try {
            const fbUser = await MetaAds.getFbUserDetails(accessToken, metaUserId);
            if (fbUser) {
                this.setState({
                    fbUserDetails: fbUser
                });
            }
        } catch (error) {
            console.log('Could not get fb user details', error.message);
        }
    };

    onFacebookLoginResponse = async response => {
        const {
            accounts,
            setDomain,
            activeDomain,
            fetchLatestAccount
        } = this.props;

        console.log('onFacebookLoginResponse', response);
        await MetaAds.postDebug('onFacebookLoginResponse', response);
        if (response.status === 'connected') {
            try {
                const authUserResult = await MetaAds.authorizeUser({
                    accessToken: response.authResponse.accessToken,
                    metaUserId: response.authResponse.userID,
                    domainId: activeDomain.data.id,
                    accountId: accounts.data.id
                });
                console.log('authUserResult', authUserResult);
                if (authUserResult) {
                    window.Intercom('trackEvent', 'connect_oauth', {
                        domain: activeDomain.data.domain_name,
                        meta: true
                    });
                    this.getAndSetPixels(authUserResult.access_token, accounts.data.id, activeDomain.data.id);
                    this.getFbUserDetails(authUserResult.access_token, response.authResponse.userID);
                    fetchLatestAccount(accounts.data.id);
                    setDomain({
                        ...activeDomain.data,
                        meta_ads_token: authUserResult.access_token,
                        meta_user_id: response.authResponse.userID
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
            this.props.activeDomain.data.meta_ads_token
        ) {
            this.getAndSetPixels(
                this.props.activeDomain.data.meta_ads_token,
                this.props.accounts.data.id,
                this.props.activeDomain.data.id
            );
            this.getFbUserDetails(
                this.props.activeDomain.data.meta_ads_token,
                this.props.activeDomain.data.meta_user_id
            );
        }
        // window.FB.XFBML.parse();
        // window.FB.getLoginStatus(function(response) {
        //   console.log(response);
        //   // statusChangeCallback(response);
        // });
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
                pixels: [],
                adSets: [],
                error: {},
                success: {},
                loading: {}
            });
            if (this.props.activeDomain.data.meta_ads_token) {
                this.getAndSetPixels(
                    this.props.activeDomain.data.meta_ads_token,
                    this.props.accounts.data.id,
                    this.props.activeDomain.data.id
                );
                this.getFbUserDetails(
                    this.props.activeDomain.data.meta_ads_token,
                    this.props.activeDomain.data.meta_user_id
                );
            }
        }
    };

    disconnectPixel = async pixel => {
        const {
            loading
        } = this.state;
        if (loading.disconnect) {
            return;
        }
        const {
            activeDomain,
            accounts
        } = this.props;
        this.setState({
            loading: {
                disconnect: true
            },
            disconnected: false
        });
        try {
            await MetaAds.disconnectPixel(pixel.recordId);
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
                    }
                });
                this.getAndSetPixels(
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
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
                }
            });
        }
    };

    disconnectAdSet = async adSet => {
        const {
            loading,
            pixels
        } = this.state;
        if (loading.disconnectAdSet) {
            return;
        }
        const {
            activeDomain,
            accounts
        } = this.props;
        this.setState({
            loading: {
                disconnectAdSet: adSet.recordId
            }
        });
        try {
            await MetaAds.disconnectAdSet(adSet.recordId);
            setTimeout(() => {
                this.setState({
                    success: {
                        disconnectAdSet: true
                    },
                    error: {},
                    loading: {
                        disconnectAdSet: null
                    }
                });
                this.getAndSetCustomerAdSets(
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
            }, 1500);
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    disconnectAdSet: error.message
                },
                loading: {
                    disconnectAdSet: null
                }
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
            try {
                window.FB.logout(response => {
                    console.log('Logged out from FB', response);
                });
            } catch (err) {
                console.log('User is not in logged in state so logout is not required');
            }

            await MetaAds.disconnectDomain(activeDomain.data.id);
            fetchLatestAccount(accounts.data.id);
            this.setState({
                loading: {
                    disconnect: false
                },
                error: {}
            });
            setDomain({ ...activeDomain.data,
                meta_ads_token: null
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

    connectPixel = async pixel => {
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
                connect: pixel.pixelId
            }
        });
        try {
            await MetaAds.connectPixel({
                access_token: activeDomain.data.meta_ads_token,
                account_id: accounts.data.id,
                domain_id: activeDomain.data.id,
                meta_pixel_id: pixel.pixelId,
                meta_adaccount_id: pixel.accountId,
                meta_pixel_details: pixel.details
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
                this.getAndSetPixels(
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                window.Intercom('trackEvent', 'connect_adwords', {
                    domain: activeDomain.data.domain_name,
                    meta: true
                });
            }, 2000);
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    connect: error.message.toLowerCase().includes('terms') ||
                        error.message.toLowerCase().includes('permission') ?
                        `terms-${pixel.accountId.includes('act_')
                ? pixel.accountId.split('act_')[1]
                : pixel.accountId
              }` :
                        error.message
                },
                loading: {
                    connect: false
                }
            });
        }
    };

    connectAdSet = async adSet => {
        const {
            loading,
            pixels
        } = this.state;
        if (loading.connectAdSet) {
            return;
        }
        const {
            accounts,
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                connectAdSet: adSet.id
            }
        });
        try {
            const pixel = pixels.find(item => item.pixelId === adSet.pixelId);
            await MetaAds.connectAdSet({
                account_id: accounts.data.id,
                access_token: activeDomain.data.meta_ads_token,
                audience_id: pixel.audienceId,
                domain_id: activeDomain.data.id,
                meta_pixel_id: adSet.pixelId,
                meta_adaccount_id: adSet.accountId,
                meta_adset_id: adSet.id,
                meta_adset_details: adSet.details
            });
            setTimeout(() => {
                this.setState({
                    success: {
                        connectAdSet: true
                    },
                    error: {},
                    loading: {
                        connectAdSet: false
                    }
                });
                this.getAndSetCustomerAdSets(
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                window.Intercom('trackEvent', 'connect_adwords', {
                    domain: activeDomain.data.domain_name,
                    meta: true
                });
            }, 2000);
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    connectAdSet: error.message
                },
                loading: {
                    connectAdSet: false
                }
            });
        }
    };

    connectAllAdSets = async () => {
        const {
            loading,
            pixels,
            adSets
        } = this.state;
        const disconnectedAdsets = adSets.filter(adSet => !adSet.connected);
        if (loading.connectAdSet || !disconnectedAdsets.length) {
            return;
        }
        const {
            accounts,
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                connectAdSet: 'all'
            }
        });
        try {
            const promises = disconnectedAdsets.map(adSet => {
                const pixel = pixels.find(item => item.pixelId === adSet.pixelId);
                return MetaAds.connectAdSet({
                    account_id: accounts.data.id,
                    access_token: activeDomain.data.meta_ads_token,
                    audience_id: pixel.audienceId,
                    domain_id: activeDomain.data.id,
                    meta_pixel_id: adSet.pixelId,
                    meta_adaccount_id: adSet.accountId,
                    meta_adset_id: adSet.id,
                    meta_adset_details: adSet.details
                });
            });

            const results = await Promise.allSettled(promises);
            const errored = results.filter(result => result.status === 'rejected');
            if (errored.length < results.length) {
                this.setState({
                    success: {
                        connectAdSet: true
                    },
                    error: {},
                    loading: {
                        connectAdSet: false
                    }
                });
                this.getAndSetCustomerAdSets(
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                window.Intercom('trackEvent', 'connect_adwords', {
                    domain: activeDomain.data.domain_name,
                    meta: true
                });
            } else {
                throw new Error(errored[0].reason);
            }
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    connectAdSet: error.message
                },
                loading: {
                    connectAdSet: false
                }
            });
        }
    };

    disconnectAllAdSets = async () => {
        const {
            loading,
            pixels,
            adSets
        } = this.state;
        const connectedAdsets = adSets.filter(adSet => adSet.connected);
        if (loading.disconnectAdSet || !connectedAdsets.length) {
            return;
        }
        const {
            accounts,
            activeDomain
        } = this.props;
        this.setState({
            loading: {
                disconnectAdSet: 'all'
            }
        });
        try {
            const promises = connectedAdsets.map(adSet => {
                return MetaAds.disconnectAdSet(adSet.recordId);
            });

            await Promise.all(promises);
            this.setState({
                success: {
                    disconnectAdSet: true
                },
                error: {},
                loading: {
                    disconnectAdSet: null
                }
            });
            this.getAndSetCustomerAdSets(
                pixels,
                activeDomain.data.meta_ads_token,
                accounts.data.id,
                activeDomain.data.id
            );
        } catch (error) {
            console.log(error.message);
            this.setState({
                success: {},
                error: {
                    disconnectAdSet: error.message
                },
                loading: {
                    disconnectAdSet: null
                }
            });
        }
    };

    openManagerDesc = () => {
        this.setState({
            showMangerDesc: !this.state.showMangerDesc
        });
    };

    render() {
            const {
                loading,
                // success,
                // disconnected,
                error,
                pixels,
                adSets,
                filteredAdSets,
                adName,
                status,
                areAllAdsConnected,
                fbUserDetails
            } = this.state;
            const {
                activeDomain
            } = this.props;
            const connected = activeDomain && activeDomain.data && activeDomain.data.meta_ads_token;

            return ( <
                    div className = {
                        styles.content
                    } >
                    <
                    h1 className = {
                        styles.title
                    } > Meta Ads Setup < /h1> <
                    p >
                    In order
                    for us to block the fraudulent users coming from your Facebook and Instagram campaigns, you will need to provide us access to your Meta Ads account.By doing so, we will add those users to an audience list which will be excluded from the Ad Sets you select. <
                    /p> <
                    p className = {
                        styles.metaNote
                    } >
                    <
                    img src = {
                        BlueWarningIcon
                    }
                    /> <
                    strong > Connection Requirements - < /strong>These items are required before proceeding: <
                    ul className = {
                        styles.metaChecklist
                    } >
                    <
                    li >
                    A < strong > Meta Business Account - < /strong>You can only connect to ad accounts that
                    belong to a Meta Business Account; you can & apos; t link personal ad accounts.Instructions to create a Meta Business Account are {
                        ' '
                    } <
                    a href = "https://www.facebook.com/business/help/1710077379203657?id=180505742745347"
                    rel = "noopener noreferrer"
                    target = "_blank" >
                    here <
                    /a>
                    . <
                    /li> <
                    li >
                    A < strong > Meta Pixel - < /strong>You must have a Meta Pixel on your website.
                    Instructions to create a Meta Pixel are {
                        ' '
                    } <
                    a href = "https://www.facebook.com/business/help/952192354843755"
                    target = "_blank"
                    rel = "noopener noreferrer" >
                    here <
                    /a>
                    . <
                    /li> <
                    /ul> <
                    /p> <
                    br / > {!connected && ( <
                            >
                            <
                            h3 style = {
                                customStyles.subTitle
                            }
                            className = {
                                styles.subTitle
                            } >
                            Connect Meta Ads <
                            /h3> <
                            p >
                            Sign in to your Meta Ads account.You will then be directed to select a Pixel and Ad Set(s). <
                            /p> <
                            div className = {
                                styles.googleLoginContainer
                            } >
                            <
                            Button customClassNames = {
                                styles.fbButton
                            }
                            title = { <
                                div >
                                <
                                img
                                style = {
                                    {
                                        verticalAlign: 'middle',
                                        paddingRight: '10px',
                                        width: '14px',
                                        height: '14px'
                                    }
                                }
                                src = {
                                    FacebookLoginIcon
                                }
                                alt = "fb-icon" /
                                >
                                Sign In With Facebook <
                                /div>
                            }
                            onClick = {
                                () =>
                                window.FB.login(this.onFacebookLoginResponse, {
                                    config_id: '962911285215382'
                                })
                            }
                            /> <
                            /div> {
                                error.authorize && < ErrorBox error = {
                                    error.authorize
                                }
                                />} <
                                />
                            )
                        }

                        {
                            connected && ( <
                                >
                                <
                                h3 style = {
                                    customStyles.subTitle
                                }
                                className = {
                                    styles.subTitle
                                } >
                                Connect Meta Ads <
                                /h3> <
                                p >
                                Sign in to your Meta Ads account.You will then be directed to select a Pixel and Ad Set(s). <
                                /p> <
                                div className = {
                                    `${styles.googleLoginContainer} ${styles.linkDifferent}`
                                } >
                                <
                                Button customClassNames = {
                                    styles.fbButton
                                }
                                title = { <
                                    div >
                                    <
                                    img
                                    style = {
                                        {
                                            verticalAlign: 'middle',
                                            paddingRight: '10px',
                                            width: '14px',
                                            height: '14px'
                                        }
                                    }
                                    src = {
                                        FacebookLoginIcon
                                    }
                                    alt = "fb-icon" /
                                    >
                                    Link a Different Account <
                                    /div>
                                }
                                onClick = {
                                    () =>
                                    window.FB.login(this.onFacebookLoginResponse, {
                                        config_id: '962911285215382'
                                    })
                                }
                                /> {
                                    fbUserDetails && false && ( <
                                        div className = {
                                            styles.fbUserDetails
                                        } > {
                                            fbUserDetails.picture && ( <
                                                div className = {
                                                    styles.fbUserPhoto
                                                }
                                                style = {
                                                    {
                                                        backgroundImage: `url(${fbUserDetails.picture.url})`
                                                    }
                                                } >
                                                < /div>
                                            )
                                        } <
                                        div className = {
                                            styles.fbNameAndPage
                                        } > {
                                            fbUserDetails.name && ( <
                                                div className = {
                                                    styles.fbUserName
                                                } >
                                                <
                                                strong > {
                                                    fbUserDetails.name
                                                } < /strong> <
                                                /div>
                                            )
                                        } {
                                            fbUserDetails.pages && fbUserDetails.pages.length && ( <
                                                div className = {
                                                    styles.fbUserPages
                                                } >
                                                <
                                                strong > Active Pages: < /strong> {fbUserDetails.pages.map(page => page.name)} <
                                                /div>
                                            )
                                        } <
                                        /div> <
                                        /div>
                                    )
                                } <
                                /div> {
                                    error.authorize && < ErrorBox error = {
                                        error.authorize
                                    }
                                    />} {
                                        !error.pixels && ( <
                                            >
                                            <
                                            div className = {
                                                styles.accountsHeader
                                            } >
                                            <
                                            h3 style = {
                                                customStyles.subTitle
                                            }
                                            className = {
                                                styles.subTitle
                                            } >
                                            Select Pixel < span className = {
                                                styles.required
                                            } > (Required) < /span> <
                                            div className = {
                                                styles.pixelDescription
                                            } >
                                            Select Facebook pixel(s) associated with your account. <
                                            /div> <
                                            /h3> <
                                            /div> {
                                                pixels.length > 0 &&
                                                    pixels.map((pixel, index) => ( <
                                                        div className = {
                                                            loading.connect === pixel.pixelId ? styles.fadingIn : ''
                                                        }
                                                        key = {
                                                            pixel.pixelId
                                                        }
                                                        style = {
                                                            {
                                                                animationDelay: loading.connect === pixel.pixelId ? '0.3s' : `${(index + 1) * 0.3}s`
                                                            }
                                                        } >
                                                        <
                                                        div className = {
                                                            styles.connectedWrap
                                                        } >
                                                        <
                                                        img src = {
                                                            MetaIcon
                                                        }
                                                        alt = "meta icon"
                                                        width = {
                                                            42
                                                        }
                                                        height = {
                                                            21
                                                        }
                                                        /> <
                                                        div className = {
                                                            styles.connectedText
                                                        } >
                                                        <
                                                        div className = {
                                                            styles.connectedEmail
                                                        } > {
                                                            pixel.pixelName
                                                        } < /div> <
                                                        /div> {
                                                            pixel.connected ? ( <
                                                                div className = {
                                                                    styles.connectedRight
                                                                } >
                                                                <
                                                                div className = {
                                                                    styles.connectedBtn
                                                                } >
                                                                <
                                                                img src = {
                                                                    CheckIcon
                                                                }
                                                                alt = "connected" / >
                                                                Connected <
                                                                /div> <
                                                                div className = {
                                                                    styles.disconnectWrap
                                                                } >
                                                                <
                                                                div onClick = {
                                                                    () => this.disconnectPixel(pixel)
                                                                }
                                                                className = {
                                                                    styles.disconnectBtn
                                                                } >
                                                                {
                                                                    loading.disconnect ? 'Removing...' : 'Remove This Pixel'
                                                                } <
                                                                /div> <
                                                                /div> <
                                                                /div>
                                                            ) : ( <
                                                                div onClick = {
                                                                    () => this.connectPixel(pixel)
                                                                }
                                                                className = {
                                                                    styles.connectBtn
                                                                } >
                                                                {
                                                                    loading.connect === pixel.pixelId ? ( <
                                                                        Spinner fadeIn = "none"
                                                                        name = "ball-clip-rotate"
                                                                        color = "#17d281" / >
                                                                    ) : (
                                                                        'Connect This Pixel'
                                                                    )
                                                                } <
                                                                /div>
                                                            )
                                                        } <
                                                        /div> <
                                                        div style = {
                                                            customStyles.divider
                                                        }
                                                        /> <
                                                        /div>
                                                    ))
                                            } {
                                                pixels.length === 0 && !loading.pixels && ( <
                                                    div className = {
                                                        styles.pixelsError
                                                    } >
                                                    <
                                                    img src = {
                                                        ConnectionErrorIcon
                                                    }
                                                    />
                                                    No pixel found.Please & nbsp; <
                                                    a href = "https://www.facebook.com/business/help/952192354843755"
                                                    target = "_blank"
                                                    rel = "noopener noreferrer" >
                                                    create a pixel <
                                                    /a> &
                                                    nbsp; in your & nbsp; < strong > Meta Business Account < /strong> <
                                                    /div>
                                                )
                                            } <
                                            />
                                        )
                                    } <
                                    />
                                )
                            }

                            {
                                connected && adSets.length > 0 && ( <
                                    >
                                    <
                                    div className = {
                                        `${styles.accountsHeader} ${styles.metaAccountsHeader}`
                                    } >
                                    <
                                    section className = {
                                        styles.adsHeader
                                    } >
                                    <
                                    h3 style = {
                                        customStyles.subTitle
                                    }
                                    className = {
                                        styles.subTitle
                                    } >
                                    Select Ad Set < span className = {
                                        styles.required
                                    } > (Required) < /span> <
                                    div className = {
                                        styles.pixelDescription
                                    } >
                                    Select the Ad Set(s) you’ d like to protect.Note: Meta will place your ads back into review. < a href = "https://help.fraudblocker.com/en/articles/9043929-how-do-i-connect-my-facebook-ads-meta-ads-account"
                                    target = '_blank'
                                    rel = "noopener noreferrer" > Read more. < /a> <
                                    /div> <
                                    /h3> <
                                    div className = {
                                        styles.refreshAds
                                    }
                                    onClick = {
                                        this.refreshAdSets
                                    } >
                                    Refresh Ad Sets {
                                        ' '
                                    } <
                                    img className = {
                                        loading.isRefreshing ? styles.refreshing : ''
                                    }
                                    src = {
                                        RefreshIcon
                                    }
                                    alt = "refresh" /
                                    >
                                    <
                                    /div> <
                                    /section> <
                                    div className = {
                                        styles.searchWrap
                                    } >
                                    Filter <
                                    Input placeholder = "Ad Set Name"
                                    onChange = {
                                        this.handleAdNameFilterChange
                                    }
                                    value = {
                                        adName
                                    }
                                    name = "ad_set_filter"
                                    style = {
                                        {
                                            marginLeft: '10px'
                                        }
                                    }
                                    /> <
                                    ToggleButtonGroup className = {
                                        styles.filtersToggleGroup
                                    }
                                    color = "primary"
                                    value = {
                                        status
                                    }
                                    exclusive onChange = {
                                        this.handleStatusFilterChange
                                    }
                                    aria - label = "Status" >
                                    <
                                    ToggleButton value = "all" > Show All < /ToggleButton> <
                                    ToggleButton value = "connected" > Connected < /ToggleButton> <
                                    ToggleButton value = "disconnected" > Not Connected < /ToggleButton> <
                                    /ToggleButtonGroup> <
                                    div className = {
                                        styles.connectAll
                                    } > {
                                        areAllAdsConnected ? 'Disconnect All' : 'Connect All'
                                    } {
                                        ' '
                                    } <
                                    Switch className = {
                                        styles.connectAllToggle
                                    }
                                    onColor = {
                                        '#17D384'
                                    }
                                    disabled = {
                                        loading.connectAdSet || loading.disconnectAdSet
                                    }
                                    onChange = {
                                        () =>
                                        !areAllAdsConnected ? this.connectAllAdSets() : this.disconnectAllAdSets()
                                    }
                                    checked = {
                                        areAllAdsConnected
                                    }
                                    /> <
                                    /div> <
                                    /div> <
                                    /div> {
                                        filteredAdSets.map((client, index) => ( <
                                            div className = {
                                                loading.connectAdSet === client.id || loading.connectAdSet === 'all' ?
                                                styles.fadingIn :
                                                    ''
                                            }
                                            key = {
                                                client.id
                                            }
                                            style = {
                                                {
                                                    animationDelay: loading.connectAdSet === client.id || loading.connectAdSet === 'all' ?
                                                        '0.3s' :
                                                        `${(index + 1) * 0.3}s`
                                                }
                                            } >
                                            <
                                            div className = {
                                                styles.connectedWrap
                                            } >
                                            <
                                            img src = {
                                                MetaIcon
                                            }
                                            alt = "meta icon"
                                            width = {
                                                42
                                            }
                                            height = {
                                                21
                                            }
                                            /> <
                                            div className = {
                                                styles.connectedText
                                            } >
                                            <
                                            div className = {
                                                styles.connectedEmail
                                            } > {
                                                client.name
                                            } < /div> <
                                            /div> {
                                                client.connected ? ( <
                                                    div className = {
                                                        styles.connectedRight
                                                    } >
                                                    <
                                                    div className = {
                                                        styles.connectedBtn
                                                    } >
                                                    <
                                                    img src = {
                                                        CheckIcon
                                                    }
                                                    alt = "connected" / >
                                                    Connected <
                                                    /div> <
                                                    div className = {
                                                        styles.disconnectWrap
                                                    } >
                                                    <
                                                    div onClick = {
                                                        () => this.disconnectAdSet(client)
                                                    }
                                                    className = {
                                                        styles.disconnectBtn
                                                    } >
                                                    {
                                                        loading.disconnectAdSet === client.recordId ||
                                                        loading.disconnectAdSet === 'all' ?
                                                        'Disconnecting...' :
                                                            'Disconnect This Ad Set'
                                                    } <
                                                    /div> <
                                                    /div> <
                                                    /div>
                                                ) : ( <
                                                    div onClick = {
                                                        () => this.connectAdSet(client)
                                                    }
                                                    className = {
                                                        styles.connectBtn
                                                    } > {
                                                        loading.connectAdSet === client.id || loading.connectAdSet === 'all' ? ( <
                                                            Spinner fadeIn = "none"
                                                            name = "ball-clip-rotate"
                                                            color = "#17d281" / >
                                                        ) : (
                                                            'Connect This Ad Set'
                                                        )
                                                    } <
                                                    /div>
                                                )
                                            } <
                                            /div> <
                                            div style = {
                                                customStyles.divider
                                            }
                                            /> <
                                            /div>
                                        ))
                                    } <
                                    />
                                )
                            }

                            {
                                loading.pixels && ( <
                                    div className = {
                                        `${styles.clientsLoader} ${styles.fadingIn}`
                                    } >
                                    <
                                    Spinner fadeIn = "linear"
                                    name = "ball-clip-rotate"
                                    color = "#17d281" / >
                                    <
                                    /div>
                                )
                            }

                            {
                                loading.adSets && adSets.length === 0 && ( <
                                    div className = {
                                        `${styles.clientsLoader} ${styles.fadingIn}`
                                    } >
                                    <
                                    Spinner fadeIn = "linear"
                                    name = "ball-clip-rotate"
                                    color = "#17d281" / >
                                    <
                                    /div>
                                )
                            }

                            {
                                error.connect && !error.connect.includes('terms') && < ErrorBox error = {
                                    error.connect
                                }
                                />} {
                                    error.connect && error.connect.includes('terms') && ( <
                                        div className = {
                                            styles.audienceError
                                        } >
                                        <
                                        img src = {
                                            BlueWarningIcon
                                        }
                                        />
                                        Please accept & nbsp; <
                                        a style = {
                                            {
                                                color: '#286CFF'
                                            }
                                        }
                                        href = {
                                            `https://business.facebook.com/ads/manage/customaudiences/tos/?business_id=${error.connect.split('-')[1]
                }`
                                        }
                                        target = "_blank"
                                        rel = "noopener noreferrer" >
                                        Meta & apos; s term and conditions <
                                        /a> &
                                        nbsp;
                                        for custom audiences.Problems ? & nbsp; < a style = {
                                            {
                                                color: '#286CFF'
                                            }
                                        }
                                        href = "https://help.fraudblocker.com/en/articles/10046374-accepting-meta-s-terms-conditions"
                                        target = "_blank"
                                        rel = "noopener noreferrer" >
                                        Change profiles. < /a> <
                                        /div>
                                    )
                                } {
                                    error.connectAdSet && < ErrorBox error = {
                                        error.connectAdSet
                                    }
                                    />} {
                                        error.disconnect && < ErrorBox error = {
                                            error.disconnect
                                        }
                                        />} {
                                            error.disconnectAdSet && < ErrorBox error = {
                                                error.disconnectAdSet
                                            }
                                            />} {
                                                error.connect && ( <
                                                    div className = {
                                                        styles.disconnectWrap
                                                    } >
                                                    <
                                                    div onClick = {
                                                        () => this.disconnectDomain()
                                                    }
                                                    className = {
                                                        styles.disconnectBtn
                                                    }
                                                    style = {
                                                        {
                                                            marginLeft: 0
                                                        }
                                                    } >
                                                    {
                                                        loading.disconnect ? 'Removing' : 'Remove'
                                                    }
                                                    Facebook oAuth Connection <
                                                    /div> <
                                                    /div>
                                                )
                                            } {
                                                connected &&
                                                    error.pixels &&
                                                    (error.pixels.toLowerCase().includes('business') ? ( <
                                                        div className = {
                                                            styles.pixelsError
                                                        } >
                                                        <
                                                        img src = {
                                                            ConnectionErrorIcon
                                                        }
                                                        />
                                                        No Meta Business Account was found.Please & nbsp; <
                                                        a href = "https://www.facebook.com/business/tools/meta-business-suite"
                                                        target = "_blank"
                                                        rel = "noopener noreferrer" >
                                                        create a Business Account <
                                                        /a>
                                                        . <
                                                        /div>
                                                    ) : ( <
                                                        div className = {
                                                            styles.pixelsError
                                                        } >
                                                        <
                                                        img src = {
                                                            ConnectionErrorIcon
                                                        }
                                                        /> {
                                                            error.pixels
                                                        } <
                                                        /div>
                                                    ))
                                            } {
                                                error.connect && error.disconnectDomain && < ErrorBox error = {
                                                    error.disconnectDomain
                                                }
                                                />}

                                                <
                                                h3 style = {
                                                    customStyles.subTitle
                                                }
                                                className = {
                                                        styles.subTitle
                                                    } >
                                                    Why We Need This <
                                                    /h3> <
                                                    p >
                                                    By providing us access to your Facebook account, we create an audience group that is then
                                                excluded from your Meta Ads account.Without this access you will be unable to
                                                automatically block bad clicks from your account.Our software does not edit or change any
                                                other elements of your Meta Ads campaigns. <
                                                    /p>

                                                    <
                                                    h3 style = {
                                                        customStyles.subTitle
                                                    }
                                                className = {
                                                        styles.subTitle
                                                    } >
                                                    About Your Security <
                                                    /h3> <
                                                    p >
                                                    Our mission is to protect our clients from the rampant ad fraud occurring on the internet
                                                today.We also aim to provide more transparency with our service with access to detailed
                                                fraud reporting and analytics.We have taken steps and put security measures in place to
                                                prevent the accidental loss or misuse of personal data, and will take all steps possible
                                                to make sure that your personal data is encrypted and stored securely.You can read more
                                                about our security methods in our {
                                                        ' '
                                                    } <
                                                    a href = "https://fraudblocker.com/privacy"
                                                target = "_blank"
                                                rel = "noopener noreferrer" >
                                                    Privacy Policy <
                                                    /a>
                                                    . <
                                                    /p> <
                                                    /div>
                                            );
                                        }
                                    }

                                    MetaAdsSetup.propTypes = {
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

                                    export default connect(mapStateToProps, mapDispatchToProps)(MetaAdsSetup);