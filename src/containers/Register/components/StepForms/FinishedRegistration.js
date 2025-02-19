import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';
import Utils from '../../../../utils/Utils';
import LinkButton from '../../../../components/LinkButton/LinkButton';
import Payments from '../../../../api/Payments';
import ErrorBox from '../../../../components/ErrorBox/ErrorBox';
import styles from '../../RegisterSteps.module.scss';
import CONGRATS from '../../../../assets/congrats.svg';
import SPARKEL from '../../../../assets/sparkel.svg';

let scriptRef = null;
let tapFiliateScriptRef = null;

const customStyles = {
    nextBtn: {
        marginTop: 30,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: `0 8px 12px 0 rgba(0, 0, 0, 0.08)`,
        maxWidth: '350px',
        height: '60px',
        textDecoration: 'none',
        padding: '0 20px'
    }
};
class FinishedRegistration extends PureComponent {
    state = {
        loading: false,
        error: ''
    };

    subscribeToPlan = async (applyCoupon = true) => {
        const {
            getUserAccounts,
            user,
            welcomeUser,
            accounts
        } = this.props;
        this.setState({
            loading: true,
            error: ''
        });
        if (
            accounts &&
            accounts.data &&
            accounts.data.initial_plan &&
            accounts.data.stripe_token &&
            accounts &&
            (!accounts.subscription ||
                !accounts.subscription.subscriptions ||
                !accounts.subscription.subscriptions.data.length)
        ) {
            const subscribeData = {
                customer: accounts.data.stripe_token,
                items: [{
                    plan: accounts.data.initial_plan.id
                }],
                metadata: {
                    account_id: user.account_id
                }
            };
            const coupon = Utils.getCookie('afmc') || Utils.getCookie('offer_id');

            if (coupon && applyCoupon) {
                subscribeData.coupon = coupon;
            }
            try {
                const subscribeUserResult = await Payments.subscribeCustomerToPlan(subscribeData);
                if (subscribeUserResult) {
                    window.Intercom('trackEvent', 'account-subscription', {
                        account: user.account_id,
                        plan: accounts.data.initial_plan.id
                    });
                    window.Intercom('trackEvent', 'trial-started', {
                        timestamp: new Date(),
                        plan: accounts.data.initial_plan.id,
                        account: user.account_id
                    });
                    Utils.setCookie('afmc', '', -1);
                    Utils.setCookie('offer_id', '', -1);
                    getUserAccounts(user.account_id);
                    welcomeUser();
                    this.setState({
                        loading: false
                    });
                }
            } catch (error) {
                this.setState({
                    loading: false,
                    error: error.message
                });
                Utils.setCookie('coupon', '', -1);
                Utils.setCookie('offer_id', '', -1);
            }
        }
    };

    componentWillUnmount() {
        if (scriptRef) {
            document.head.removeChild(scriptRef);
        }
        if (tapFiliateScriptRef) {
            document.head.removeChild(tapFiliateScriptRef);
        }
    }

    addTrackingScript = () => {
        const {
            accounts
        } = this.props;
        tapFiliateScriptRef = document.createElement('script');
        tapFiliateScriptRef.type = 'text/javascript';
        tapFiliateScriptRef.async = true;
        tapFiliateScriptRef.src = 'https://script.tapfiliate.com/tapfiliate.js';
        document.head.appendChild(tapFiliateScriptRef);

        tapFiliateScriptRef.onload = () => {
            if (accounts && accounts.data && accounts.data.stripe_token) {
                const script = document.createElement('script');
                const inlineScript = document.createTextNode(
                    `(function(t,a,p){t.TapfiliateObject=a;t[a]=t[a]||function(){
          (t[a].q=t[a].q||[]).push(arguments)}})(window,'tap');

          tap('create', '50329-ac1203', { integration: "stripe" });
          tap('trial', ${accounts.data.stripe_token});`
                );
                script.appendChild(inlineScript);
                document.body.appendChild(script);
            }
        };
    }

    componentDidMount = async () => {
        // window.scrollTo(0, 0);
        this.subscribeToPlan();
        window.AddShoppersConversion = {
            order_id: new Date().getTime().toString(),
            value: '10',
            currency: 'USD'
        };
        window.AddShoppersWidgetOptions = {
            loadCss: false,
            pushResponse: false
        };
        scriptRef = document.createElement('script');
        scriptRef.type = 'text/javascript';
        scriptRef.async = true;
        scriptRef.id = 'AddShoppers';
        scriptRef.src = 'https://shop.pe/widget/widget_async.js#654b492f6428ea2e978f0d0f';
        document.head.appendChild(scriptRef);

        this.addTrackingScript();
    };

    removeCouponAndRetry = async () => {
        Utils.setCookie('coupon', '', -1);
        this.subscribeToPlan(false);
    };

    render() {
        const {
            error
        } = this.state;
        return ( <
            div className = {
                styles.formContainer
            } >
            <
            img src = {
                CONGRATS
            }
            className = {
                styles.congoLogo
            }
            alt = "congratulations" / >
            <
            h1 className = {
                styles.headerText
            } >
            Woot! < span > Congratulations < /span> <
            /h1> {
                error && < ErrorBox error = {
                    error
                }
                />} {
                    error && error.toLowerCase().indexOf('coupon') && ( <
                        p className = {
                            styles.accountCreatedText
                        } >
                        The coupon you are trying to apply is not valid.You can either {
                            ' '
                        } <
                        a href = {
                            null
                        }
                        onClick = {
                            this.removeCouponAndRetry
                        } >
                        click here <
                        /a>{' '}
                        to remove the coupon and subscribe or {
                            ' '
                        } <
                        a href = "https://fraudblocker.com/contact-us"
                        target = "_blank"
                        rel = "noopener noreferrer" >
                        contact us <
                        /a>{' '}
                        to know more. <
                        /p>
                    )
                } {
                    !error && ( <
                        >
                        <
                        h3 >
                        <
                        img src = {
                            SPARKEL
                        }
                        alt = "sparkel" / >
                        Your 7 - day trial has started <
                        /h3> <
                        p className = {
                            styles.accountCreatedText
                        } >
                        To start blocking click fraud, simply install our Fraud Tracker pixel and connect your ad accounts. <
                        /p> <
                        div className = {
                            styles.finishedFormFooter
                        } >
                        <
                        LinkButton style = {
                            customStyles.nextBtn
                        }
                        color = "new-green"
                        to = "/integrations/fraud-blocker-tracker"
                        title = "Install Fraud Blocker Pixel"
                        customClassNames = "finishButton__nextBtn"
                        loading = {
                            this.state.loading
                        }
                        onClick = {
                            () => {}
                        }
                        /> <
                        /div> <
                        />
                    )
                } <
                /div>
            );
        }
    }

    FinishedRegistration.propTypes = {
        welcomeUser: PropTypes.func,
        getUserAccounts: PropTypes.func,
        fetchLatestAccount: PropTypes.func,
        user: PropTypes.object,
        accounts: PropTypes.object
    };

    export default FinishedRegistration;