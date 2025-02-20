import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import styles from "./Account.module.scss";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import User from "../../redux/actions/User";
import Validation from "../../utils/Validation";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import SuccessBox from "../../components/SuccessBox/SuccessBox";

const customStyles = {
    title: {
        marginBottom: 60,
    },
    editTitle: {
        marginBottom: 10,
    },
    editInput: {},
    inputContainer: {
        display: "flex",
        flexDirection: "column",
        marginBottom: 30,
    },
    saveBtn: {
        maxWidth: 110,
    },
};

const Password = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordRetyped, setNewPasswordRetyped] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const auth = useSelector((state) => state.auth);

    const onInputChange = useCallback((event) => {
        const { value, name } = event.target;
        if (name === "currentPassword") {
            setCurrentPassword(value);
        } else if (name === "newPassword") {
            setNewPassword(value);
        } else {
            setNewPasswordRetyped(value);
        }
    }, []);

    const onSaveClick = useCallback(async () => {
        setLoading(true);
        setShowSuccess(false);
        setErrors({}); // Clear previous errors

        if (newPassword !== newPasswordRetyped) {
            setErrors({
                passwordRetyped: "Passwords entered do not match",
            });
            setLoading(false);
            return;
        }

        const requiredData = { password: newPassword };
        const newErrors = Validation.validateForm(requiredData);
        if (newErrors) {
            setErrors(newErrors);
            setLoading(false);
            console.log("invalidForm: ", newErrors);
            return;
        }

        try {
            await User.checkCurrentPassword(currentPassword, auth.user.email);
            await User.updatePasswordFirebase(requiredData.password);
            setShowSuccess(true);
        } catch (error) {
            console.log(error);
            if (error.code === "auth/wrong-password") {
                setErrors({ currentPassword: "Wrong Password" });
            } else {
                setErrors({ save: error.message });
            }
        } finally {
            setLoading(false);
        }
    }, [currentPassword, newPassword, newPasswordRetyped, auth.user.email]);

    return (
        <div className={styles.content}>
            <h1 style={customStyles.title} className={styles.title}>
                Change Password
            </h1>
            <Input
                containerStyle={customStyles.inputContainer}
                style={customStyles.editInput}
                onChange={onInputChange}
                label={"Current Password"}
                value={currentPassword}
                name="currentPassword"
                type="password"
                error={errors.currentPassword}
                showEye
            />
            <Input
                containerStyle={customStyles.inputContainer}
                style={customStyles.editInput}
                onChange={onInputChange}
                value={newPassword}
                label="New Password"
                name="newPassword"
                type="password"
                error={errors.password}
                showEye
            />
            <Input
                containerStyle={customStyles.inputContainer}
                style={customStyles.editInput}
                onChange={onInputChange}
                value={newPasswordRetyped}
                label="Re-type Password"
                name="newPasswordRetyped"
                type="password"
                error={errors.passwordRetyped}
                showEye
            />
            {errors.save && (
                <div>
                    <ErrorBox error={errors.save} />
                </div>
            )}
            {showSuccess && (
                <div>
                    <SuccessBox message="Successfully Updated Password!" />
                </div>
            )}
            <Button title="Save" loading={loading} color="blue" style={customStyles.saveBtn} onClick={onSaveClick} />
        </div>
    );
};

Password.propTypes = {
    auth: PropTypes.object, // Still needed for initial useSelector
};

const mapStateToProps = (state) => ({
    auth: state.auth,
});

export default connect(mapStateToProps)(Password);
