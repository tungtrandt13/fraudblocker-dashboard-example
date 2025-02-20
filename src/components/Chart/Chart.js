import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CustomTooltip from "./CustomTooltip";

const styles = {
    dot: {
        stroke: "#fff",
        strokeWidth: 2,
        r: 5,
        fill: "#bbc4ea",
    },
    activeDot: {
        stroke: "#fff",
        strokeWidth: 2,
        r: 5,
        fill: "#bbc4ea",
    },
};
class Chart extends PureComponent {
    render() {
        return (
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={this.props.data || []}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="20%" x2="0" y2="80%">
                            <stop offset="0%" stopColor="#e5edff" stopOpacity={1} />{" "}
                            <stop offset="100%" stopColor="#fff" stopOpacity={1} />{" "}
                        </linearGradient>{" "}
                    </defs>{" "}
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f5f5f5" />
                    <XAxis dy={15} tickLine={false} dataKey="name" />{" "}
                    {/* <YAxis yAxisId="left" dx={-15} tickLine={false} /> */}{" "}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        dx={15}
                        tickLine={false}
                        // domain={[0, 'dataMax + 25']}
                    />{" "}
                    <Tooltip content={<CustomTooltip />} />{" "}
                    <Area yAxisId="right" type="monotone" dataKey="uv" fill="url(#colorUv)" stroke="#bbc4ea10" />
                    <Bar yAxisId="right" dataKey="pv" radius={[7, 7, 0, 0]} barSize={45} fill="#fa776f" />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="uv"
                        stroke="#bbc4ea10"
                        dot={false}
                        activeDot={styles.activeDot}
                    />{" "}
                </ComposedChart>{" "}
            </ResponsiveContainer>
        );
    }
}

Chart.propTypes = {
    data: PropTypes.array,
};

export default Chart;
