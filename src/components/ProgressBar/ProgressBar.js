import React, { PureComponent } from "react";
import PropTypes from "prop-types";
// import 'from' './ProgressBar.module.scss';

class ProgressBar extends PureComponent {
    static propTypes = {
        percentage: PropTypes.number.isRequired,
        style: PropTypes.object,
        color: PropTypes.string,
    };

    static defaultProps = {
        style: {},
        color: undefined,
    };

    constructor(props) {
        super(props);
        this.state = {
            fillStyle: {
                width: 0,
                backgroundColor: props.color,
            },
        };
    }

    componentDidMount() {
        this.updateProgressBar();
    }

    componentDidUpdate(prevProps) {
        const { color, percentage } = this.props;
        const hasColorChanged = color !== prevProps.color;
        const hasPercentageChanged = percentage !== prevProps.percentage;

        if (hasColorChanged || hasPercentageChanged) {
            this.updateProgressBar();
        }
    }

    updateProgressBar = () => {
        const { color, percentage } = this.props;

        if (color) {
            this.setState((prevState) => ({
                fillStyle: {
                    ...prevState.fillStyle,
                    backgroundColor: color,
                },
            }));
        }

        if (percentage !== undefined) {
            setTimeout(() => {
                this.setState((prevState) => ({
                    fillStyle: {
                        ...prevState.fillStyle,
                        width: `${percentage}%`,
                    },
                }));
            }, 1000);
        }
    };

    render() {
        const { style } = this.props;
        const { fillStyle } = this.state;

        return (
            <div className={"bar"} style={style}>
                <div className={"fill"} style={fillStyle} />
            </div>
        );
    }
}

export default ProgressBar;
