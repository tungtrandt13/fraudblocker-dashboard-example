import React, {
    PureComponent
} from 'react';
import ReactSwitch from 'react-switch';
import PropTypes from 'prop-types';
import styles from './Switch.module.scss';

class Switch extends PureComponent {
    onSwitchChange = () => {
        const {
            name,
            onChange,
            index
        } = this.props;
        onChange(name, index);
    };

    render() {
        const {
            checked,
            onColor,
            disabled,
            className = ''
        } = this.props;
        return ( <
            ReactSwitch onChange = {
                this.onSwitchChange
            }
            uncheckedIcon = {
                false
            }
            checkedIcon = {
                false
            }
            offColor = "#9b9b9b"
            onColor = {
                onColor
            }
            height = {
                24
            }
            width = {
                41
            }
            handleDiameter = {
                20
            }
            className = {
                `${styles.switch} ${className}`
            }
            checked = {
                checked
            }
            disabled = {
                disabled
            }
            />
        );
    }
}

Switch.propTypes = {
    onChange: PropTypes.func.isRequired,
    checked: PropTypes.bool.isRequired,
    name: PropTypes.string,
    index: PropTypes.number,
    className: PropTypes.string,
    onColor: PropTypes.string,
    disabled: PropTypes.bool
};

Switch.defaultProps = {
    name: '',
    index: null,
    onColor: '#286cff',
    disabled: false
};

export default Switch;