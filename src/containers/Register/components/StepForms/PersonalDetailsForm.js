import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import PropTypes from "prop-types";
import styles from "../../RegisterSteps.module.scss";
import Input from "../../../../components/Input/Input";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import Button from "../../../../components/Button/Button";
import ErrorBox from "../../../../components/ErrorBox/ErrorBox";
import Constants from "../../../../utils/Constants";

const customStyles = {
    input: {
        marginBottom: 25,
    },
    dropdown: {
        marginBottom: 25,
    },
};

const allTimezones = Constants.getAllTimezones();

const AD_FRAUDS_OPTIONS = [
    "Fake leads",
    "Competitors clicking",
    "Accidental clicks",
    "Excessive volume of clicks",
    "Poor conversion rates",
    "Other",
];

const PersonalDetailsForm = ({ user = {}, updateUser, onClickNext }) => {
    const [personalDetails, setPersonalDetails] = useState({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        ad_frauds: user.ad_frauds || "",
        advertise_platform: user.advertise_platform || "",
        timezone: {
            value: user.timezone || `(GMT${moment.tz(moment.tz.guess(true)).format("Z")}) ${moment.tz.guess(true)}`,
            label: user.timezone || `(GMT${moment.tz(moment.tz.guess(true)).format("Z")}) ${moment.tz.guess(true)}`,
        },
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInput = (event) => {
        const { value, name } = event.target;
        setPersonalDetails((pre) => ({ ...pre, [name]: value }));
    };

    useEffect(() => {
        window.scrollTo(0, 100);
    }, []);

    const savePersonalDetails = async () => {
        setLoading(true);

        try {
            const payload = JSON.parse(JSON.stringify(personalDetails));
            if (personalDetails.timezone.value) {
                payload.timezone = personalDetails.timezone.value;
            }
            const result = await updateUser(user.id, payload);
            if (result) {
                setLoading(false);
                window.Intercom("trackEvent", "register-step-2");
                window.Intercom("update", {
                    user_id: user.id,
                    name: `${personalDetails.first_name} ${personalDetails.last_name}`,
                    ad_frauds: personalDetails.ad_frauds,
                    advertise_platform: personalDetails.advertise_platform,
                    ...(personalDetails.timezone.value && {
                        timezone: personalDetails.timezone.value,
                    }),
                });

                if (personalDetails.timezone.value) {
                    moment.tz.setDefault(
                        personalDetails.timezone.value.substr(personalDetails.timezone.value.indexOf(") ") + 2)
                    );
                }

                onClickNext();
            } else {
                throw new Error("Error occured while updating user details");
            }
        } catch (error) {
            console.log(error);
            setErrors((pre) => ({ ...pre, apiError: error.message }));
            setLoading(false);
        }
    };

    const handleAdFraudChange = (option) => {
        if (personalDetails.ad_frauds.includes(option)) {
            // If selected, remove it from the selectedOptions array
            const updatedFraud = personalDetails.ad_frauds.split("_").filter((item) => item !== option);
            setPersonalDetails((pre) => ({ ...pre, ad_frauds: updatedFraud.join("_") }));
        } else {
            setPersonalDetails((pre) => ({ ...pre, ad_frauds: `${pre.ad_frauds}_${option}` }));
        }
    };

    const onOptionChange = (name, selectedOption) => {
        setPersonalDetails((pre) => ({ ...pre, [name]: selectedOption }));
    };

    return (
        <div className={`${styles.slideLeft} ${styles.active}`}>
            <h2>
                Welcome! <span> Tell us about yourself </span>{" "}
            </h2>{" "}
            <div className={styles.label}> What’ s your name ? </div>{" "}
            <div className={styles.inputGrid}>
                <Input
                    name="first_name"
                    type="text"
                    value={personalDetails.first_name}
                    onChange={handleInput}
                    containerStyle={customStyles.input}
                    placeholder="First Name"
                    error={errors.first_name || null}
                />{" "}
                <Input
                    name="last_name"
                    type="text"
                    value={personalDetails.last_name}
                    onChange={handleInput}
                    containerStyle={customStyles.input}
                    placeholder="Last Name"
                    error={errors.last_name || null}
                />{" "}
            </div>{" "}
            <div className={styles.label}>
                {" "}
                What & apos; s your timezone <span> (you can change this later) </span>?
            </div>
            <Dropdown
                options={allTimezones.values}
                onOptionChange={(val) => onOptionChange("timezone", val)}
                containerStyle={customStyles.dropdown}
                value={personalDetails.timezone}
                selectClass={styles.timezoneDropdown}
            />{" "}
            <div className={styles.label}>
                What ad fraud are you experiencing today <span> (select all that apply) ? </span>{" "}
            </div>{" "}
            <div className={styles.multiCheckbox}>
                {" "}
                {AD_FRAUDS_OPTIONS.map((option) => (
                    <div key={option}>
                        <input
                            type="checkbox"
                            name="ad_frauds"
                            value={option}
                            checked={personalDetails.ad_frauds.includes(option)}
                            onChange={() => handleAdFraudChange(option)}
                        />{" "}
                        <label> {option} </label>{" "}
                    </div>
                ))}{" "}
            </div>{" "}
            <div className={styles.label}> Where do you advertise most ? </div>{" "}
            <div className={styles.multiCheckbox}>
                <div>
                    <input
                        type="radio"
                        name="advertise_platform"
                        value="Google Ads"
                        checked={personalDetails.advertise_platform === "Google Ads"}
                        onChange={handleInput}
                    />{" "}
                    <label> Google Ads </label>{" "}
                </div>{" "}
                <div>
                    <input
                        type="radio"
                        name="advertise_platform"
                        value="Facebook Ads"
                        checked={personalDetails.advertise_platform === "Facebook Ads"}
                        onChange={handleInput}
                    />{" "}
                    <label> Facebook Ads </label>{" "}
                </div>{" "}
            </div>{" "}
            {errors.apiError && <ErrorBox error={errors.apiError} />}{" "}
            <div className={styles.stepsButton}>
                <Button title="Skip" color="blank-hover-green" disabled={loading} onClick={onClickNext} />{" "}
                <Button
                    title="Next Step"
                    type="button"
                    loading={loading}
                    disabled={loading}
                    onClick={savePersonalDetails}
                    color="new-green"
                />
            </div>{" "}
        </div>
    );
};

PersonalDetailsForm.propTypes = {
    user: PropTypes.object,
    updateUser: PropTypes.func,
    onClickNext: PropTypes.func,
};

export default PersonalDetailsForm;
