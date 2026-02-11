import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { FilePickerDialog } from '@/components/FilePickerDialog';
import { JobDetailsHeader } from '@/components/job-tracker/details/JobDetailsHeader';
import { JobInfoSidebar } from '@/components/job-tracker/details/JobInfoSidebar';
import { JobContentArea } from '@/components/job-tracker/details/JobContentArea';
import { JobApplication } from '@/lib/plugins-api';

export function JobApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const {
    selectedApplication,
    fetchApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    addDocument,
    removeDocument,
    createTask,
    updateTask,
    deleteTask,
    createReferral,
    deleteReferral,
  } = useJobTrackerStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Minimal form state for "New Job" only layout (retained for creating new jobs)
  // For existing jobs, we use the dashboard layout
  const [newJobData, setNewJobData] = useState<Partial<JobApplication>>({
    company: '',
    jobTitle: '',
    status: 'wishlist'
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchApplication(id);
    }
  }, [id, isNew, fetchApplication]);

  const handleCreate = async () => {
    if (!newJobData.company || !newJobData.jobTitle) return;
    setIsLoading(true);
    try {
      const newApp = await createApplication(newJobData as any);
      navigate(`/plugins/job-tracker/applications/${newApp.id}`);
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<JobApplication>) => {
    if (!id || isNew) return;
    try {
      await updateApplication(id, data);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      await deleteApplication(id);
      navigate('/plugins/job-tracker/applications');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleAddDocument = async (file: { id: string; originalName: string }) => {
    if (!id) return;
    try {
      await addDocument(id, file.id, 'resume', file.originalName);
      setShowFilePicker(false);
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  };

  if (isNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Track New Job</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Senior Product Designer"
                value={newJobData.jobTitle}
                onChange={e => setNewJobData({ ...newJobData, jobTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Acme Corp"
                value={newJobData.company}
                onChange={e => setNewJobData({ ...newJobData, company: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => navigate('/plugins/job-tracker/applications')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newJobData.company || !newJobData.jobTitle || isLoading}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Start Tracking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedApplication) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ModernSidebar />

      <main className="ml-20 min-h-screen flex flex-col">
        <JobDetailsHeader
          application={selectedApplication}
          onStatusChange={(status) => handleUpdate({ status })}
          onDelete={handleDelete}
        />

        <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Notes, Tasks) */}
          <div className="lg:col-span-2 space-y-6">
            <JobContentArea
              application={selectedApplication}
              onUpdate={handleUpdate}
              onAddTask={(task) => createTask(selectedApplication.id, task)}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddDocument={() => setShowFilePicker(true)}
              onRemoveDocument={(docId) => removeDocument(selectedApplication.id, docId)}
            />
          </div>

          {/* Sidebar Area (Metadata) */}
          <div className="space-y-6">
            <JobInfoSidebar
              application={selectedApplication}
              onUpdate={handleUpdate}
              onAddReferral={async () => {
                const name = prompt('Contact Name:');
                if (name) {
                  await createReferral({ name, jobApplicationId: selectedApplication.id });
                  fetchApplication(selectedApplication.id);
                }
              }}
              onDeleteReferral={deleteReferral}
            />
          </div>
        </div>

        {/* File Picker */}
        <FilePickerDialog
          isOpen={showFilePicker}
          onClose={() => setShowFilePicker(false)}
          onSelect={handleAddDocument}
        />
      </main>
    </div>
  );
}
