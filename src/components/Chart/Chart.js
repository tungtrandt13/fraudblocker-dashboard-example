import React from 'react';
import PropTypes from 'prop-types';
import {
    ComposedChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import CustomTooltip from './CustomTooltip';

const CHART_STYLES = {
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
        fill: '#bbc4ea'
    },
    areaGradient: {
        id: 'colorUv',
        x1: '0',
        y1: '20%',
        x2: '0',
        y2: '80%',
        stops: [
            { offset: '0%', color: '#e5edff', opacity: 1 },
            { offset: '100%', color: '#fff', opacity: 1 }
        ]
    },
    cartesianGrid: {
        strokeDasharray: '5 5',
        stroke: '#f5f5f5'
    },
    bar: {
        radius: [7, 7, 0, 0],
        barSize: 45,
        fill: '#fa776f'
    }
};

const Chart = ({ data = [] }) => {
    const renderGradient = () => (
        <defs>
            <linearGradient
                id={CHART_STYLES.areaGradient.id}
                x1={CHART_STYLES.areaGradient.x1}
                y1={CHART_STYLES.areaGradient.y1}
                x2={CHART_STYLES.areaGradient.x2}
                y2={CHART_STYLES.areaGradient.y2}
            >
                {CHART_STYLES.areaGradient.stops.map((stop, index) => (
                    <stop
                        key={index}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                    />
                ))}
            </linearGradient>
        </defs>
    );

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data}>
                {renderGradient()}
                
                <CartesianGrid 
                    strokeDasharray={CHART_STYLES.cartesianGrid.strokeDasharray}
                    vertical={false}
                    stroke={CHART_STYLES.cartesianGrid.stroke}
                />
                
                <XAxis 
                    dy={15}
                    tickLine={false}
                    dataKey="name"
                />
                
                <YAxis 
                    yAxisId="right"
                    orientation="right"
                    dx={15}
                    tickLine={false}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Area 
                    yAxisId="right"
                    type="monotone"
                    dataKey="uv"
                    fill={`url(#${CHART_STYLES.areaGradient.id})`}
                    stroke="#bbc4ea10"
                />
                
                <Bar 
                    yAxisId="right"
                    dataKey="pv"
                    radius={CHART_STYLES.bar.radius}
                    barSize={CHART_STYLES.bar.barSize}
                    fill={CHART_STYLES.bar.fill}
                />
                
                <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="uv"
                    stroke="#bbc4ea10"
                    dot={false}
                    activeDot={CHART_STYLES.activeDot}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

Chart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            uv: PropTypes.number,
            pv: PropTypes.number
        })
    )
};

Chart.defaultProps = {
    data: []
};

export default React.memo(Chart);

// Optional: Enhanced version with loading and error states
const EnhancedChart = ({ data, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="chart-loading">
                Loading chart data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="chart-error">
                Error loading chart: {error.message}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                No data available to display
            </div>
        );
    }

    return <Chart data={data} />;
};

EnhancedChart.propTypes = {
    ...Chart.propTypes,
    isLoading: PropTypes.bool,
    error: PropTypes.object
};

EnhancedChart.defaultProps = {
    ...Chart.defaultProps,
    isLoading: false,
    error: null
};

// Export both versions
export { EnhancedChart };
