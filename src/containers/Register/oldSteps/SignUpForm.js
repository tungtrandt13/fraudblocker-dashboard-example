import React, { useState } from 'react';
import { parseDomain, fromUrl } from 'parse-domain';
import PropTypes from 'prop-types';
import styles from './RegisterForms.module.scss';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Validation from '../../../utils/Validation';
import User from '../../../redux/actions/User';
import UserApi from '../../../api/Users';
import ErrorBox from '../../../components/ErrorBox/ErrorBox';

const customStyles = {
    input: {
        marginBottom: 25
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666'
    }
};

function SignUpForm({ onClickNext, createUser, setEmail, email }) {
    const [formState, setFormState] = useState({
        domain: '',
        password: '',
        errors: {},
        loading: false
    });

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleInputChange = event => {
        const { value, name } = event.target;

        if (name === 'email') {
            setEmail(value);
            return;
        }

        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const parseDomainUrl = domain => {
        try {
            const parseResult = parseDomain(fromUrl(domain));
            let parsedDomain = `${parseResult.icann.domain}.${parseResult.icann.topLevelDomains.join('.')}`;
            
            if (parseResult.icann.subDomains?.length) {
                const subDomains = parseResult.icann.subDomains.filter(
                    name => name.toLowerCase() !== 'www'
                );
                if (subDomains.length) {
                    parsedDomain = `${subDomains.join('.')}.${parsedDomain}`;
                }
            }
            
            return parsedDomain;
        } catch (error) {
            console.error('Error parsing domain:', error);
            return domain;
        }
    };

    const handleSubmit = async () => {
        setFormState(prev => ({ ...prev, loading: true }));
        
        const { domain, password } = formState;
        const data = { domain, email, password };

        const newErrors = Validation.validateForm(data);
        if (newErrors) {
            setFormState(prev => ({
                ...prev,
                errors: newErrors,
                loading: false
            }));
            return;
        }

        try {
            await UserApi.validateEmail(data.email);
            
            const result = await User.createUserWithEmailAndPassword(data.email, data.password);
            if (!result) {
                throw new Error('Error creating user account');
            }

            const parsedDomain = parseDomainUrl(data.domain);
            const userData = {
                domain: parsedDomain,
                email: data.email,
                id: result.user.uid
            };

            const createUserInDBResponse = await createUser(userData);
            if (createUserInDBResponse) {
                onClickNext(userData);
            } else {
                throw new Error('Error creating user account');
            }
        } catch (error) {
            console.error('SignUp error:', error);
            setFormState(prev => ({
                ...prev,
                errors: {
                    signUp: error.message
                },
                loading: false
            }));
        }
    };

    const handleKeyPress = e => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const { domain, password, errors, loading } = formState;

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.headerText}>Get your free account</h1>
            
            <Input
                name="domain"
                value={domain}
                onChange={handleInputChange}
                className={styles.inputContainer}
                labelStyle={customStyles.inputLabel}
                containerStyle={customStyles.input}
                label="Website to Protect"
                placeholder="example.com"
                error={errors.domain}
            />

            <Input
                name="email"
                value={email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                labelStyle={customStyles.inputLabel}
                containerStyle={customStyles.input}
                label="Email"
                placeholder="joanna@example.com"
                error={errors.email}
            />

            <Input
                name="password"
                value={password}
                type="password"
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                labelStyle={customStyles.inputLabel}
                label="Password"
                showEye
                error={errors.password}
            />

            <p className={styles.passwordInfo}>
                Your password must be at least 8 characters. 
                We recommend at least 1 lowercase, 1 uppercase, and 1 number.
            </p>

            {errors.signUp && <ErrorBox error={errors.signUp} />}

            <div className={styles.formFooterContainer}>
                <Button
                    title="Next"
                    onClick={handleSubmit}
                    style={customStyles.nextBtn}
                    customClassNames="signUpForm__nextBtn"
                    loading={loading}
                    color="green"
                />
                
                <p>
                    By clicking this button you agree to Fraud Blocker's{' '}
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
}

SignUpForm.propTypes = {
    onClickNext: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    setEmail: PropTypes.func.isRequired,
    email: PropTypes.string.isRequired
};

export default SignUpForm;