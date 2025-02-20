import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ReactComponent as SuccessIcon } from "../../assets/success-icon.svg";

const styles = {
    container: {
        display: "inline-flex",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#f8fffa",
        paddingLeft: 20,
        paddingRight: 40,
        paddingTop: 15,
        paddingBottom: 15,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 4,
        fontSize: 14,
        border: "solid 1px #a6ffb0",
    },
    text: {
        marginLeft: 8,
        color: "#0caf1d",
    },
    overrideText: {
        color: "#0caf1d",
    },
};
class SuccessBox extends PureComponent {
    render() {
        const { message, style = {}, className = "", override = false } = this.props;
        return (
            <div style={{ ...styles.container, ...style }} className={className}>
                {" "}
                {!override && <SuccessIcon />}{" "}
                {override ? (
                    <p style={styles.overrideText}> {message} </p>
                ) : (
                    <p style={styles.text}>
                        <strong> Success! </strong> {message}{" "}
                    </p>
                )}{" "}
            </div>
        );
    }
}

SuccessBox.propTypes = {
    message: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    override: PropTypes.bool,
};

export default SuccessBox;
