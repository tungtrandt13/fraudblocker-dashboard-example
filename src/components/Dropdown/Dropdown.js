import React, { PureComponent } from "react";
import Select, { components } from "react-select";
import PropTypes from "prop-types";
import Utils from "../../utils/Utils";
import styles from "./Dropdown.module.scss";

const dropdownStyles = (open, customStyles) => ({
    menu: (provided) => ({
        ...provided,
        zIndex: 9999,
        opacity: Utils.isMobileOrTablet() ? undefined : open ? 1 : 0,
        transition: "all .3s ease-in-out",
        visibility: Utils.isMobileOrTablet() ? undefined : open ? "visible" : "hidden",
    }),
    option: (provided) => ({
        ...provided,
        overflow: "hidden",
        textOverflow: "ellipsis",
    }),
    container: (provided) => ({
        ...provided,
        backgroundColor: "rgba(240, 244, 248, 0.5)",
    }),
    control: (provided) => ({
        ...provided,
        minWidth: 150,
        backgroundColor: "rgba(240, 244, 248, 0.5)",
        height: 40,
        borderRadius: 4,
        borderColor: "#c9cdd8",
        ...(customStyles.control || {}),
    }),
});

const errorStyle = (_, customStyles) => ({
    option: (provided) => ({
        ...provided,
        overflow: "hidden",
        textOverflow: "ellipsis",
    }),
    container: (provided) => ({
        ...provided,
        backgroundColor: "rgba(252, 88, 78, 0.1)",
    }),
    control: (provided) => ({
        ...provided,
        backgroundColor: "rgba(252, 88, 78, 0.1)",
        height: 40,
        borderRadius: 4,
        borderColor: "rgba(252, 88, 78, 0.6)",
        ...(customStyles.control || {}),
    }),
});

class IconOption extends PureComponent {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    render() {
        const { data, ...props } = this.props;
        return (
            <components.Option {...props}>
                {data.icon && (
                    <img
                        src={data.icon}
                        style={{
                            width: 20,
                            marginRight: 10,
                            verticalAlign: "middle",
                        }}
                        alt={data.label}
                    />
                )}
                {data.label}
            </components.Option>
        );
    }
}

class Controller extends PureComponent {
    render() {
        const { children, ...props } = this.props;
        return (
            <components.Control {...props}>
                {props.selectProps.value && props.selectProps.value.icon && (
                    <img
                        src={props.selectProps.value.icon}
                        style={{
                            width: 20,
                            marginLeft: 10,
                            verticalAlign: "middle",
                        }}
                        alt="icon"
                    />
                )}{" "}
                {children}
            </components.Control>
        );
    }
}

class Dropdown extends PureComponent {
    static propTypes = {
        value: PropTypes.any,
        name: PropTypes.string,
        options: PropTypes.array.isRequired,
        placeholder: PropTypes.string,
        error: PropTypes.string,
        index: PropTypes.number,
        customStyles: PropTypes.object,
        disabled: PropTypes.bool,
        onOptionChange: PropTypes.func,
        label: PropTypes.any,
        target: PropTypes.any,
        labelStyle: PropTypes.object,
        containerStyle: PropTypes.object,
        selectClass: PropTypes.string,
        isSearchable: PropTypes.bool,
    };

    static defaultProps = {
        placeholder: undefined,
        error: undefined,
        disabled: false,
        name: "",
        index: null,
        customStyles: {},
        labelStyle: {},
        containerStyle: {},
        label: undefined,
        selectClass: undefined,
        isSearchable: true,
    };

    state = {
        open: false,
    };

    onChange = (selectedOption) => {
        const { index, onOptionChange } = this.props;
        console.log(index, selectedOption);
        onOptionChange(selectedOption, index);
    };

    onSelectChange = (event) => {
        const { index, onOptionChange } = this.props;
        console.log(`${index}`, event.target.value);
        onOptionChange(event.target.value, index);
    };

    toggleOpen = (val) => {
        this.setState({
            open: val,
        });
    };

    render() {
        const {
            value,
            name,
            options,
            placeholder,
            error,
            containerStyle,
            label,
            labelStyle,
            selectClass,
            customStyles = {},
            isSearchable = false,
            target,
            disabled = false,
        } = this.props;
        const { open } = this.state;

        return (
            <div style={containerStyle} className={styles.container}>
                {label && (
                    <p className={styles.label} style={labelStyle}>
                        {label}
                    </p>
                )}
                <div onClick={() => !disabled && this.toggleOpen(!open)}>
                    <Select
                        value={value}
                        name={name}
                        onBlur={() => this.toggleOpen(false)}
                        placeholder={placeholder || "Select"}
                        isDisabled={disabled}
                        onChange={this.onChange}
                        styles={error ? errorStyle(open, customStyles) : dropdownStyles(open, customStyles)}
                        options={options}
                        className={selectClass}
                        components={{
                            Option: IconOption,
                            Control: Controller,
                        }}
                        isSearchable={isSearchable}
                        menuPortalTarget={target || undefined}
                        classNamePrefix="react-select"
                    />
                </div>
                {error && <p className={styles.errorText}>{error}</p>}
            </div>
        );
    }
}

export default Dropdown;
