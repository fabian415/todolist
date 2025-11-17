import React, { useState } from 'react';
import { CloseIcon, TrashIcon } from './Icons';
import { taskAPI } from '../services/api';

function TaskModal({ task, onClose, onSave, onDelete }) {
  const [editedTask, setEditedTask] = useState(task);
  const [newSubtask, setNewSubtask] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [showAiInput, setShowAiInput] = useState(!task._id); // 新增任務時默認顯示 AI 輸入

  const handleSave = () => {
    onSave(editedTask);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e, name) => {
    const value = parseFloat(e.target.value);
    setEditedTask(prev => ({ ...prev, [name]: isNaN(value) ? null : value }));
  };

  const handleDateChange = (e) => {
    setEditedTask(prev => ({ ...prev, dueDate: e.target.value ? e.target.value : null }));
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setEditedTask(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleToggleSubtask = (subtaskId) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: Date.now().toString(),
      content: newSubtask.trim(),
      estimatedHours: 0,
      completed: false
    };
    setEditedTask(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), subtask]
    }));
    setNewSubtask("");
  };

  const handleDeleteSubtask = (subtaskId) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };

  const handleSubtaskContentChange = (subtaskId, newContent) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, content: newContent } : st
      )
    }));
  };

  const handleSubtaskHoursChange = (subtaskId, newHours) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, estimatedHours: newHours } : st
      )
    }));
  };

  const handleAiParse = async () => {
    if (!aiDescription.trim()) {
      alert('請輸入任務描述');
      return;
    }

    setIsAiParsing(true);
    try {
      const response = await taskAPI.parseWithAI(aiDescription);
      const parsedData = response.data.data;
      
      // 將 AI 解析的數據填充到任務表單
      setEditedTask(prev => ({
        ...prev,
        content: parsedData.content || prev.content,
        dueDate: parsedData.dueDate || prev.dueDate,
        priority: parsedData.priority || prev.priority,
        tags: parsedData.tags || prev.tags,
        estimatedEffortHours: parsedData.estimatedEffortHours || prev.estimatedEffortHours,
        subtasks: parsedData.subtasks.map(st => ({
          ...st,
          id: Date.now().toString() + Math.random() // 生成唯一 ID
        })) || prev.subtasks
      }));

      // 清空 AI 輸入框並隱藏
      setAiDescription("");
      setShowAiInput(false);
      
      // 顯示成功提示
      alert(`✅ AI 解析成功！\n\n📋 任務：${parsedData.content}\n📅 到期日：${parsedData.dueDate || '未設定'}\n⭐ 優先度：${parsedData.priority}\n🏷️ 標籤：${parsedData.tags.join(', ')}\n⏱️ 預估工時：${parsedData.estimatedEffortHours || 0}h\n📝 子任務：${parsedData.subtasks.length} 個`);
    } catch (error) {
      console.error('AI 解析錯誤:', error);
      alert('❌ AI 解析失敗：' + (error.message || '請檢查 Ollama 是否正常運行'));
    } finally {
      setIsAiParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* 彈窗標題 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {task._id ? '編輯任務' : '新增任務'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon />
          </button>
        </div>

        {/* 彈窗內容 */}
        <div className="p-6 overflow-y-auto">
          {/* AI 輔助輸入區域 */}
          {!task._id && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-bold text-blue-800 flex items-center">
                  <span className="mr-2">🤖</span> AI 智能助手
                </h3>
                <button
                  onClick={() => setShowAiInput(!showAiInput)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {showAiInput ? '隱藏' : '顯示'}
                </button>
              </div>
              
              {showAiInput && (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    輸入任務描述，AI 會自動拆解成任務、子任務、到期日、標籤和預估工時
                  </p>
                  <textarea
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="例如：下週三前把 Q4 報表整理好，包含數據匯入、視覺化圖表與審核，負責人小陳。"
                    className="w-full p-3 border border-blue-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows="3"
                    disabled={isAiParsing}
                  />
                  <button
                    onClick={handleAiParse}
                    disabled={isAiParsing || !aiDescription.trim()}
                    className={`mt-3 px-4 py-2 rounded-lg font-medium flex items-center justify-center w-full transition-all ${
                      isAiParsing || !aiDescription.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md'
                    }`}
                  >
                    {isAiParsing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI 解析中...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✨</span>
                        使用 AI 自動拆解任務
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 任務內容 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">任務標題</label>
          <input
            name="content"
            value={editedTask.content}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* 到期日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
              <input
                type="date"
                name="dueDate"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={handleDateChange}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              />
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select
                name="priority"
                value={editedTask.priority || '中'}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              >
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>

            {/* 預估工時 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">預估總工時 (h)</label>
              <input
                type="number"
                step="0.5"
                name="estimatedEffortHours"
                value={editedTask.estimatedEffortHours || ''}
                onChange={(e) => handleNumberChange(e, 'estimatedEffortHours')}
                placeholder="例如: 3.5"
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* 標籤 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">標籤 (Tags)</label>
            <input
              type="text"
              name="tags"
              value={(editedTask.tags || []).join(', ')}
              onChange={handleTagsChange}
              placeholder="以逗號分隔，例如: 報表, Q4"
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>

          {/* 子任務 */}
          <div className="mt-6">
            <h4 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">子任務清單</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {(editedTask.subtasks || []).map(subtask => (
                <div key={subtask.id} className="flex items-center group bg-gray-50 p-3 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
                  />
                  <input
                    type="text"
                    value={subtask.content}
                    onChange={(e) => handleSubtaskContentChange(subtask.id, e.target.value)}
                    className={`ml-3 flex-1 text-gray-800 p-1 border rounded ${subtask.completed ? 'line-through bg-gray-100' : 'bg-white'}`}
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={subtask.estimatedHours || 0}
                    onChange={(e) => handleSubtaskHoursChange(subtask.id, parseFloat(e.target.value) || 0)}
                    className="w-16 ml-2 p-1 border rounded text-center"
                    title="預估工時 (h)"
                  />
                  <span className="text-sm text-gray-500 ml-1 shrink-0">h</span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="ml-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            {/* 新增子任務 */}
            <div className="flex mt-4">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="新增子任務..."
                className="flex-1 p-2 border border-gray-300 rounded-l-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
              >
                新增
              </button>
            </div>
          </div>
        </div>

        {/* 彈窗底部 */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg">
          {task._id ? (
            <button
              onClick={() => onDelete(task._id)}
              className="text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              <TrashIcon /> 刪除任務
            </button>
          ) : (
            <div></div>
          )}
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;

