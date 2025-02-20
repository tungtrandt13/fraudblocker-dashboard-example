import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dropdown from "../../../../components/Dropdown/Dropdown";
import styles from "../../RegisterSteps.module.scss";
import BACKARROW from "../../../../assets/back-arrow.svg";
import Button from "../../../../components/Button/Button";
import ErrorBox from "../../../../components/ErrorBox/ErrorBox";

const EMPLOYEE_OPTIONS = [
    {
        label: "1 - 10",
        value: "1 - 10",
    },
    {
        label: "11 - 50",
        value: "11 - 50",
    },
    {
        label: "51 - 250",
        value: "51 - 250",
    },
    {
        label: "250+",
        value: "250+",
    },
];

const PPC_ADS_OPTIONS = [
    {
        label: "Less than $10,000",
        value: "Less than $10,000",
    },
    {
        label: "$10,001 - $25,000",
        value: "$10,001 - $25,000",
    },
    {
        label: "$25,001 - $100,000",
        value: "$25,001 - $100,000",
    },
    {
        label: "$100,000+",
        value: "$100,000+",
    },
];

const CompanyDetailsForm = ({ user = {}, updateUser, onClickNext, onClickBack }) => {
    const [companyDetails, setCompanyDetails] = useState({
        work_for_agency: user.work_for_agency || "",
        number_of_employees: user.number_of_employees || "",
        spend_in_ppc_ads: user.spend_in_ppc_ads || "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInput = (event) => {
        const { value, name } = event.target;
        setCompanyDetails((pre) => ({ ...pre, [name]: value }));
    };

    useEffect(() => {
        window.scrollTo(0, 100);
    }, []);

    const saveCompanyDetails = async () => {
        setLoading(true);

        try {
            const result = await updateUser(user.id, companyDetails);
            if (result) {
                setLoading(false);
                window.Intercom("trackEvent", "register-step-3");
                window.Intercom("update", {
                    user_id: user.id,
                    ...companyDetails,
                });
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

    return (
        <div className={`${styles.slideLeft} ${styles.active}`}>
            <div className={styles.backArrow} onClick={onClickBack}>
                <img src={BACKARROW} alt="Back" /> Back{" "}
            </div>{" "}
            <h2> How about your company ? </h2>
            <div className={styles.label}> Do you work for an ad agency(manage multiple clients) ? </div>{" "}
            <div className={styles.multiCheckbox}>
                <div>
                    <input
                        type="radio"
                        name="work_for_agency"
                        value="Yes"
                        checked={companyDetails.work_for_agency === "Yes"}
                        onChange={handleInput}
                    />{" "}
                    <label> Yes </label>{" "}
                </div>{" "}
                <div>
                    <input
                        type="radio"
                        name="work_for_agency"
                        value="No"
                        checked={companyDetails.work_for_agency === "No"}
                        onChange={handleInput}
                    />{" "}
                    <label> No </label>{" "}
                </div>{" "}
            </div>{" "}
            <div className={styles.label}> Number of employees at your company </div>{" "}
            <div className={styles.selectBox}>
                <Dropdown
                    options={EMPLOYEE_OPTIONS}
                    value={EMPLOYEE_OPTIONS.find((item) => item.value === companyDetails.number_of_employees)}
                    selectClass={styles.select}
                    isSearchable={false}
                    customStyles={{
                        control: {
                            fontWeight: "700",
                            color: "#279cf8",
                        },
                    }}
                    name="number_of_employees"
                    onOptionChange={(value) =>
                        handleInput({
                            target: {
                                name: "number_of_employees",
                                value: value.value,
                            },
                        })
                    }
                />{" "}
            </div>{" "}
            <div className={styles.label}> What is your typical spend in PPC advertising each month ? </div>{" "}
            <div className={styles.selectBox}>
                <Dropdown
                    options={PPC_ADS_OPTIONS}
                    value={PPC_ADS_OPTIONS.find((item) => item.value === companyDetails.spend_in_ppc_ads)}
                    selectClass={styles.select}
                    isSearchable={false}
                    name="spend_in_ppc_ads"
                    customStyles={{
                        control: {
                            fontWeight: "700",
                            color: "#279cf8",
                        },
                    }}
                    onOptionChange={(value) =>
                        handleInput({
                            target: {
                                name: "spend_in_ppc_ads",
                                value: value.value,
                            },
                        })
                    }
                />{" "}
            </div>{" "}
            {errors.apiError && <ErrorBox error={errors.apiError} />}{" "}
            <div className={styles.stepsButton}>
                <Button title="Skip" color="blank-hover-green" disabled={loading} onClick={onClickNext} />{" "}
                <Button
                    title="Next Step"
                    type="button"
                    loading={loading}
                    disabled={loading}
                    onClick={saveCompanyDetails}
                    color="new-green"
                />
            </div>{" "}
        </div>
    );
};

CompanyDetailsForm.propTypes = {
    user: PropTypes.object,
    updateUser: PropTypes.func,
    onClickNext: PropTypes.func,
    onClickBack: PropTypes.func,
};

export default CompanyDetailsForm;
