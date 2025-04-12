import { useState, useEffect } from "react";
import { Project, ProjectChartData, DashboardStats } from "@/types";
import { storage, calculateProjectProgress, getProjectStatus } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardProps {
  onSelectProject: (projectId: number) => void;
}

export default function Dashboard({ onSelectProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  const [chartData, setChartData] = useState<ProjectChartData[]>([]);

  useEffect(() => {
    const fetchProjects = () => {
      const allProjects = storage.getProjects();
      setProjects(allProjects);
      
      // Calculate dashboard stats
      let totalTasks = 0;
      let completedTasks = 0;
      
      allProjects.forEach(project => {
        if (project.tasks) {
          totalTasks += project.tasks.length;
          completedTasks += project.tasks.filter(task => task.etat === 'réalisé').length;
        }
      });
      
      setStats({
        activeProjects: allProjects.length,
        totalTasks,
        completedTasks
      });
      
      // Prepare chart data
      const charData = allProjects.map(project => {
        const totalEstimated = project.estimation_jours * 8;
        const totalActual = project.tasks
          ? project.tasks.reduce((sum, task) => sum + (task.heures_realisees || 0), 0)
          : 0;
        
        return {
          name: project.nom,
          estimated: totalEstimated,
          actual: totalActual
        };
      });
      
      setChartData(charData);
    };
    
    fetchProjects();
    
    // Set up listener for localStorage changes
    const handleStorage = () => {
      fetchProjects();
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleDeleteProject = (projectId: number) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce projet ?`)) {
      storage.deleteProject(projectId);
      setProjects(projects.filter(project => project.id !== projectId));
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Projets actifs</h3>
              <span className="text-2xl font-bold text-primary">{stats.activeProjects}</span>
            </div>
            <p className="text-text-secondary text-sm">Projets en cours de réalisation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tâches totales</h3>
              <span className="text-2xl font-bold text-amber-500">{stats.totalTasks}</span>
            </div>
            <p className="text-text-secondary text-sm">Tâches planifiées dans tous les projets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tâches terminées</h3>
              <span className="text-2xl font-bold text-green-500">{stats.completedTasks}</span>
            </div>
            <p className="text-text-secondary text-sm">Tâches achevées sur l'ensemble des projets</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects Table */}
      <Card className="mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-300">
          <h3 className="text-lg font-semibold">Aperçu des projets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-200 text-text-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nom du projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estimation (jours)</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Heures réalisées</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Avancement</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tâches</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface-100 divide-y divide-surface-300">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun projet disponible. Créez votre premier projet !
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const progress = calculateProjectProgress(project);
                  const status = getProjectStatus(project);
                  const totalTasks = project.tasks ? project.tasks.length : 0;
                  const completedTasks = project.tasks ? project.tasks.filter(task => task.etat === 'réalisé').length : 0;
                  const totalHoursCompleted = project.tasks ? project.tasks.reduce((sum, task) => sum + (task.heures_realisees || 0), 0) : 0;
                  
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-text-primary">{project.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.estimation_jours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {totalHoursCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-surface-300 rounded-full h-2.5 mr-2">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span>{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {completedTasks} / {totalTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          className="text-primary hover:text-primary/80"
                          onClick={() => onSelectProject(project.id)}
                        >
                          <i className="fas fa-eye mr-1"></i> Voir
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-600 ml-3"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Progress Chart */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold mb-4">Progression des projets</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary">Aucune donnée disponible pour le graphique</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimated" name="Heures estimées" fill="#93C5FD" />
                  <Bar dataKey="actual" name="Heures réalisées" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
