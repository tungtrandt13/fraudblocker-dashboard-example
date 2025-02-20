import React, { PureComponent } from "react";
import PropTypes from "prop-types";

const style = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff0f5",
        border: "1px solid #fc584e",
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 4,
        color: "#fc584e",
        fontWeight: "bold",
        position: "relative",
    },
    icon: {
        position: "absolute",
        left: "15px",
        width: "16px",
    },
    text: {
        margin: 0,
        color: "#fc584e",
    },
};
class ErrorBox extends PureComponent {
    render() {
        const { error, errorStyle = {}, textStyle = {}, icon } = this.props;
        return (
            <div style={{ ...style.container, ...errorStyle }}>
                {" "}
                {icon && <img style={style.icon} src={icon} alt="warn" />}{" "}
                {typeof error === "string" ? (
                    <p
                        style={{ ...style.text, ...textStyle }}
                        dangerouslySetInnerHTML={{
                            __html: error,
                        }}
                    ></p>
                ) : (
                    <p style={{ ...style.text, ...textStyle }}> {error} </p>
                )}{" "}
            </div>
        );
    }
}

ErrorBox.propTypes = {
    error: PropTypes.any,
    errorStyle: PropTypes.any,
    textStyle: PropTypes.any,
    icon: PropTypes.any,
};

export default ErrorBox;
