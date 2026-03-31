import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API, formatApiError } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  LogOut, Users, ChevronDown, ChevronUp, Plus, Trash2, 
  Calendar as CalendarIcon, MessageSquare, Edit2, Check, X, 
  Save, MoreVertical, Clock
} from "lucide-react";
import { format } from "date-fns";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [weeks, setWeeks] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [editingWeekTitle, setEditingWeekTitle] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addTaskDialog, setAddTaskDialog] = useState({ open: false, weekId: null });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [commentDialog, setCommentDialog] = useState({ open: false, weekId: null, taskId: null, task: null });
  const [newComment, setNewComment] = useState("");

  // Fetch weeks data
  const fetchWeeks = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/weeks`);
      setWeeks(response.data);
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    }
  }, []);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    weeks.forEach(week => {
      totalTasks += week.tasks?.length || 0;
      completedTasks += week.tasks?.filter(t => t.completed).length || 0;
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  // Calculate week progress
  const calculateWeekProgress = (week) => {
    const tasks = week.tasks || [];
    const completed = tasks.filter(t => t.completed).length;
    return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  };

  // Toggle week expansion
  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  // Update week title
  const updateWeekTitle = async (weekId, title) => {
    setSaving(true);
    try {
      await axios.put(`${API}/weeks/${weekId}`, { title });
      setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, title } : w));
      setEditingWeekTitle(null);
      toast.success("Week title updated");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (weekId, taskId, completed) => {
    setSaving(true);
    try {
      await axios.put(`${API}/weeks/${weekId}/tasks/${taskId}`, { completed: !completed });
      setWeeks(prev => prev.map(w => {
        if (w.id === weekId) {
          return {
            ...w,
            tasks: w.tasks.map(t => t.id === taskId ? { ...t, completed: !completed } : t)
          };
        }
        return w;
      }));
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Update task
  const updateTask = async (weekId, taskId, data) => {
    setSaving(true);
    try {
      await axios.put(`${API}/weeks/${weekId}/tasks/${taskId}`, data);
      setWeeks(prev => prev.map(w => {
        if (w.id === weekId) {
          return {
            ...w,
            tasks: w.tasks.map(t => t.id === taskId ? { ...t, ...data } : t)
          };
        }
        return w;
      }));
      setEditingTaskId(null);
      toast.success("Task updated");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Add task
  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setSaving(true);
    try {
      const response = await axios.post(`${API}/weeks/${addTaskDialog.weekId}/tasks`, {
        title: newTaskTitle,
        due_date: newTaskDueDate ? format(newTaskDueDate, "yyyy-MM-dd") : null
      });
      
      setWeeks(prev => prev.map(w => {
        if (w.id === addTaskDialog.weekId) {
          return { ...w, tasks: [...(w.tasks || []), response.data] };
        }
        return w;
      }));
      
      setAddTaskDialog({ open: false, weekId: null });
      setNewTaskTitle("");
      setNewTaskDueDate(null);
      toast.success("Task added");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Delete task
  const deleteTask = async (weekId, taskId) => {
    setSaving(true);
    try {
      await axios.delete(`${API}/weeks/${weekId}/tasks/${taskId}`);
      setWeeks(prev => prev.map(w => {
        if (w.id === weekId) {
          return { ...w, tasks: w.tasks.filter(t => t.id !== taskId) };
        }
        return w;
      }));
      toast.success("Task deleted");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Add comment
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    setSaving(true);
    try {
      const response = await axios.post(
        `${API}/weeks/${commentDialog.weekId}/tasks/${commentDialog.taskId}/comments`,
        { text: newComment }
      );
      
      setWeeks(prev => prev.map(w => {
        if (w.id === commentDialog.weekId) {
          return {
            ...w,
            tasks: w.tasks.map(t => {
              if (t.id === commentDialog.taskId) {
                return { ...t, comments: [...(t.comments || []), response.data] };
              }
              return t;
            })
          };
        }
        return w;
      }));
      
      // Update the task in the dialog
      const updatedTask = weeks.find(w => w.id === commentDialog.weekId)
        ?.tasks.find(t => t.id === commentDialog.taskId);
      if (updatedTask) {
        setCommentDialog(prev => ({
          ...prev,
          task: { ...updatedTask, comments: [...(updatedTask.comments || []), response.data] }
        }));
      }
      
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    setSaving(true);
    try {
      await axios.delete(
        `${API}/weeks/${commentDialog.weekId}/tasks/${commentDialog.taskId}/comments/${commentId}`
      );
      
      setWeeks(prev => prev.map(w => {
        if (w.id === commentDialog.weekId) {
          return {
            ...w,
            tasks: w.tasks.map(t => {
              if (t.id === commentDialog.taskId) {
                return { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) };
              }
              return t;
            })
          };
        }
        return w;
      }));
      
      // Update dialog
      setCommentDialog(prev => ({
        ...prev,
        task: { ...prev.task, comments: (prev.task?.comments || []).filter(c => c.id !== commentId) }
      }));
      
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const overallProgress = calculateOverallProgress();
  const totalTasks = weeks.reduce((sum, w) => sum + (w.tasks?.length || 0), 0);
  const completedTasks = weeks.reduce((sum, w) => sum + (w.tasks?.filter(t => t.completed).length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E40000] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-['Outfit']">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 font-['Outfit'] tracking-tight">
                  AIRTEL
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">SCM Digital Transformation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Save indicator */}
              {saving && (
                <div className="flex items-center gap-2 text-gray-500 text-sm" data-testid="save-indicator">
                  <div className="w-4 h-4 border-2 border-[#E40000] border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              )}
              
              {/* User info */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* Admin link */}
              {user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/users")}
                  className="border-gray-300 hover:bg-gray-50"
                  data-testid="user-management-link"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </Button>
              )}

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest mb-2">
            <CalendarIcon className="w-4 h-4" />
            8-Week PPO Execution Plan
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-['Outfit'] tracking-tight">
            Track Your Internship Progress
          </h2>
          <p className="text-gray-600 mt-2">
            Click any task or week title to edit · All changes auto-saved
          </p>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8" data-testid="overall-progress-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 font-['Outfit']">Overall Progress</h3>
            <span className="text-3xl font-bold text-[#E40000] font-['Outfit']" data-testid="overall-progress-percentage">
              {overallProgress}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-3 bg-gray-100" data-testid="overall-progress-bar" />
          <p className="text-sm text-gray-500 mt-3" data-testid="tasks-completed-count">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Week Cards */}
        <div className="space-y-4">
          {weeks.map((week) => {
            const weekProgress = calculateWeekProgress(week);
            const isExpanded = expandedWeeks[week.id];
            const completedCount = week.tasks?.filter(t => t.completed).length || 0;
            const totalCount = week.tasks?.length || 0;

            return (
              <div
                key={week.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden week-card"
                data-testid={`week-${week.week_number}-card`}
              >
                {/* Week Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleWeek(week.id)}
                  data-testid={`week-${week.week_number}-header`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#E40000] text-white font-bold rounded-lg font-['Outfit']">
                      W{week.week_number}
                    </div>
                    <div className="flex-1">
                      {editingWeekTitle === week.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Input
                            defaultValue={week.title}
                            className="h-8 font-semibold text-lg"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateWeekTitle(week.id, e.target.value);
                              } else if (e.key === "Escape") {
                                setEditingWeekTitle(null);
                              }
                            }}
                            onBlur={(e) => updateWeekTitle(week.id, e.target.value)}
                            data-testid={`week-${week.week_number}-title-input`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 font-['Outfit']">
                            {week.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWeekTitle(week.id);
                            }}
                            className="text-gray-400 hover:text-[#E40000] transition-colors"
                            data-testid={`week-${week.week_number}-edit-title`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <div className="w-32">
                          <Progress value={weekProgress} className="h-2 bg-gray-100" data-testid={`week-${week.week_number}-progress`} />
                        </div>
                        <span className="text-sm text-gray-500">
                          {completedCount}/{totalCount} tasks
                        </span>
                        <span className="text-sm font-medium text-[#E40000]">
                          {weekProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Tasks List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 animate-fade-in" data-testid={`week-${week.week_number}-tasks`}>
                    <div className="space-y-2">
                      {week.tasks?.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          weekId={week.id}
                          weekNumber={week.week_number}
                          editingTaskId={editingTaskId}
                          setEditingTaskId={setEditingTaskId}
                          toggleTaskCompletion={toggleTaskCompletion}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                          openCommentDialog={(task) => setCommentDialog({ open: true, weekId: week.id, taskId: task.id, task })}
                        />
                      ))}
                    </div>

                    {/* Add Task Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddTaskDialog({ open: true, weekId: week.id })}
                      className="mt-4 text-[#E40000] hover:text-[#B30000] hover:bg-red-50"
                      data-testid={`week-${week.week_number}-add-task`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          All changes saved automatically · Click any title or task to edit
        </div>
      </main>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialog.open} onOpenChange={(open) => setAddTaskDialog({ open, weekId: null })}>
        <DialogContent className="sm:max-w-md" data-testid="add-task-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Task Title</label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="mt-1"
                data-testid="new-task-title-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Due Date (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                    data-testid="new-task-due-date-trigger"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? format(newTaskDueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    initialFocus
                    data-testid="new-task-calendar"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddTaskDialog({ open: false, weekId: null });
                setNewTaskTitle("");
                setNewTaskDueDate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim() || saving}
              className="bg-[#E40000] hover:bg-[#B30000]"
              data-testid="add-task-submit"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentDialog.open} onOpenChange={(open) => !open && setCommentDialog({ open: false, weekId: null, taskId: null, task: null })}>
        <DialogContent className="sm:max-w-lg" data-testid="comments-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">Task Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{commentDialog.task?.title}</p>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {commentDialog.task?.comments?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
              )}
              {commentDialog.task?.comments?.map((comment) => (
                <div key={comment.id} className="comment-item bg-gray-50 p-3 rounded-r-lg" data-testid={`comment-${comment.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.created_by_name} · {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      data-testid={`delete-comment-${comment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 resize-none"
                rows={2}
                data-testid="new-comment-input"
              />
              <Button
                onClick={addComment}
                disabled={!newComment.trim() || saving}
                className="bg-[#E40000] hover:bg-[#B30000]"
                data-testid="add-comment-submit"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Task Item Component
const TaskItem = ({ task, weekId, weekNumber, editingTaskId, setEditingTaskId, toggleTaskCompletion, updateTask, deleteTask, openCommentDialog }) => {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDueDate, setEditDueDate] = useState(task.due_date ? new Date(task.due_date) : null);
  const isEditing = editingTaskId === task.id;

  return (
    <div
      className={`task-item flex items-start gap-3 p-3 rounded-lg border ${
        task.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
      }`}
      data-testid={`task-${task.id}`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTaskCompletion(weekId, task.id, task.completed)}
        className="mt-1 task-checkbox data-[state=checked]:bg-[#E40000] data-[state=checked]:border-[#E40000]"
        data-testid={`task-${task.id}-checkbox`}
      />
      
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2" onClick={e => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8"
              autoFocus
              data-testid={`task-${task.id}-title-input`}
            />
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs" data-testid={`task-${task.id}-due-date-trigger`}>
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {editDueDate ? format(editDueDate, "MMM d") : "Due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDueDate}
                    onSelect={setEditDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                onClick={() => {
                  updateTask(weekId, task.id, {
                    title: editTitle,
                    due_date: editDueDate ? format(editDueDate, "yyyy-MM-dd") : null
                  });
                }}
                className="bg-[#E40000] hover:bg-[#B30000] h-7 px-2"
                data-testid={`task-${task.id}-save`}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingTaskId(null);
                  setEditTitle(task.title);
                  setEditDueDate(task.due_date ? new Date(task.due_date) : null);
                }}
                className="h-7 px-2"
                data-testid={`task-${task.id}-cancel`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p
              className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-900"} cursor-pointer hover:text-[#E40000] transition-colors`}
              onClick={() => setEditingTaskId(task.id)}
              data-testid={`task-${task.id}-title`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {task.due_date && (
                <span className="flex items-center gap-1" data-testid={`task-${task.id}-due-date`}>
                  <Clock className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
              {task.comments?.length > 0 && (
                <span className="flex items-center gap-1" data-testid={`task-${task.id}-comments-count`}>
                  <MessageSquare className="w-3 h-3" />
                  {task.comments.length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`task-${task.id}-menu`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingTaskId(task.id)} data-testid={`task-${task.id}-edit`}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCommentDialog(task)} data-testid={`task-${task.id}-comments`}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteTask(weekId, task.id)}
              className="text-red-600 focus:text-red-600"
              data-testid={`task-${task.id}-delete`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default DashboardPage;
