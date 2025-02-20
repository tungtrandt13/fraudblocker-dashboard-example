import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import Spinner from "react-spinkit";
import PropTypes from "prop-types";
import styles from "./LinkButton.module.scss";

class LinkButton extends PureComponent {
    render() {
        const { style, title, color, isExternal, to, customClassNames, anchorProps = {}, loading = false } = this.props;
        return !isExternal ? (
            <Link
                {...this.props}
                className={`${styles.linkBtn} ${styles[color]} ${customClassNames} ${loading ? styles.loadingLink : ""}`}
                style={style}
            >
                {!loading ? (
                    title
                ) : (
                    <div>
                        <Spinner className={styles.loader} fadeIn="none" name="double-bounce" color={"#fff"} />
                        Processing...
                    </div>
                )}{" "}
            </Link>
        ) : (
            <a href={to} className={`${styles.linkBtn} ${styles[color]}`} style={style} {...anchorProps}>
                {" "}
                {title}{" "}
            </a>
        );
    }
}

LinkButton.propTypes = {
    style: PropTypes.object,
    anchorProps: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    index: PropTypes.number,
    color: PropTypes.string,
    loading: PropTypes.bool,
    isExternal: PropTypes.bool,
    to: PropTypes.string,
    customClassNames: PropTypes.string,
};

LinkButton.defaultProps = {
    style: {},
    index: null,
    color: "blue",
    loading: undefined,
    isExternal: false,
};

export default LinkButton;
