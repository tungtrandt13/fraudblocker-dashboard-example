import React from "react";
import ReactSwitch from "react-switch";
import PropTypes from "prop-types";

const Switch = ({
    onChange,
    checked,
    name = "",
    index = null,
    className = "",
    onColor = "#286cff",
    disabled = false,
}) => {
    const onSwitchChange = () => {
        onChange(name, index);
    };

    return (
        <ReactSwitch
            onChange={onSwitchChange}
            uncheckedIcon={false}
            checkedIcon={false}
            offColor="#9b9b9b"
            onColor={onColor}
            height={24}
            width={41}
            handleDiameter={20}
            className={`${className}`}
            checked={checked}
            disabled={disabled}
        />
    );
};

Switch.propTypes = {
    onChange: PropTypes.func.isRequired,
    checked: PropTypes.bool.isRequired,
    name: PropTypes.string,
    index: PropTypes.number,
    className: PropTypes.string,
    onColor: PropTypes.string,
    disabled: PropTypes.bool,
};

Switch.defaultProps = {
    name: "",
    index: null,
    onColor: "#286cff",
    disabled: false,
};

export default Switch;
