import { useState, useEffect } from 'react'
import { jobsService } from '../services/jobs'
import { adminService } from '../services/admin'
import { Plus, Users, Briefcase, Calendar, MapPin, CheckCircle, Loader2, X, Edit, Trash } from 'lucide-react'

export default function AdminJobManager() {
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
  
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', phone: '' })
  const [newJob, setNewJob] = useState({ title: '', customer_id: '', assigned_to: '', scheduled_date: '', description: '' })
  const [editingJob, setEditingJob] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [jobsData, customersData, employeesData] = await Promise.all([
        jobsService.getJobs(),
        jobsService.getCustomers(),
        adminService.getEmployees()
      ])
      setJobs(jobsData)
      setCustomers(customersData)
      setEmployees(employeesData)
    } catch (err) {
      console.error('Fetch job management error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCustomer(e) {
    e.preventDefault()
    try {
      await jobsService.createCustomer(newCustomer)
      setShowAddCustomer(false)
      setNewCustomer({ name: '', address: '', phone: '' })
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleEditCustomer(e) {
    e.preventDefault()
    try {
      await jobsService.updateCustomer(editingCustomer.id, editingCustomer)
      setEditingCustomer(null)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAddJob(e) {
    e.preventDefault()
    try {
      await jobsService.createJob(newJob)
      setShowAddJob(false)
      setNewJob({ title: '', customer_id: '', assigned_to: '', scheduled_date: '', description: '' })
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleEditJob(e) {
    e.preventDefault()
    try {
      await jobsService.updateJob(editingJob.id, editingJob, user.id)
      setEditingJob(null)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteJob(id) {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await jobsService.deleteJob(id)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their jobs!')) return
    try {
      await jobsService.deleteCustomer(id)
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-blue-400">Loading Job Manager...</div>

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <h3 className="card-title text-xl">
          <Briefcase className="text-accent-primary" /> 
          Job Management
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowAddCustomer(true)} className="btn btn-secondary btn-sm">
            <Users size={14} className="mr-1" /> Add Customer
          </button>
          <button onClick={() => setShowAddJob(true)} className="btn btn-primary btn-sm">
            <Plus size={14} className="mr-1" /> Create Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card">
            <h4 className="card-title mb-4">Active & Pending Jobs</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Customer</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="font-bold">{job.title}</td>
                      <td className="text-secondary">{job.customer?.name}</td>
                      <td>{job.employee?.name || <span className="text-accent-tertiary">Unassigned</span>}</td>
                      <td>
                        <span className={`badge ${job.status === 'completed' ? 'badge-success' : job.status === 'in-progress' ? 'badge-primary' : 'badge-warning'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingJob(job)} className="btn-secondary p-1 rounded hover:text-accent-primary transition-colors bg-transparent border-none cursor-pointer">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteJob(job.id)} className="btn-secondary p-1 rounded hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <h4 className="card-title mb-4">Customers</h4>
            <div className="flex flex-col gap-2">
              {customers.map(customer => (
                <div key={customer.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center hover:border-accent-primary/30 transition-all group">
                  <div>
                    <h5 className="font-bold text-sm">{customer.name}</h5>
                    <p className="text-xs text-muted">{customer.phone || 'No phone'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCustomer(customer)} className="p-1 hover:text-accent-primary bg-transparent border-none cursor-pointer"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteCustomer(customer.id)} className="p-1 hover:text-red-400 bg-transparent border-none cursor-pointer"><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals for Adding/Editing */}
      {(showAddCustomer || editingCustomer) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="card-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button 
                onClick={() => { setShowAddCustomer(false); setEditingCustomer(null); }}
                className="bg-transparent border-none text-muted hover:text-primary cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div className="modal-body">
              <form 
                onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer} 
                id="customer-form" 
                className="flex flex-col gap-4"
              >
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input 
                    className="form-control"
                    value={editingCustomer ? editingCustomer.name : newCustomer.name} 
                    onChange={e => editingCustomer ? setEditingCustomer({...editingCustomer, name: e.target.value}) : setNewCustomer({...newCustomer, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    value={editingCustomer ? editingCustomer.address : newCustomer.address} 
                    onChange={e => editingCustomer ? setEditingCustomer({...editingCustomer, address: e.target.value}) : setNewCustomer({...newCustomer, address: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    className="form-control"
                    value={editingCustomer ? editingCustomer.phone : newCustomer.phone} 
                    onChange={e => editingCustomer ? setEditingCustomer({...editingCustomer, phone: e.target.value}) : setNewCustomer({...newCustomer, phone: e.target.value})} 
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => { setShowAddCustomer(false); setEditingCustomer(null); }} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="customer-form" className="btn btn-primary">
                {editingCustomer ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(showAddJob || editingJob) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="card-title">{editingJob ? 'Edit Job' : 'Create New Job'}</h3>
              <button 
                onClick={() => { setShowAddJob(false); setEditingJob(null); }}
                className="bg-transparent border-none text-muted hover:text-primary cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div className="modal-body">
              <form 
                onSubmit={editingJob ? handleEditJob : handleAddJob} 
                id="job-form" 
                className="flex flex-col gap-4"
              >
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input 
                    className="form-control"
                    value={editingJob ? editingJob.title : newJob.title} 
                    onChange={e => editingJob ? setEditingJob({...editingJob, title: e.target.value}) : setNewJob({...newJob, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <select 
                    className="form-control"
                    value={editingJob ? editingJob.customer_id : newJob.customer_id} 
                    onChange={e => editingJob ? setEditingJob({...editingJob, customer_id: e.target.value}) : setNewJob({...newJob, customer_id: e.target.value})} 
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select 
                    className="form-control"
                    value={editingJob ? editingJob.assigned_to : newJob.assigned_to} 
                    onChange={e => editingJob ? setEditingJob({...editingJob, assigned_to: e.target.value}) : setNewJob({...newJob, assigned_to: e.target.value})} 
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                {editingJob && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-control"
                      value={editingJob.status} 
                      onChange={e => setEditingJob({...editingJob, status: e.target.value})} 
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={editingJob ? editingJob.scheduled_date : newJob.scheduled_date} 
                    onChange={e => editingJob ? setEditingJob({...editingJob, scheduled_date: e.target.value}) : setNewJob({...newJob, scheduled_date: e.target.value})} 
                    required 
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => { setShowAddJob(false); setEditingJob(null); }} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="job-form" className="btn btn-primary">
                {editingJob ? 'Save Changes' : 'Create & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
