import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.scss';

class Button extends PureComponent {
    onBtnClick = () => {
        const { index, onClick } = this.props;
        onClick(index);
    };

    renderLoader() {
        const { color } = this.props;
        return (
            <div className={styles.loader}>
                <div 
                    className={styles.bouncer} 
                    style={{
                        backgroundColor: color === 'outline-red' ? '#ffa6a6' : '#fff'
                    }}
                />
                <div 
                    className={styles.bouncer} 
                    style={{
                        backgroundColor: color === 'outline-red' ? '#ffa6a6' : '#fff'
                    }}
                />
            </div>
        );
    }

    render() {
        const {
            style,
            title,
            color,
            loading,
            disabled = false,
            customClassNames = ''
        } = this.props;

        return (
            <button
                className={`${styles.button} ${styles[color]} ${customClassNames}`}
                onClick={this.onBtnClick}
                style={style}
                disabled={disabled || loading}
            >
                {loading ? this.renderLoader() : title}
            </button>
        );
    }
}

Button.propTypes = {
    style: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    index: PropTypes.number,
    color: PropTypes.string,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    customClassNames: PropTypes.string
};

Button.defaultProps = {
    style: {},
    index: null,
    color: 'blue',
    loading: false,
    disabled: false
};

export default Button;