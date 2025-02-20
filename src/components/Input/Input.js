import React, { useState } from "react";
import PropTypes from "prop-types";
import InputMask from "react-input-mask";
import styles from "./Input.module.scss";
import InputContainer from "../InputContainer/InputContainer";
import EYE_SHOW from "../../assets/pass-show.svg";
import EYE_HIDE from "../../assets/pass-hide.svg";

const customStyle = {
    errorState: {
        borderColor: "rgba(252, 88, 78, 0.6)",
        backgroundColor: "rgba(252, 88, 78, 0.1)",
    },
    eye: {
        position: "absolute",
        top: "33px",
        right: "15px",
        cursor: "pointer",
    },
    icon: {
        position: "absolute",
        top: "38px",
        right: "15px",
        cursor: "pointer",
        height: "22px",
        width: "22px",
    },
    container: {
        position: "relative",
    },
    disabledContainer: {
        pointerEvents: "none",
    },
};

function Input({
    type = "text",
    value,
    placeholder = "",
    label,
    labelStyle = {},
    error,
    name,
    style = {},
    containerStyle = {},
    onKeyPress,
    errorStyle,
    showEye = false,
    disabled = false,
    autoSuggest = true,
    mask,
    maskChar,
    pattern,
    icon = null,
    index,
    onChange,
}) {
    const [showPass, setShowPass] = useState(false);

    const togglePassword = () => {
        setShowPass((prev) => !prev);
    };

    const handleInputChange = (event) => {
        onChange(event, index);
    };

    const inputStyle = error ? { ...style, ...customStyle.errorState } : style;
    const containerRules = containerStyle ? { ...customStyle.container, ...containerStyle } : customStyle.container;

    const finalContainerStyle = disabled ? { ...containerRules, ...customStyle.disabledContainer } : containerRules;

    const renderInput = () => {
        if (!mask) {
            return (
                <>
                    <input
                        type={showPass ? "text" : type}
                        value={value}
                        disabled={disabled}
                        name={name}
                        placeholder={placeholder}
                        onKeyPress={onKeyPress}
                        onChange={handleInputChange}
                        className={styles.input}
                        style={inputStyle}
                        autoComplete={autoSuggest ? "on" : "off"}
                        pattern={pattern}
                    />
                    {showEye && (
                        <img
                            style={customStyle.eye}
                            src={showPass ? EYE_HIDE : EYE_SHOW}
                            onClick={togglePassword}
                            alt={`${showPass ? "hide" : "show"} password`}
                            className="passEye"
                        />
                    )}
                    {icon && <img style={customStyle.icon} src={icon} alt="input icon" className="input-icon" />}
                </>
            );
        }

        return (
            <InputMask
                value={value}
                disabled={disabled}
                name={name}
                placeholder={placeholder}
                onKeyPress={onKeyPress}
                onChange={handleInputChange}
                className={styles.input}
                style={inputStyle}
                mask={mask}
                maskChar={maskChar}
            />
        );
    };

    return (
        <InputContainer containerStyle={finalContainerStyle} labelStyle={labelStyle} label={label}>
            {renderInput()}
            {error && (
                <p className={styles.errorText} style={errorStyle}>
                    {error}
                </p>
            )}
        </InputContainer>
    );
}

Input.propTypes = {
    type: PropTypes.string,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    style: PropTypes.object,
    index: PropTypes.number,
    error: PropTypes.string,
    label: PropTypes.any,
    labelStyle: PropTypes.object,
    containerStyle: PropTypes.object,
    onKeyPress: PropTypes.func,
    errorStyle: PropTypes.any,
    showEye: PropTypes.bool,
    disabled: PropTypes.bool,
    autoSuggest: PropTypes.bool,
    mask: PropTypes.string,
    maskChar: PropTypes.string,
    pattern: PropTypes.string,
    icon: PropTypes.any,
};

Input.defaultProps = {
    type: "text",
    style: {},
    labelStyle: {},
    containerStyle: {},
    placeholder: "",
    error: undefined,
    label: undefined,
    showEye: false,
    disabled: false,
    autoSuggest: true,
    icon: null,
};

export default Input;
