import React, { useState } from 'react';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { TruckIcon, CubeIcon, ChartBarIcon, BuildingOfficeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const LogisticsOptimizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shipping');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Form states
  const [shippingForm, setShippingForm] = useState({
    origin: '',
    destination: '',
    constraints: ''
  });

  const [inventoryForm, setInventoryForm] = useState({
    historicalData: '',
    currentStock: '',
    leadTimes: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    supplierData: '',
    orderHistory: ''
  });

  const [warehouseForm, setWarehouseForm] = useState({
    currentLayout: '',
    inventoryData: '',
    orderPatterns: ''
  });

  const [procurementForm, setProcurementForm] = useState({
    procurementData: '',
    marketTrends: ''
  });

  const tabs = [
    { id: 'shipping', name: 'Shipping Route Optimization', icon: TruckIcon },
    { id: 'inventory', name: 'Inventory Forecasting', icon: CubeIcon },
    { id: 'supplier', name: 'Supplier Analysis', icon: ChartBarIcon },
    { id: 'warehouse', name: 'Warehouse Layout', icon: BuildingOfficeIcon },
    { id: 'procurement', name: 'Procurement Insights', icon: ShoppingCartIcon },
  ];

  const renderShippingForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Origin
        </label>
        <input
          type="text"
          value={shippingForm.origin}
          onChange={(e) => setShippingForm(prev => ({ ...prev, origin: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          placeholder="e.g., New York, NY"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Destination
        </label>
        <input
          type="text"
          value={shippingForm.destination}
          onChange={(e) => setShippingForm(prev => ({ ...prev, destination: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          placeholder="e.g., Los Angeles, CA"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Constraints (JSON)
        </label>
        <textarea
          value={shippingForm.constraints}
          onChange={(e) => setShippingForm(prev => ({ ...prev, constraints: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"maxCost": 5000, "timeLimit": "48h", "preferredCarrier": "FedEx"}'
        />
      </div>
      <button
        onClick={() => {
          setIsLoading(true);
          // Simulate an async operation
          setTimeout(() => {
            setResults(prev => [...prev, {
              type: 'shipping',
              data: {
                route: `${shippingForm.origin} to ${shippingForm.destination}`,
                estimatedCost: 2500,
                estimatedTime: '2 days'
              },
              timestamp: new Date()
            }]);
            setIsLoading(false);
          }, 1000);
        }}
        disabled={isLoading || !shippingForm.origin || !shippingForm.destination}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Optimize Route'}
      </button>
    </div>
  );

  const renderInventoryForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Historical Data (JSON)
        </label>
        <textarea
          value={inventoryForm.historicalData}
          onChange={(e) => setInventoryForm(prev => ({ ...prev, historicalData: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"monthly_sales": [100, 120, 90, 150], "seasonal_factors": [1.2, 1.1, 0.9, 1.3]}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Current Stock (JSON)
        </label>
        <textarea
          value={inventoryForm.currentStock}
          onChange={(e) => setInventoryForm(prev => ({ ...prev, currentStock: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"item_A": 50, "item_B": 30, "item_C": 75}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Lead Times (JSON)
        </label>
        <textarea
          value={inventoryForm.leadTimes}
          onChange={(e) => setInventoryForm(prev => ({ ...prev, leadTimes: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"item_A": 7, "item_B": 14, "item_C": 3}'
        />
      </div>
      <button
        onClick={() => {
          setIsLoading(true);
          // Simulate an async operation
          setTimeout(() => {
            setResults(prev => [...prev, {
              type: 'inventory',
              data: {
                forecast: {
                  item_A: 60,
                  item_B: 35,
                  item_C: 80
                },
                confidence: 0.95
              },
              timestamp: new Date()
            }]);
            setIsLoading(false);
          }, 1000);
        }}
        disabled={isLoading || !inventoryForm.historicalData || !inventoryForm.currentStock}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Generate Forecast'}
      </button>
    </div>
  );

  const renderSupplierForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Supplier Data (JSON)
        </label>
        <textarea
          value={supplierForm.supplierData}
          onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierData: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"name": "Supplier A", "rating": 4.2, "delivery_time": 5, "quality_score": 0.95}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Order History (JSON)
        </label>
        <textarea
          value={supplierForm.orderHistory}
          onChange={(e) => setSupplierForm(prev => ({ ...prev, orderHistory: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='[{"order_id": "123", "delivery_date": "2024-01-15", "on_time": true, "quality": "excellent"}]'
        />
      </div>
      <button
        onClick={() => {
          setIsLoading(true);
          // Simulate an async operation
          setTimeout(() => {
            setResults(prev => [...prev, {
              type: 'supplier',
              data: {
                performance: {
                  name: "Supplier A",
                  rating: 4.2,
                  delivery_time: 5,
                  quality_score: 0.95
                },
                insights: "Supplier A consistently delivers on time and maintains high quality."
              },
              timestamp: new Date()
            }]);
            setIsLoading(false);
          }, 1000);
        }}
        disabled={isLoading || !supplierForm.supplierData || !supplierForm.orderHistory}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Analyze Performance'}
      </button>
    </div>
  );

  const renderWarehouseForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Current Layout (JSON)
        </label>
        <textarea
          value={warehouseForm.currentLayout}
          onChange={(e) => setWarehouseForm(prev => ({ ...prev, currentLayout: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"zones": [{"name": "Zone A", "items": ["item1", "item2"], "pick_time": 2.5}]}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Inventory Data (JSON)
        </label>
        <textarea
          value={warehouseForm.inventoryData}
          onChange={(e) => setWarehouseForm(prev => ({ ...prev, inventoryData: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"item1": {"quantity": 100, "size": "small", "frequency": "high"}}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Order Patterns (JSON)
        </label>
        <textarea
          value={warehouseForm.orderPatterns}
          onChange={(e) => setWarehouseForm(prev => ({ ...prev, orderPatterns: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"peak_hours": [9, 10, 11], "popular_combinations": [["item1", "item2"]]}'
        />
      </div>
      <button
        onClick={() => {
          setIsLoading(true);
          // Simulate an async operation
          setTimeout(() => {
            setResults(prev => [...prev, {
              type: 'warehouse',
              data: {
                optimized_layout: {
                  zones: [
                    { name: "Zone A", items: ["item1", "item2"], pick_time: 2.5 },
                    { name: "Zone B", items: ["item3", "item4"], pick_time: 3.0 }
                  ]
                },
                justification: "Optimized layout based on inventory density and pick times."
              },
              timestamp: new Date()
            }]);
            setIsLoading(false);
          }, 1000);
        }}
        disabled={isLoading || !warehouseForm.currentLayout || !warehouseForm.inventoryData}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Optimize Layout'}
      </button>
    </div>
  );

  const renderProcurementForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Procurement Data (JSON)
        </label>
        <textarea
          value={procurementForm.procurementData}
          onChange={(e) => setProcurementForm(prev => ({ ...prev, procurementData: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"spend": 50000, "suppliers": ["A", "B", "C"], "categories": ["electronics", "office"]}'
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Market Trends (JSON)
        </label>
        <textarea
          value={procurementForm.marketTrends}
          onChange={(e) => setProcurementForm(prev => ({ ...prev, marketTrends: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          placeholder='{"inflation_rate": 0.03, "supply_chain_issues": ["electronics"], "commodity_prices": {"steel": "up"}}'
        />
      </div>
      <button
        onClick={() => {
          setIsLoading(true);
          // Simulate an async operation
          setTimeout(() => {
            setResults(prev => [...prev, {
              type: 'procurement',
              data: {
                insights: {
                  procurement_spend: 50000,
                  market_trends: {
                    inflation_rate: 0.03,
                    supply_chain_issues: ["electronics"],
                    commodity_prices: { steel: "up" }
                  },
                  recommendations: ["Consider bulk purchasing for steel to reduce costs."]
                }
              },
              timestamp: new Date()
            }]);
            setIsLoading(false);
          }, 1000);
        }}
        disabled={isLoading || !procurementForm.procurementData}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Generate Insights'}
      </button>
    </div>
  );

  const renderResults = () => (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
        AI Optimization Results
      </h3>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-white dark:bg-secondary-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                {result.type} Optimization
              </h4>
              <span className="text-sm text-secondary-500">
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <pre className="text-sm bg-secondary-50 dark:bg-secondary-900 p-3 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          AI-Powered Logistics Optimization
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Leverage Gemini AI to optimize shipping routes, forecast inventory, analyze suppliers, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow">
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Optimization Tools
              </h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-700'
                      }`}
                    >
                      <tab.icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow">
            <div className="p-6">
              {activeTab === 'shipping' && renderShippingForm()}
              {activeTab === 'inventory' && renderInventoryForm()}
              {activeTab === 'supplier' && renderSupplierForm()}
              {activeTab === 'warehouse' && renderWarehouseForm()}
              {activeTab === 'procurement' && renderProcurementForm()}
            </div>
          </div>

          {results.length > 0 && renderResults()}
        </div>
      </div>
    </div>
  );
};

export default LogisticsOptimizationPage; 