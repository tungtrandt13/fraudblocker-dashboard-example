import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Utils from "../../../utils/Utils";
import LinkButton from "../../../components/LinkButton/LinkButton";
import Payments from "../../../api/Payments";
import ErrorBox from "../../../components/ErrorBox/ErrorBox";
import styles from "./RegisterForms.module.scss";
import FINISHED from "../../../assets/celebrate.gif";

let scriptRef = null;

const customStyles = {
    nextBtn: {
        marginTop: 30,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: `0 8px 12px 0 rgba(0, 0, 0, 0.08)`,
        maxWidth: "350px",
        height: "60px",
        textDecoration: "none",
    },
};
class FinishedRegistration extends PureComponent {
    state = {
        loading: false,
        error: "",
    };

    subscribeToPlan = async (applyCoupon = true) => {
        const { getUserAccounts, user, welcomeUser, accounts } = this.props;
        this.setState({
            loading: true,
            error: "",
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
                items: [
                    {
                        plan: accounts.data.initial_plan.id,
                    },
                ],
                metadata: {
                    account_id: user.account_id,
                },
            };
            const coupon = Utils.getCookie("afmc") || Utils.getCookie("offer_id");

            if (coupon && applyCoupon) {
                subscribeData.coupon = coupon;
            }
            try {
                const subscribeUserResult = await Payments.subscribeCustomerToPlan(subscribeData);
                if (subscribeUserResult) {
                    window.Intercom("trackEvent", "account-subscription", {
                        account: user.account_id,
                        plan: accounts.data.initial_plan.id,
                    });
                    window.Intercom("trackEvent", "trial-started", {
                        timestamp: new Date(),
                        plan: accounts.data.initial_plan.id,
                        account: user.account_id,
                    });
                    Utils.setCookie("afmc", "", -1);
                    Utils.setCookie("offer_id", "", -1);
                    getUserAccounts(user.account_id);
                    welcomeUser();
                    this.setState({
                        loading: false,
                    });
                }
            } catch (error) {
                this.setState({
                    loading: false,
                    error: error.message,
                });
                Utils.setCookie("coupon", "", -1);
                Utils.setCookie("offer_id", "", -1);
            }
        }
    };

    componentWillUnmount() {
        if (scriptRef) {
            document.head.removeChild(scriptRef);
        }
    }

    componentDidMount = async () => {
        window.scrollTo(0, 0);
        this.subscribeToPlan();
        window.AddShoppersConversion = {
            order_id: new Date().getTime().toString(),
            value: "10",
            currency: "USD",
        };
        window.AddShoppersWidgetOptions = {
            loadCss: false,
            pushResponse: false,
        };
        scriptRef = document.createElement("script");
        scriptRef.type = "text/javascript";
        scriptRef.async = true;
        scriptRef.id = "AddShoppers";
        scriptRef.src = "https://shop.pe/widget/widget_async.js#654b492f6428ea2e978f0d0f";
        document.head.appendChild(scriptRef);
    };

    removeCouponAndRetry = async () => {
        Utils.setCookie("coupon", "", -1);
        this.subscribeToPlan(false);
    };

    render() {
        const { error } = this.state;
        return (
            <div className={styles.formContainer}>
                <h1 className={styles.headerText}> Woot!Congratulations. </h1>{" "}
                <div className={styles.finishedImageContainer}>
                    <img src={FINISHED} alt="celebrate" className={styles.finishedImage} />{" "}
                </div>{" "}
                {error && <ErrorBox error={error} />}{" "}
                {error && error.toLowerCase().indexOf("coupon") && (
                    <p className={styles.accountCreatedText}>
                        The coupon you are trying to apply is not valid.You can either{" "}
                        <a href={null} onClick={this.removeCouponAndRetry}>
                            click here{" "}
                        </a>{" "}
                        to remove the coupon and subscribe or{" "}
                        <a href="https://fraudblocker.com/contact-us" target="_blank" rel="noopener noreferrer">
                            contact us{" "}
                        </a>{" "}
                        to know more.{" "}
                    </p>
                )}{" "}
                {!this.state.loading && !error && (
                    <p className={styles.accountCreatedText}>
                        Your account has been created and your 7 - day free trial has started. <br /> <br />
                        To start blocking fraud simply follow the instructions to install the Fraud Blocker monitoring
                        pixel on your website.{" "}
                    </p>
                )}{" "}
                {!this.state.loading && !error && (
                    <div className={styles.finishedFormFooter}>
                        <LinkButton
                            style={customStyles.nextBtn}
                            color="green"
                            to="/integrations/fraud-blocker-tracker"
                            title="Install Fraud Blocker Pixel"
                            customClassNames="finishButton__nextBtn"
                            onClick={() => {}}
                        />{" "}
                    </div>
                )}{" "}
            </div>
        );
    }
}

FinishedRegistration.propTypes = {
    welcomeUser: PropTypes.func,
    getUserAccounts: PropTypes.func,
    fetchLatestAccount: PropTypes.func,
    user: PropTypes.object,
    accounts: PropTypes.object,
};

export default FinishedRegistration;
