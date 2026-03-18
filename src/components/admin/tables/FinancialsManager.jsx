import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  PaperClipIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline'
import { 
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid 
} from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const FinancialsManager = () => {
  const { adminUser } = useAdminAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState('month')
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  })

  // File upload state
  const [attachmentFile, setAttachmentFile] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateSummary()
  }, [transactions])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('financial_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true })
      
      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:category_id (
            name,
            type,
            color
          )
        `)
        .order('transaction_date', { ascending: false })
      
      if (transactionsError) throw transactionsError

      // Format transactions
      const formattedTransactions = transactionsData.map(t => ({
        ...t,
        category_name: t.category?.name || 'Uncategorized',
        category_color: t.category?.color || '#6B7280'
      }))
      
      setTransactions(formattedTransactions)
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = () => {
    const income = transactions.filter(t => t.type === 'income')
    const expenses = transactions.filter(t => t.type === 'expense')
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    
    setSummary({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      incomeCount: income.length,
      expenseCount: expenses.length
    })
  }

  const handleAdd = () => {
    setEditingTransaction(null)
    setAttachmentFile(null)
    setShowModal(true)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setAttachmentFile(null)
    setShowModal(true)
  }

  const handleDelete = async (transaction) => {
    if (!confirm(`Are you sure you want to delete this transaction?`)) return

    try {
      // Delete attachment if exists
      if (transaction.attachment_url) {
        const filePath = transaction.attachment_url.split('/').pop()
        await supabase.storage
          .from('financial-attachments')
          .remove([filePath])
      }

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transaction.id)
      
      if (error) throw error
      
      toast.success('Transaction deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachmentFile(file)
    }
  }

  const uploadAttachment = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `attachments/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('financial-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('financial-attachments')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw error
    }
  }

  const handleSubmit = async (formData) => {
  try {
    let attachmentUrl = editingTransaction?.attachment_url || null

    // Upload new attachment if selected
    if (attachmentFile) {
      if (editingTransaction?.attachment_url) {
        const oldPath = editingTransaction.attachment_url.split('/').pop()
        await supabase.storage
          .from('financial-attachments')
          .remove([oldPath])
      }
      attachmentUrl = await uploadAttachment(attachmentFile)
    }

    // Prepare transaction data with proper null values for recurring fields
    const transactionData = {
      transaction_date: formData.transaction_date,
      description: formData.description,
      category_id: formData.category_id || null,
      amount: parseFloat(formData.amount),
      type: formData.type,
      payment_method: formData.payment_method || null,
      reference_number: formData.reference_number || null,
      receipt_number: formData.receipt_number || null,
      notes: formData.notes || null,
      attachment_url: attachmentUrl,
      is_recurring: formData.is_recurring || false,
      // Only set recurring_frequency if is_recurring is true and a frequency is selected
      recurring_frequency: formData.is_recurring && formData.recurring_frequency 
        ? formData.recurring_frequency 
        : null,
      updated_at: new Date().toISOString()
    }

    if (editingTransaction) {
      // Update existing transaction
      const { error } = await supabase
        .from('financial_transactions')
        .update(transactionData)
        .eq('id', editingTransaction.id)
      
      if (error) throw error
      toast.success('Transaction updated successfully')
    } else {
      // Create new transaction
      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transactionData,
          created_by: adminUser?.id,
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      toast.success('Transaction added successfully')
    }
    
    setShowModal(false)
    fetchData()
  } catch (error) {
    console.error('Error saving transaction:', error)
    
    // More user-friendly error messages
    if (error.message?.includes('recurring_frequency_check')) {
      toast.error('Please select a valid recurring frequency or disable recurring')
    } else if (error.message?.includes('violates check constraint')) {
      toast.error('Please check all required fields are filled correctly')
    } else {
      toast.error('Failed to save transaction: ' + (error.message || 'Unknown error'))
    }
  }
}

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter
    
    return matchesSearch && matchesType && matchesCategory
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace('KES', 'KSH')
    }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const getCategoryById = (id) => {
    return categories.find(c => c.id === id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Financial Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track income, expenses, and manage church finances.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-green-500 rounded-md p-3">
                <ArrowUpIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
                  <dd className="text-lg font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</dd>
                  <dd className="text-xs text-gray-400">{summary.incomeCount} transactions</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-red-500 rounded-md p-3">
                <ArrowDownIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                  <dd className="text-lg font-semibold text-red-600">{formatCurrency(summary.totalExpenses)}</dd>
                  <dd className="text-xs text-gray-400">{summary.expenseCount} transactions</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-indigo-500 rounded-md p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Balance</dt>
                  <dd className={`text-lg font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.balance)}
                  </dd>
                  <dd className="text-xs text-gray-400">Current period</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-purple-500 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Transaction Count</dt>
                  <dd className="text-lg font-semibold text-gray-900">{transactions.length}</dd>
                  <dd className="text-xs text-gray-400">Total transactions</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search by description or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>
        <div>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <optgroup label="Income">
              {categories.filter(c => c.type === 'income').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </optgroup>
            <optgroup label="Expenses">
              {categories.filter(c => c.type === 'expense').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reference
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payment Method
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        No transactions found. Click "Add Transaction" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          {transaction.notes && (
                            <div className="text-gray-500 text-xs">{transaction.notes}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${transaction.category_color}20`,
                              color: transaction.category_color
                            }}
                          >
                            {transaction.category_name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {transaction.reference_number || transaction.receipt_number || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {transaction.payment_method?.replace('_', ' ') || '-'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {transaction.attachment_url && (
                            <a
                              href={transaction.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 mr-3"
                              title="View attachment"
                            >
                              <PaperClipIcon className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit transaction"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete transaction"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categories}
          attachmentFile={attachmentFile}
          onAttachmentChange={handleFileChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Transaction Modal Component
const TransactionModal = ({ transaction, categories, attachmentFile, onAttachmentChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
  transaction_date: transaction?.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
  description: transaction?.description || '',
  category_id: transaction?.category_id || '',
  amount: transaction?.amount || '',
  type: transaction?.type || 'income',
  payment_method: transaction?.payment_method || '',
  reference_number: transaction?.reference_number || '',
  receipt_number: transaction?.receipt_number || '',
  notes: transaction?.notes || '',
  is_recurring: transaction?.is_recurring || false,
  recurring_frequency: transaction?.recurring_frequency || '' // Keep as empty string initially
})
  const [loading, setLoading] = useState(false)

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({...formData, type: e.target.value, category_id: ''})}
                />
                <span className="ml-2 text-sm text-gray-700">Income</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({...formData, type: e.target.value, category_id: ''})}
                />
                <span className="ml-2 text-sm text-gray-700">Expense</span>
              </label>
            </div>
          </div>

          {/* Two columns for basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.transaction_date}
                onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                required
              />
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KSH</span>
                    </div>
                    <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                    />
                </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              required
            >
              <option value="">Select a category</option>
              <optgroup label="Income">
                {incomeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </optgroup>
              <optgroup label="Expenses">
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Payment Method and Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.reference_number}
                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                placeholder="e.g., Check #, Transfer ID"
              />
            </div>
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Number
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.receipt_number}
              onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
              placeholder="Receipt or invoice number"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Attachment Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <PaperClipIcon className="h-4 w-4 inline mr-1" />
              Attachment (Receipt, Invoice, etc.)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={onAttachmentChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {transaction?.attachment_url && !attachmentFile && (
              <p className="mt-1 text-xs text-gray-500">Current attachment exists</p>
            )}
          </div>

          {/* Recurring Transaction */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="is_recurring"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
              />
              <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
                This is a recurring transaction
              </label>
            </div>

            {formData.is_recurring && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring Frequency
                    </label>
                    <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.recurring_frequency}
                    onChange={(e) => setFormData({...formData, recurring_frequency: e.target.value})}
                    required={formData.is_recurring}
                    >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    </select>
                </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (transaction ? 'Update Transaction' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FinancialsManager