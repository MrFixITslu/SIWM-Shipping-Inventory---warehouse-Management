import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    borderRadius?: number;
    borderSkipped?: boolean;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointBorderWidth?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
}

interface DashboardChartsProps {
  shipmentData: any[];
  workflowMetrics: any[];
  itemsBelowReorderPoint: any[];
  itemsAtRiskOfStockOut: any[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  shipmentData,
  workflowMetrics,
  itemsBelowReorderPoint,
  itemsAtRiskOfStockOut,
}) => {
  // Shipment Trends Chart
  const shipmentChartData: ChartData = {
    labels: shipmentData.map(item => item.name),
    datasets: [
      {
        label: 'Incoming Shipments',
        data: shipmentData.map(item => item.incoming),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Outgoing Shipments',
        data: shipmentData.map(item => item.outgoing),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Stock Risk Analysis Chart
  const stockRiskData: ChartData = {
    labels: ['Below Reorder Point', 'At Risk of Stock-Out', 'Healthy Stock'],
    datasets: [
      {
        label: 'Items Count',
        data: [
          itemsBelowReorderPoint.length,
          itemsAtRiskOfStockOut.length,
          Math.max(0, 100 - itemsBelowReorderPoint.length - itemsAtRiskOfStockOut.length), // Placeholder
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Workflow Performance Line Chart
  const workflowChartData: ChartData = {
    labels: workflowMetrics.map(metric => metric.title),
    datasets: [
      {
        label: 'Performance Score',
        data: workflowMetrics.map(metric => {
          // Extract numeric value from string (e.g., "85%" -> 85)
          const value = metric.value.replace(/[^\d]/g, '');
          return parseInt(value) || 0;
        }),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11,
            weight: 'normal' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value + '%';
          },
        },
        max: 100,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="space-y-6">
      {/* Shipment Trends Chart */}
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
          Shipment Trends (Last 6 Months)
        </h3>
        <div className="h-80">
          <Bar data={shipmentChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Stock Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
            Stock Risk Analysis
          </h3>
          <div className="h-64">
            <Doughnut data={stockRiskData} options={doughnutChartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
            Workflow Performance
          </h3>
          <div className="h-64">
            <Line data={workflowChartData} options={lineChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 