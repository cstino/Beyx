import * as React from 'react';
import { render } from '@testing-library/react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const data = [
  { name: 'A', value: 80 },
  { name: 'B', value: 60 },
  { name: 'C', value: 40 },
  { name: 'D', value: 70 },
];

function TestChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis />
        <Radar dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

const App = () => {
  return (
    <div>
      <TestChart />
      <CountUp start={0} end={100} duration={1.0} />
      <motion.div>motion test</motion.div>
    </div>
  );
};

render(<App />);
