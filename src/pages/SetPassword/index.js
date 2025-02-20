import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import styles from "./SetPassword.module.scss";
import { ReactComponent as MAINLOGO } from "../../assets/main-logo.svg";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Validation from "../../utils/Validation";
import Users from "../../api/Users";

const customStyle = {
    input: {
        fontWeight: "bold",
    },
    inputContainer: {
        marginBottom: 0,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666666",
    },
    availBtn: {
        display: "inline-flex",
        textDecoration: "none",
    },
};

function SetPassword() {
    const { email, invitation_id } = useParams();
    const navigate = useNavigate();

    const [formState, setFormState] = useState({
        email: email || "",
        invitation_id: invitation_id || "",
        password: "",
        redirectToLogin: false,
        errors: {},
        invitationExpired: false,
    });

    const { password, errors, redirectToLogin, invitationExpired } = formState;

    useEffect(() => {
        checkInvitationExpiration(formState.invitation_id);
    }, [formState.invitation_id]);

    const checkInvitationExpiration = async (invitationId) => {
        try {
            const isExpired = await Users.checkInvitationExpiration(invitationId);
            if (isExpired) {
                setFormState((prev) => ({
                    ...prev,
                    invitationExpired: true,
                }));
            }
        } catch (error) {
            console.log(error.message);
            setFormState((prev) => ({
                ...prev,
                invitationExpired: true,
            }));
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            onClickSetPassword();
        }
    };

    const onClickSetPassword = async () => {
        const data = {
            email: formState.email,
            password,
            invitation_id: formState.invitation_id,
        };

        const newErrors = Validation.validateForm(data);
        if (newErrors) {
            setFormState((prev) => ({
                ...prev,
                errors: newErrors,
                loading: false,
            }));
            console.log("invalidForm: ", newErrors);
            return;
        }

        try {
            const result = await Users.setPassword(data);
            if (result) {
                setFormState((prev) => ({
                    ...prev,
                    redirectToLogin: true,
                    errors: {},
                }));
            }
        } catch (error) {
            console.log(error.message);
            setFormState((prev) => ({
                ...prev,
                errors: {
                    setPassword: error.message,
                },
            }));
        }
    };

    const ExpiredView = () => (
        <div className={styles.loginBox}>
            <div className={styles.loginBoxInner}>
                <div className={styles.logo}>
                    <MAINLOGO />
                </div>
                <h1 className={styles.headerText}>Set Your New Password</h1>
                <p style={customStyle.inputLabel} className={styles.descriptionText}>
                    Invitation has expired, please ask your account owner to resend an invitation.
                </p>
            </div>
        </div>
    );

    const SetPasswordForm = () => (
        <div className={styles.loginBox}>
            <div className={styles.loginBoxInner}>
                <div className={styles.logo}>
                    <MAINLOGO />
                </div>
                <h1 className={styles.headerText}>Set Your New Password</h1>

                <div className={`${styles.loginForm} ${styles.setPassForm}`}>
                    <Input
                        type="password"
                        value={password}
                        name="password"
                        label="Password"
                        labelStyle={customStyle.inputLabel}
                        placeholder="Enter Password"
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        containerStyle={customStyle.inputContainer}
                        style={customStyle.input}
                        error={errors.password}
                        showEye
                    />
                    <div className={styles.passwordInfo}>
                        Your password must be at least 8 characters. We recommend at least 1 lowercase, 1 uppercase, and
                        1 number.
                    </div>
                </div>

                {errors.setPassword && <ErrorBox error={errors.setPassword} />}

                <div className={styles.twoInputsContainer}>
                    <Button title="Set Password" onClick={onClickSetPassword} color="green" />
                </div>

                <p>
                    By clicking this button you agree to Fraud Blocker's{" "}
                    <a
                        href="https://fraudblocker.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`blue ${styles.link}`}
                    >
                        Terms of Service
                    </a>
                </p>
            </div>
        </div>
    );

    if (redirectToLogin) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={styles.all}>
            {invitationExpired ? <ExpiredView /> : <SetPasswordForm />}
            <div className={styles.loginRight} />
        </div>
    );
}

export default SetPassword;
