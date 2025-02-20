import React from "react";
import PropTypes from "prop-types";
import styles from "./Breadcrumbs.module.scss";

const Breadcrumbs = ({ currentStep, onStepChange }) => {
    const steps = [
        {
            step: "Step 1",
            value: "Create Account",
        },
        {
            step: "Step 2",
            value: "Setup Profile",
        },
        {
            step: "Step 3",
            value: "Select Plan",
        },
    ]; // Add more steps as needed

    const isStepActive = (index) => {
        if (index === 1 && (currentStep === 1 || currentStep === 2)) {
            return true;
        }
        if (index === 2 && (currentStep === 3 || currentStep === 4)) {
            return true;
        }
        return false;
    };

    return (
        <div className={styles.breadcrumbs}>
            {" "}
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={
                        isStepActive(index)
                            ? `${styles.active} ${index === 1 ? styles.pointer : ""}`
                            : index === 1
                              ? styles.pointer
                              : ""
                    }
                    onClick={() => (index === 1 ? onStepChange(1) : {})}
                >
                    <span> </span> <div className={styles.stepCount}> {step.step} </div>{" "}
                    <div className={styles.stepValue}> {step.value} </div>{" "}
                </div>
            ))}{" "}
        </div>
    );
};
// Prop type validation
Breadcrumbs.propTypes = {
    currentStep: PropTypes.number.isRequired,
    onStepChange: PropTypes.func.isRequired,
};

export default Breadcrumbs;
