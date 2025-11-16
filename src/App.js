import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Users, AlertCircle, Download, Search, X, AlertTriangle, Trash2, Edit2, CheckCircle } from 'lucide-react';

const TriageManagementSystem = () => {
  const [mode, setMode] = useState('area');
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedArea, setSelectedArea] = useState(null);
  const [formData, setFormData] = useState({
    triageNumber: '',
    name: '',
    patientId: '',
    gender: '',
    age: '',
    area: '赤',
    injury: '',
    treatment: ''
  });
  const [touched, setTouched] = useState({});
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    try {
      const result = await window.storage.get('patients', true);
      if (result && result.value) {
        setPatients(JSON.parse(result.value));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.log('データの読み込みに失敗しました:', error);
    }
  };

  const saveData = async (newPatients) => {
    try {
      await window.storage.set('patients', JSON.stringify(newPatients), true);
      setPatients(newPatients);
      setLastUpdate(new Date());
      showNotification('データを保存しました');
    } catch (error) {
      console.error('データの保存に失敗しました:', error);
      showNotification('データの保存に失敗しました', 'error');
    }
  };

  const normalizeTriageNumber = (num) => {
    const digits = num.replace(/\D/g, '');
    return digits.padStart(3, '0');
  };

  const formatTriageNumber = (num) => {
    const normalized = normalizeTriageNumber(num);
    return `TCH-${normalized}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const checkDuplicate = (patientId, triageNumber, excludeId = null) => {
    const normalizedTriage = normalizeTriageNumber(triageNumber);
    return patients.find(p => 
      p.id !== excludeId && (
        p.patientId === patientId || 
        normalizeTriageNumber(p.triageNumber) === normalizedTriage
      )
    );
  };

  const isFieldInvalid = (fieldName) => {
    return touched[fieldName] && !formData[fieldName];
  };

  const handleSubmit = () => {
    const requiredFields = ['triageNumber', 'patientId'];
    const allTouched = {};
    requiredFields.forEach(field => allTouched[field] = true);
    setTouched(allTouched);

    if (!formData.triageNumber || !formData.patientId) {
      showNotification('トリアージ番号と患者IDは必須項目です', 'error');
      return;
    }

    if (formData.patientId.length !== 8) {
      showNotification('患者IDは8桁で入力してください', 'error');
      return;
    }

    const duplicate = checkDuplicate(formData.patientId, formData.triageNumber, editingPatient?.id);
    if (duplicate) {
      setDuplicateInfo(duplicate);
      setShowDuplicateDialog(true);
      return;
    }

    savePatient();
  };

  const savePatient = (overwrite = false) => {
    const now = new Date().toISOString();
    const normalizedTriageNumber = normalizeTriageNumber(formData.triageNumber);
    
    let newPatients;
    if (editingPatient) {
      newPatients = patients.map(p => 
        p.id === editingPatient.id 
          ? { ...formData, triageNumber: normalizedTriageNumber, id: p.id, createdAt: p.createdAt, updatedAt: now }
          : p
      );
      showNotification('患者情報を更新しました');
    } else if (overwrite && duplicateInfo) {
      newPatients = patients.map(p => 
        p.id === duplicateInfo.id 
          ? { ...formData, triageNumber: normalizedTriageNumber, id: p.id, createdAt: p.createdAt, updatedAt: now }
          : p
      );
      showNotification('患者情報を上書きしました');
    } else {
      const newPatient = {
        ...formData,
        triageNumber: normalizedTriageNumber,
        id: Date.now(),
        createdAt: now,
        updatedAt: now
      };
      newPatients = [...patients, newPatient];
      showNotification('新しい患者を登録しました');
    }
    
    saveData(newPatients);
    resetForm();
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
    setEditingPatient(null);
  };

  const handleEdit = (patient) => {
    setFormData({
      triageNumber: patient.triageNumber,
      name: patient.name || '',
      patientId: patient.patientId,
      gender: patient.gender || '',
      age: patient.age || '',
      area: patient.area,
      injury: patient.injury || '',
      treatment: patient.treatment || ''
    });
    setEditingPatient(patient);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (patient) => {
    setShowDeleteConfirm(patient);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      const newPatients = patients.filter(p => p.id !== showDeleteConfirm.id);
      saveData(newPatients);
      showNotification('患者情報を削除しました');
      setShowDeleteConfirm(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      saveData([]);
      showNotification('すべてのデータを削除しました');
    }
  };

  const resetForm = () => {
    setFormData({
      triageNumber: '',
      name: '',
      patientId: '',
      gender: '',
      age: '',
      area: '赤',
      injury: '',
      treatment: ''
    });
    setTouched({});
    setShowForm(false);
    setEditingPatient(null);
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`;
    return `${Math.floor(diffMins / 1440)}日前`;
  };

  const exportToCSV = () => {
    const headers = ['エリア', 'トリアージ番号', '氏名', '患者ID', '性別', '年齢', '傷病名', '処置状況', '登録日時', '更新日時'];
    const rows = patients.map(p => [
      p.area,
      formatTriageNumber(p.triageNumber),
      p.name || '不明',
      p.patientId,
      p.gender || '不明',
      p.age || '不明',
      p.injury || '不明',
      p.treatment || '未記入',
      new Date(p.createdAt).toLocaleString('ja-JP'),
      new Date(p.updatedAt).toLocaleString('ja-JP')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `傷病者リスト_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showNotification('CSVファイルをダウンロードしました');
  };

  const getAreaColor = (area) => {
    switch (area) {
      case '赤': return 'bg-red-500';
      case '黄': return 'bg-yellow-500';
      case '緑': return 'bg-green-500';
      case '黒': return 'bg-gray-800';
      default: return 'bg-gray-500';
    }
  };

  const getAreaBorderColor = (area) => {
    switch (area) {
      case '赤': return 'border-red-500';
      case '黄': return 'border-yellow-500';
      case '緑': return 'border-green-500';
      case '黒': return 'border-gray-800';
      default: return 'border-gray-500';
    }
  };

  const getAreaStats = () => {
    const stats = { 赤: 0, 黄: 0, 緑: 0, 黒: 0 };
    patients.forEach(p => stats[p.area]++);
    return stats;
  };

  const filteredAndSortedPatients = () => {
    let filtered = patients;
    
    if (selectedArea) {
      filtered = filtered.filter(p => p.area === selectedArea);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        (p.name && p.name.includes(searchQuery)) || 
        (p.injury && p.injury.includes(searchQuery)) ||
        formatTriageNumber(p.triageNumber).includes(searchQuery) ||
        p.patientId.includes(searchQuery)
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      } else if (sortBy === 'name') {
        return (a.name || '不明').localeCompare(b.name || '不明', 'ja');
      } else if (sortBy === 'area') {
        const areaOrder = { '赤': 0, '黄': 1, '緑': 2, '黒': 3 };
        return areaOrder[a.area] - areaOrder[b.area];
      }
      return 0;
    });
  };

  const stats = getAreaStats();
  const displayPatients = filteredAndSortedPatients();
  const totalPatients = patients.length;

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <CheckCircle className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
              災害時トリアージ管理システム
            </h1>
            <div className="text-sm">
              <div>総患者数: <span className="text-xl font-bold">{totalPatients}</span>名</div>
              <div className="text-xs opacity-80">最終更新: {getRelativeTime(lastUpdate)}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setMode('area')}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                mode === 'area' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              傷病者入力
            </button>
            <button
              onClick={() => setMode('headquarters')}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                mode === 'headquarters' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              本部管理
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400 flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              更新
            </button>
            {mode === 'headquarters' && (
              <>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  CSV出力
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 flex items-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  全削除
                </button>
              </>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              自動更新(30秒)
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {['赤', '黄', '緑', '黒'].map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(selectedArea === area ? null : area)}
              className={`bg-white rounded-lg shadow p-4 text-left transition-all transform hover:scale-105 ${
                selectedArea === area ? `ring-4 ${getAreaBorderColor(area)}` : 'hover:shadow-xl'
              } ${stats[area] === 0 ? 'opacity-60' : ''}`}
            >
              <div className={`w-12 h-12 ${getAreaColor(area)} rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 shadow-md`}>
                {area}
              </div>
              <div className="text-3xl font-bold">{stats[area]}</div>
              <div className="text-gray-600 text-sm">患者数</div>
              {selectedArea === area && (
                <div className="mt-2 text-sm text-blue-600 font-semibold">✓ フィルタ中</div>
              )}
            </button>
          ))}
        </div>

        {mode === 'area' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  傷病者入力
                  {editingPatient && (
                    <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">編集モード</span>
                  )}
                </h2>
                <button
                  onClick={() => showForm ? resetForm() : setShowForm(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    showForm ? 'bg-gray-400 hover:bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showForm ? '閉じる' : '新規登録および更新'}
                </button>
              </div>

              {showForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg" onKeyPress={handleKeyPress}>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      トリアージ番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="triageNumber"
                      value={formData.triageNumber}
                      onChange={handleInputChange}
                      placeholder="例: TCH-○○○の数字だけ"
                      className={`w-full px-3 py-2 border rounded-lg transition-all ${
                        isFieldInvalid('triageNumber') ? 'border-red-500 border-2' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.triageNumber && `表示: ${formatTriageNumber(formData.triageNumber)}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      氏名
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="例: 分からなければ不明"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      患者ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      placeholder="例: 8桁の数字"
                      maxLength="8"
                      className={`w-full px-3 py-2 border rounded-lg transition-all ${
                        isFieldInvalid('patientId') ? 'border-red-500 border-2' : 
                        formData.patientId && formData.patientId.length !== 8 ? 'border-yellow-500 border-2' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {formData.patientId && formData.patientId.length !== 8 && (
                      <p className="text-xs text-yellow-600 mt-1 font-semibold">
                        ⚠ 8桁で入力してください（現在: {formData.patientId.length}桁）
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      性別
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    >
                      <option value="">選択してください</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                      <option value="その他">その他</option>
                      <option value="不明">不明</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      年齢
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="例: 不明な場合は空欄"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      エリア <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    >
                      <option value="赤">🔴 赤（緊急）</option>
                      <option value="黄">🟡 黄（準緊急）</option>
                      <option value="緑">🟢 緑（軽症）</option>
                      <option value="黒">⚫ 黒（不搬送）</option>
                    </select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-semibold mb-1">
                      傷病名
                    </label>
                    <input
                      type="text"
                      name="injury"
                      value={formData.injury}
                      onChange={handleInputChange}
                      placeholder="例: 不明な場合は空欄"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-semibold mb-1">
                      処置状況
                    </label>
                    <textarea
                      name="treatment"
                      value={formData.treatment}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="例: 未処置、応急処置済み など"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 flex gap-2">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition-all transform hover:scale-105"
                    >
                      {editingPatient ? '更新' : '登録'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-semibold transition-all"
                    >
                      {editingPatient ? 'キャンセル' : 'クリア'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'headquarters' && (
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="氏名、傷病名、トリアージ番号で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {selectedArea && (
                  <button
                    onClick={() => setSelectedArea(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 transition-all"
                  >
                    <X className="w-4 h-4" />
                    {selectedArea}エリア解除
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
                >
                  <option value="updated">更新順</option>
                  <option value="name">氏名順</option>
                  <option value="area">エリア順</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold">
              {mode === 'area' ? '登録済み傷病者' : '全傷病者リスト'}
              <span className="text-sm text-gray-500 ml-2 font-normal">
                ({displayPatients.length}件{selectedArea && ` / ${selectedArea}エリア`})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">エリア</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">トリアージ番号</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">氏名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">患者ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">性別</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">年齢</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">傷病名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">処置状況</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">更新</th>
                  {mode === 'headquarters' && (
                    <th className="px-4 py-3 text-left text-sm font-semibold">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayPatients.length === 0 ? (
                  <tr>
                    <td colSpan={mode === 'headquarters' ? '10' : '9'} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-16 h-16 text-gray-300" />
                        <div>
                          <p className="text-lg font-semibold">
                            {searchQuery ? '検索結果が見つかりません' : '登録されている傷病者はいません'}
                          </p>
                          <p className="text-sm mt-1">
                            {mode === 'area' && '「新規登録および更新」ボタンから患者情報を登録してください'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block w-10 h-10 ${getAreaColor(patient.area)} rounded-full text-white text-center leading-10 font-bold shadow-sm`}>
                          {patient.area}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{formatTriageNumber(patient.triageNumber)}</td>
                      <td className="px-4 py-3 font-medium">{patient.name || '不明'}</td>
                      <td className="px-4 py-3">{patient.patientId}</td>
                      <td className="px-4 py-3">{patient.gender || '不明'}</td>
                      <td className="px-4 py-3">{patient.age || '不明'}</td>
                      <td className="px-4 py-3">{patient.injury || '不明'}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={patient.treatment}>{patient.treatment || '未記入'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {getRelativeTime(patient.updatedAt)}
                      </td>
                      {mode === 'headquarters' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-all"
                              title="編集"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(patient)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded transition-all"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <h3 className="text-xl font-bold">重複データの警告</h3>
            </div>
            <p className="text-gray-700 mb-4">
              同じ患者IDまたはトリアージ番号の患者が既に登録されています。
            </p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-sm text-gray-600 mb-2">既存データ:</p>
              <p className="font-semibold">氏名: {duplicateInfo?.name || '不明'}</p>
              <p className="text-sm">トリアージ番号: {formatTriageNumber(duplicateInfo?.triageNumber || '')}</p>
              <p className="text-sm">患者ID: {duplicateInfo?.patientId}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              上書きしますか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => savePatient(true)}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 font-semibold transition-all"
              >
                上書きする
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicateInfo(null);
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-semibold transition-all"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-bold">削除の確認</h3>
            </div>
            <p className="text-gray-700 mb-4">
              この患者情報を削除してもよろしいですか？
            </p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold">氏名: {showDeleteConfirm?.name || '不明'}</p>
              <p className="text-sm">トリアージ番号: {formatTriageNumber(showDeleteConfirm?.triageNumber || '')}</p>
              <p className="text-sm">患者ID: {showDeleteConfirm?.patientId}</p>
            </div>
            <p className="text-sm text-red-600 mb-4 font-semibold">
              ※ この操作は取り消せません
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold transition-all"
              >
                削除する
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-semibold transition-all"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriageManagementSystem;