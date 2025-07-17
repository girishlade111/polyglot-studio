import React, { useState } from 'react';
import { Plus, FolderOpen, Trash2, Edit3, Calendar, Globe, Lock } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { Project } from '../../lib/database.types';

interface ProjectManagerProps {
  onProjectSelect: (projectId: string) => void;
  selectedProjectId?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  onProjectSelect, 
  selectedProjectId 
}) => {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    const { error } = await createProject(newProjectTitle, newProjectDescription);
    if (!error) {
      setShowCreateModal(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !newProjectTitle.trim()) return;

    const { error } = await updateProject(editingProject.id, {
      title: newProjectTitle,
      description: newProjectDescription
    });

    if (!error) {
      setEditingProject(null);
      setNewProjectTitle('');
      setNewProjectDescription('');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId);
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setNewProjectTitle(project.title);
    setNewProjectDescription(project.description || '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedProjectId === project.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </h3>
                      {project.is_public ? (
                        <Globe className="w-4 h-4 text-green-500" title="Public project" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" title="Private project" />
                      )}
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(project.created_at)}
                      </span>
                      {project.updated_at !== project.created_at && (
                        <span>Updated {formatDate(project.updated_at)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(project);
                      }}
                      className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your project"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectTitle('');
                      setNewProjectDescription('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Project</h3>
              
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title
                  </label>
                  <input
                    id="editTitle"
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="editDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your project"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setNewProjectTitle('');
                      setNewProjectDescription('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;