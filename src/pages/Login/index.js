import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import "./index.scss";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { ReactComponent as MAINLOGO } from "../../assets/main-logo.svg";
import Validation from "../../utils/Validation";
import User from "../../redux/actions/User";
// import DashboardLoading from '../../containers/Loading/DashboardLoading';
import ErrorBox from "../../components/ErrorBox/ErrorBox";

const customStyle = {
    input: { fontWeight: "bold" },
    inputContainer: { marginBottom: 40 },
    loginBtn: {
        fontSize: 18,
        fontWeight: "bold",
        boxShadow: "0 8px 12px 0 rgba(0, 0, 0, 0.08)",
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666666",
    },
    error: { marginBottom: 20 },
    availBtn: {
        display: "inline-flex",
        textDecoration: "none",
    },
};

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        keepMeLoggedIn: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const navigate = useNavigate();
    const location = useLocation();
    const login = (email, password) => dispatch(User.login(email, password));
    const auth = useSelector((state) => state.auth);
    const accounts = useSelector((state) => state.accounts);

    // useEffect(() => {
    //     document.getElementById('favicon').href = 'signup-favicon.ico';
    // }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const submitLogin = async () => {
        setLoading(true);
        const { email, password } = formData;
        const data = { email, password };

        const newErrors = Validation.validateForm(data);
        if (newErrors) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const result = await login(email, password);
            if (result) {
                setLoading(false);
                setErrors({});
            }
        } catch (error) {
            setErrors({ login: error.message });
            setLoading(false);
        }
    };

    const handleKeepMeLoggedIn = () => {
        setFormData((prev) => ({
            ...prev,
            keepMeLoggedIn: !prev.keepMeLoggedIn,
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            submitLogin();
        }
    };

    // if (auth.isFetching || accounts.isFetching) {
    //     return <div />;
    // }

    if (auth.user && accounts.data) {
        const parsed = new URLSearchParams(location.search);
        if (parsed.get("destination")) {
            return <Navigate to={parsed.get("destination")} replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="all">
            <Helmet>
                <title>Login | Fraud Blocker</title>
            </Helmet>
            <div className={"loginBox"}>
                <div className={"loginBoxInner"}>
                    <div className={"logo"}>
                        <MAINLOGO />
                    </div>
                    <h1 className={"welcomeText"}>Welcome Back!</h1>
                    <div className={"signUpBlock"}>
                        Don't have an account yet?{" "}
                        <Link to="/register" className={"signupLink"}>
                            Sign Up Now
                        </Link>
                    </div>
                    <div className={"loginForm"}>
                        <Input
                            type="email"
                            value={formData.email}
                            name="email"
                            label="Email"
                            labelStyle={customStyle.inputLabel}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            containerStyle={customStyle.inputContainer}
                            style={customStyle.input}
                            error={errors.email || null}
                        />
                        <Input
                            showEye
                            type="password"
                            value={formData.password}
                            name="password"
                            label="Password"
                            labelStyle={customStyle.inputLabel}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            containerStyle={customStyle.inputContainer}
                            style={customStyle.input}
                            error={errors.password || null}
                        />
                    </div>

                    {errors.login && <ErrorBox errorStyle={customStyle.error} error={errors.login} />}

                    {!errors.login && auth.isDeleted && (
                        <ErrorBox
                            errorStyle={customStyle.error}
                            error="Unable to log you in, please contact support for assistance"
                        />
                    )}

                    <div onClick={handleKeepMeLoggedIn} className={"keepLogin"}>
                        <div className={"keepMeLoggedInContainer"}>
                            <input
                                type="checkbox"
                                className={"checkbox"}
                                checked={formData.keepMeLoggedIn}
                                onChange={handleKeepMeLoggedIn}
                                name="keepMeLoggedIn"
                            />
                        </div>
                        Keep me logged in
                    </div>

                    <div className={"twoInputsContainer"}>
                        <Button
                            title="Login To My Account"
                            color="green"
                            style={customStyle.loginBtn}
                            onClick={submitLogin}
                            loading={loading}
                        />
                    </div>

                    <div className={"bottomContainer"}>
                        <p className="green" onClick={() => navigate("/reset-password")}>
                            Forgot Password?
                        </p>
                    </div>
                </div>
            </div>
            <div className={"loginRight"}></div>
        </div>
    );
}

Login.propTypes = {
    auth: PropTypes.object,
    accounts: PropTypes.object,
};

export default Login;
