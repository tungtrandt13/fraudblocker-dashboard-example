import React from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { Elements, StripeProvider } from "@stripe/react-stripe-js";
import User from "../../redux/actions/User";
import Account from "../../redux/actions/Account";
import Users from "../../api/Users";
import styles from "./RegisterSteps.module.scss";
import Breadcrumbs from "./components/Breadcrumbs/Breadcrumbs";
import Constants from "../../utils/Constants";
import PaymentForm from "./components/StepForms/PaymentForm";
import AccountCreationForm from "./components/StepForms/AccountCreationForm";
import PersonalDetailsForm from "./components/StepForms/PersonalDetailsForm";
import CompanyDetailsForm from "./components/StepForms/CompanyDetailsForm";
import FinishedRegistration from "./components/StepForms/FinishedRegistration";

function RegisterSteps({ activeForm, discount, couponError, updatedActiveForm }) {
    const dispatch = useDispatch();

    // Redux state
    const auth = useSelector((state) => state.auth);
    const accounts = useSelector((state) => state.accounts);
    const activeDomain = useSelector((state) => state.activeDomain);

    // Actions
    const createUser = (data) => dispatch(User.createUser(data));
    const updateUser = (id, data) => dispatch(User.updateUser(id, data));
    const updateUserAccount = (accountId, data) => dispatch(Account.updateUserAccount(accountId, data));
    const getUserAccounts = (id) => dispatch(Account.getUserAccounts(id));
    const fetchLatestAccount = (id) => dispatch(Account.fetchLatestAccount(id));

    const onClickBack = () => {
        updatedActiveForm(activeForm - 1);
    };

    const welcomeUser = () => {
        Users.welcomeUser({ email: auth.user.email });
    };

    const handleNext = () => {
        updatedActiveForm(activeForm + 1);
    };

    const handleStepChange = (step) => {
        updatedActiveForm(step);
    };

    // Render step components based on current step
    const renderStepComponent = () => {
        switch (activeForm) {
            case 0:
                return <div className={styles.slideLeft} />;

            // case 1:
            //     return <PersonalDetailsForm user={auth.user} updateUser={updateUser} onClickNext={handleNext} />;

            // case 2:
            //     return (
            //         <CompanyDetailsForm
            //             user={auth.user}
            //             onClickBack={onClickBack}
            //             updateUser={updateUser}
            //             onClickNext={handleNext}
            //         />
            //     );

            // case 3:
            //     return (
            //         <AccountCreationForm
            //             onClickBack={onClickBack}
            //             onClickNext={handleNext}
            //             updateUser={updateUser}
            //             updateUserAccount={updateUserAccount}
            //             user={auth.user}
            //             discount={discount}
            //             couponError={couponError}
            //             accounts={accounts}
            //             currency={auth.user.currency}
            //             conversionRates={accounts.conversionRates}
            //         />
            //     );

            // case 4:
            //     return (
            //         <StripeProvider apiKey={Constants.stripePublicKey}>
            //             <Elements>
            //                 <PaymentForm
            //                     onClickNext={handleNext}
            //                     onClickBack={onClickBack}
            //                     currency={auth.user.currency}
            //                     user={auth.user}
            //                     updateUser={updateUser}
            //                     accounts={accounts}
            //                     discount={discount}
            //                     conversionRates={accounts.conversionRates}
            //                 />
            //             </Elements>
            //         </StripeProvider>
            //     );

            default:
                return null;
        }
    };

    if (activeForm === 5) {
        return (
            <div className={styles.newRegisterFormSteps}>
                <FinishedRegistration
                    accounts={accounts}
                    user={auth.user}
                    fetchLatestAccount={fetchLatestAccount}
                    getUserAccounts={getUserAccounts}
                    welcomeUser={welcomeUser}
                />
            </div>
        );
    }

    return (
        <div className={styles.newRegisterFormSteps}>
            <Breadcrumbs onStepChange={handleStepChange} currentStep={activeForm} />
            <div className={styles.stepsContainer}>{renderStepComponent()}</div>
        </div>
    );
}

RegisterSteps.propTypes = {
    activeForm: PropTypes.number.isRequired,
    discount: PropTypes.number,
    couponError: PropTypes.string,
    updatedActiveForm: PropTypes.func.isRequired,
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

export default RegisterSteps;
