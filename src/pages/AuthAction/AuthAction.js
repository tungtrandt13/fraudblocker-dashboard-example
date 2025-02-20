import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import qs from "qs";
import styles from "./AuthAction.module.scss";
import { ReactComponent as MAINLOGO } from "../../assets/main-logo.svg";
import Footer from "../../components/Footer/Footer";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Validation from "../../utils/Validation";
import User from "../../redux/actions/User";

const customStyle = {
    input: {
        fontWeight: "bold",
        height: 45,
    },
    inputContainer: {
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666666",
    },
};

function AuthAction() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = qs.parse(location.search, { ignoreQueryPrefix: true });

    const [formState, setFormState] = useState({
        email: "",
        mode: query.mode,
        oobCode: query.oobCode,
        password: "",
        redirectToLogin: false,
        errors: {},
        loading: false,
    });

    const { email, password, errors, redirectToLogin, loading } = formState;

    useEffect(() => {
        verifyPasswordResetCode();
    }, []); // Empty dependency array for componentDidMount behavior

    const verifyPasswordResetCode = async () => {
        try {
            const result = await User.verifyPasswordResetCode(formState.oobCode);
            setFormState((prev) => ({
                ...prev,
                email: result,
            }));
        } catch (error) {
            console.log(error);
            if (error.code === "auth/expired-action-code") {
                setFormState((prev) => ({
                    ...prev,
                    errors: {
                        resetError: "Password reset action has expired. Please request a new link.",
                    },
                }));
            } else {
                setFormState((prev) => ({
                    ...prev,
                    errors: {
                        resetError: error.message,
                    },
                }));
            }
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
        const data = { password };
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

        setFormState((prev) => ({
            ...prev,
            loading: true,
        }));

        try {
            const result = await User.confirmPasswordReset(formState.oobCode, password);
            if (result) {
                setFormState((prev) => ({
                    ...prev,
                    redirectToLogin: true,
                    errors: {},
                    loading: false,
                }));
            }
        } catch (error) {
            console.log(error.message);
            setFormState((prev) => ({
                ...prev,
                errors: {
                    setPassword: error.message,
                },
                loading: false,
            }));
        }
    };

    const ErrorView = () => (
        <div className={styles.content}>
            <MAINLOGO />
            <h1 className={styles.headerText}>Set Password</h1>
            <p style={customStyle.inputLabel} className={styles.descriptionText}>
                {errors.resetError}
            </p>
        </div>
    );

    const SetPasswordForm = () => (
        <div className={styles.content}>
            <MAINLOGO />
            <h1 className={styles.headerText}>Set Password</h1>
            <p style={customStyle.inputLabel} className={styles.descriptionText}>
                {`Email: ${email}`}
            </p>

            <div className={styles.form}>
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
                />
            </div>

            {errors.setPassword && <ErrorBox error={errors.setPassword} />}

            <div className={styles.formFooterContainer}>
                <Button title="Set Password" loading={loading} onClick={onClickSetPassword} color="green" />
                <div className={styles.empty} />
            </div>
        </div>
    );

    if (redirectToLogin) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={styles.all}>
            {errors.resetError ? <ErrorView /> : <SetPasswordForm />}
            <Footer />
        </div>
    );
}

export default AuthAction;
