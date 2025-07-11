import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { SupportTicket, SupportTicketResponse, User, ColumnDefinition } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlusIcon, 
  ChatIcon, 
  BuildingOfficeIcon
} from '@/constants';
import { WarningIcon, SuccessIcon, UserCircleIcon } from '@/constants/icons';

interface CustomerSupportPageProps {}

const CustomerSupportPage: React.FC<CustomerSupportPageProps> = () => {
  const { user } = useAuth();
  
  // State for tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  
  // State for new ticket
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const,
    warehouse_id: undefined as number | undefined,
    related_order_id: undefined as number | undefined,
    related_shipment_id: undefined as number | undefined
  });

  // State for new response
  const [newResponse, setNewResponse] = useState({
    message: '',
    is_internal: false
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would be replaced with actual API call
      const mockTickets: SupportTicket[] = [
        {
          id: 1,
          ticket_number: 'TKT-2024-001',
          title: 'Inventory discrepancy in Warehouse A',
          description: 'Found 5 items missing from inventory count',
          category: 'inventory',
          priority: 'high',
          status: 'open',
          assigned_to: 2,
          created_by: 1,
          warehouse_id: 1,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          ticket_number: 'TKT-2024-002',
          title: 'Shipment delayed - tracking issue',
          description: 'Customer reported delayed delivery',
          category: 'shipping',
          priority: 'critical',
          status: 'in_progress',
          assigned_to: 3,
          created_by: 1,
          related_shipment_id: 123,
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-15T09:15:00Z'
        }
      ];
      setTickets(mockTickets);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Handle create ticket
  const handleCreateTicket = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      // This would be replaced with actual API call
      const newTicketData: SupportTicket = {
        id: tickets.length + 1,
        ticket_number: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
        created_by: user?.id || 1,
        warehouse_id: newTicket.warehouse_id,
        related_order_id: newTicket.related_order_id,
        related_shipment_id: newTicket.related_shipment_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTickets(prev => [newTicketData, ...prev]);
      setIsTicketModalOpen(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        warehouse_id: undefined,
        related_order_id: undefined,
        related_shipment_id: undefined
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create ticket');
    } finally {
      setIsSaving(false);
    }
  }, [newTicket, tickets, user]);

  // Handle add response
  const handleAddResponse = useCallback(async () => {
    if (!selectedTicket) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // This would be replaced with actual API call
      const newResponseData: SupportTicketResponse = {
        id: Math.random(),
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newResponse.message,
        is_internal: newResponse.is_internal,
        created_at: new Date().toISOString()
      };

      // Update ticket status if response is from assigned user
      const updatedTicket = {
        ...selectedTicket,
        status: newResponse.is_internal ? selectedTicket.status : 'in_progress',
        updated_at: new Date().toISOString()
      };

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setIsResponseModalOpen(false);
      setNewResponse({ message: '', is_internal: false });
    } catch (error: any) {
      setError(error.message || 'Failed to add response');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTicket, newResponse, user]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Table columns
  const columns: ColumnDefinition<SupportTicket, keyof SupportTicket>[] = [
    { key: 'ticket_number', header: 'Ticket #' },
    { key: 'title', header: 'Title' },
    { 
      key: 'priority', 
      header: 'Priority',
      render: (ticket: SupportTicket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (ticket: SupportTicket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      )
    },
    { key: 'category', header: 'Category' },
    { 
      key: 'created_at', 
      header: 'Created',
      render: (ticket: SupportTicket) => new Date(ticket.created_at).toLocaleDateString()
    }
  ];

  if (isLoading) {
    return (
      <PageContainer title="Customer Support">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
          <p className="ml-4 text-lg">Loading support tickets...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Customer Support"
      actions={
        <button
          onClick={() => setIsTicketModalOpen(true)}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Ticket
        </button>
      }
    >
      {error && <ErrorMessage message={error} />}

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="inventory">Inventory</option>
              <option value="shipping">Shipping</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg">
        <Table
          data={filteredTickets}
          columns={columns}
          actions={(ticket: SupportTicket) => (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsResponseModalOpen(true);
                }}
                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
              >
                <ChatIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Create New Support Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTicket.title}
              onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Description
            </label>
            <textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Category
              </label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              >
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="inventory">Inventory</option>
                <option value="shipping">Shipping</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Priority
              </label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsTicketModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={isSaving || !newTicket.title || !newTicket.description}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner className="w-4 h-4" /> : 'Create Ticket'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Response Modal */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title={`Add Response - ${selectedTicket?.ticket_number}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Response
            </label>
            <textarea
              value={newResponse.message}
              onChange={(e) => setNewResponse(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              placeholder="Enter your response..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="internal-note"
              checked={newResponse.is_internal}
              onChange={(e) => setNewResponse(prev => ({ ...prev, is_internal: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="internal-note" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
              Internal note (not visible to customer)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsResponseModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddResponse}
              disabled={isSaving || !newResponse.message}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner className="w-4 h-4" /> : 'Add Response'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default CustomerSupportPage; 