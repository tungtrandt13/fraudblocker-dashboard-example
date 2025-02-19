import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ResetPassword.module.scss';
import { ReactComponent as MAINLOGO } from '../../assets/main-logo.svg';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Validation from '../../utils/Validation';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import Users from '../../api/Users';

const customStyle = {
    input: {
        fontWeight: 'bold'
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666'
    },
    availBtn: {
        display: 'inline-flex',
        textDecoration: 'none'
    }
};

function ResetPassword() {
    const navigate = useNavigate();
    const [formState, setFormState] = useState({
        email: '',
        errors: {},
        success: false,
        loading: false
    });

    const { email, errors, success, loading } = formState;

    const handleChange = event => {
        const { name, value } = event.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleKeyPress = e => {
        if (e.key === 'Enter') {
            submitResetPassword();
        }
    };

    const submitResetPassword = async () => {
        const data = { email };
        const newErrors = Validation.validateForm(data);
        
        if (newErrors) {
            setFormState(prev => ({
                ...prev,
                errors: newErrors,
                loading: false
            }));
            console.log('invalidForm: ', newErrors);
            return;
        }

        setFormState(prev => ({
            ...prev,
            loading: true
        }));

        try {
            const result = await Users.generatePasswordReset(data);
            if (result) {
                setFormState(prev => ({
                    ...prev,
                    success: true,
                    errors: {},
                    loading: false
                }));
            }
        } catch (error) {
            setFormState(prev => ({
                ...prev,
                errors: {
                    resetPassword: error.message
                },
                loading: false
            }));
        }
    };

    const onClickBack = () => {
        navigate(-1);
    };

    const onClickCreateAccount = () => {
        navigate('/register');
    };

    const SuccessView = () => (
        <div className={styles.loginBox}>
            <div className={styles.loginBoxInner}>
                <div className={styles.logo}>
                    <MAINLOGO />
                </div>
                <h1 className={styles.headerText}>Email Sent!</h1>
                <p className={styles.descriptionText}>
                    Password reset instructions have been sent to the email address you have provided.
                </p>
            </div>
        </div>
    );

    const ResetForm = () => (
        <div className={styles.loginBox}>
            <div className={styles.loginBoxInner}>
                <div className={styles.logo}>
                    <MAINLOGO />
                </div>
                <h1 className={styles.headerText}>Forgot Password</h1>

                <div className={styles.loginForm}>
                    <Input 
                        type="email"
                        value={email}
                        name="email"
                        label="Email"
                        labelStyle={customStyle.inputLabel}
                        placeholder="Enter Email"
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        containerStyle={customStyle.inputContainer}
                        style={customStyle.input}
                        error={errors.email || null}
                    />
                </div>

                {errors.resetPassword && (
                    <ErrorBox error={errors.resetPassword} />
                )}

                <div className={styles.twoInputsContainer}>
                    <Button
                        title="Send Me A Reset Password Email"
                        loading={loading}
                        onClick={submitResetPassword}
                        color="green"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.all}>
            {success ? <SuccessView /> : <ResetForm />}
            <div className={styles.loginRight} />
        </div>
    );
}

export default ResetPassword;