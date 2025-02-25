import React, { useState } from "react";
import { fromUrl, parseDomain } from "parse-domain";
import { Navigate, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "../../RegisterSteps.module.scss";
import Input from "../../../../components/Input/Input";
import Button from "../../../../components/Button/Button";
import Validation from "../../../../utils/Validation";
import User from "../../../../redux/actions/User";
import { ReactComponent as MAINLOGO } from "../../../../assets/main-logo.svg";
import { ReactComponent as UnlockDiscountIcon } from "../../../../assets/unlock-discount.svg";
import { ReactComponent as TooltipIcon } from "../../../../assets/tooltip.svg";
import ErrorBox from "../../../../components/ErrorBox/ErrorBox";
import Swal from 'sweetalert2';

const customStyles = {
    input: {
        marginBottom: 25,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666666",
    },
};

function SignUpForm({ onClickNext, createUser, setEmail, email, discount }) {
    // State
    const [formState, setFormState] = useState({
        domain: "",
        toSignIn: false,
        password: "",
        errors: {},
        loading: false,
    });

    const navigate = useNavigate();
    const [showActionSuccessModal, setShowActionSuccessModal] = useState(false);
    const [successActions, setSuccessActions] = useState([]);
    const toggleActionSuccessModal = () => {
        setShowActionSuccessModal(!showActionSuccessModal);
    };

    const [showSuccess, setShowSuccess] = useState({});


    const { domain, password, errors, loading, toSignIn } = formState;

    // Handlers
    const onChangeText = (event) => {
        const { value, name } = event.target;

        if (name === "email") {
            setEmail(value);
            return;
        }

        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSignUp = async () => {
        setFormState((prev) => ({
            ...prev,
            loading: true,
        }));

        const data = {
            domain,
            email,
            password,
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
            const userData = {
                domain: data.domain,
                email: data.email,
                password: data.password,
            };

            const createUserInDBResponse = await createUser(userData);
            if (createUserInDBResponse) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Account created successfully! ',
                    // Thêm nút "OK" và hành động chuyển hướng
                    confirmButtonText: 'OK', // Thay đổi text nút confirm
                    didClose: () => { // Hành động sau khi alert đóng (click OK hoặc ra ngoài)
                        navigate('/login'); // Chuyển hướng đến trang login
                    }
                });
            } else {
                throw new Error("Error creating user account");
            }
        } catch (error) {
            console.log(error);
            setFormState((prev) => ({
                ...prev,
                errors: {
                    signUp: error.message,
                },
                loading: false,
            }));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSignUp();
        }
    };

    const handleAlreadyHaveAccount = () => {
        setFormState((prev) => ({
            ...prev,
            toSignIn: true,
        }));
    };

    if (toSignIn) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={styles.newRegisterFormSteps}>
            <div className={styles.formContainer}>
                <TooltipIcon className={styles.tooltip} data-tooltip-id="moreWebsites">
                    You can add more websites or change them later
                </TooltipIcon>
                <div className={styles.logoImg}>
                    <MAINLOGO />
                </div>

                <h1 className={`${styles.headerText} ${styles.signupTitle}`}>Create your free account</h1>

                <p className={styles.alreadyHaveAccount}>
                    Already have an account?{" "}
                    <span onClick={handleAlreadyHaveAccount} className={styles.signInNowText}>
                        Sign in now
                    </span>
                </p>

                {discount !== 0 && (
                    <div className={styles.discountApplied}>
                        <UnlockDiscountIcon /> {discount}% discount applied!
                    </div>
                )}

                <Input
                    name="domain"
                    value={domain}
                    onChange={onChangeText}
                    className={styles.inputContainer}
                    labelStyle={customStyles.inputLabel}
                    containerStyle={customStyles.input}
                    label={
                        <span>
                            Website to Protect{" "}
                            <TooltipIcon className={styles.registerHelpTip} data-tip data-for="moreWebsites" />
                        </span>
                    }
                    placeholder="example.com"
                    error={errors.domain || null}
                />

                <Input
                    name="email"
                    value={email}
                    onChange={onChangeText}
                    onKeyPress={handleKeyPress}
                    labelStyle={customStyles.inputLabel}
                    containerStyle={customStyles.input}
                    label="Email"
                    placeholder="joanna@example.com"
                    error={errors.email || null}
                />

                <Input
                    name="password"
                    value={password}
                    type="password"
                    onChange={onChangeText}
                    onKeyPress={handleKeyPress}
                    labelStyle={customStyles.inputLabel}
                    label="Password"
                    showEye
                    error={errors.password || null}
                />

                <p className={styles.passwordInfo}>
                    Your password must be at least 8 characters. We recommend at least 1 lowercase, 1 uppercase, and 1
                    number.
                </p>

                {errors.signUp && <ErrorBox error={errors.signUp} />}

                <div className={styles.formFooterContainer}>
                    <Button
                        title="Register"
                        onClick={handleSignUp}
                        style={customStyles.nextBtn}
                        customClassNames="signUpForm__nextBtn"
                        loading={loading}
                        color="new-green"
                    />
                    <p>
                        By clicking this button you agree to Fraud Blocker&apos;s{" "}
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
        </div>
    );
}

SignUpForm.propTypes = {
    onClickNext: PropTypes.func,
    createUser: PropTypes.func,
    setEmail: PropTypes.func,
    email: PropTypes.string,
    discount: PropTypes.number,
};

export default SignUpForm;
