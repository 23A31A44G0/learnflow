import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './AlphaTestDashboard.css';

interface AlphaTester {
  _id: string;
  name: string;
  email: string;
  userType: 'power_user' | 'casual_user';
  joinedAt: string;
  lastActive: string;
  totalSessions: number;
  questionsGenerated: number;
  practiceSessionsCompleted: number;
  averageSessionDuration: number;
  retentionDay1: boolean;
  retentionDay3: boolean;
  retentionDay7: boolean;
  feedbackGiven: boolean;
  npsScore?: number;
  status: 'active' | 'churned' | 'completed';
}

interface AnalyticsData {
  date: string;
  activeUsers: number;
  newSignups: number;
  questionsGenerated: number;
  practiceSessionsCompleted: number;
  averageSessionDuration: number;
}

interface FeatureUsage {
  feature: string;
  usage: number;
  adoptionRate: number;
}

const AlphaTestDashboard: React.FC = () => {
  const [alphaTesters, setAlphaTesters] = useState<AlphaTester[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [selectedTester, setSelectedTester] = useState<AlphaTester | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [testersRes, analyticsRes, featuresRes] = await Promise.all([
        axios.get('/api/admin/alpha-testers'),
        axios.get('/api/admin/analytics/daily'),
        axios.get('/api/admin/analytics/features')
      ]);

      setAlphaTesters(testersRes.data);
      setAnalyticsData(analyticsRes.data);
      setFeatureUsage(featuresRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const totalTesters = alphaTesters.length;
    const activeTesters = alphaTesters.filter(t => t.status === 'active').length;
    const completedTesters = alphaTesters.filter(t => t.status === 'completed').length;
    const churnedTesters = alphaTesters.filter(t => t.status === 'churned').length;
    
    const retention1Day = (alphaTesters.filter(t => t.retentionDay1).length / totalTesters) * 100;
    const retention3Day = (alphaTesters.filter(t => t.retentionDay3).length / totalTesters) * 100;
    const retention7Day = (alphaTesters.filter(t => t.retentionDay7).length / totalTesters) * 100;
    
    const avgNPS = alphaTesters.reduce((sum, t) => sum + (t.npsScore || 0), 0) / 
                  alphaTesters.filter(t => t.npsScore).length;
    
    const totalSessions = alphaTesters.reduce((sum, t) => sum + t.totalSessions, 0);
    const totalQuestions = alphaTesters.reduce((sum, t) => sum + t.questionsGenerated, 0);
    const totalPracticeSessions = alphaTesters.reduce((sum, t) => sum + t.practiceSessionsCompleted, 0);
    const avgSessionDuration = alphaTesters.reduce((sum, t) => sum + t.averageSessionDuration, 0) / totalTesters;

    return {
      totalTesters,
      activeTesters,
      completedTesters, 
      churnedTesters,
      retention1Day,
      retention3Day,
      retention7Day,
      avgNPS,
      totalSessions,
      totalQuestions,
      totalPracticeSessions,
      avgSessionDuration
    };
  };

  const metrics = calculateMetrics();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const retentionData = [
    { name: 'Day 1', retention: metrics.retention1Day },
    { name: 'Day 3', retention: metrics.retention3Day },
    { name: 'Day 7', retention: metrics.retention7Day }
  ];

  const testerStatusData = [
    { name: 'Active', value: metrics.activeTesters },
    { name: 'Completed', value: metrics.completedTesters },
    { name: 'Churned', value: metrics.churnedTesters }
  ];

  const exportTesterData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Type,Joined,Last Active,Sessions,Questions,Practice Sessions,Avg Duration,Day1 Retention,Day3 Retention,Day7 Retention,NPS Score,Status\n" +
      alphaTesters.map(tester => 
        `${tester.name},${tester.email},${tester.userType},${tester.joinedAt},${tester.lastActive},${tester.totalSessions},${tester.questionsGenerated},${tester.practiceSessionsCompleted},${tester.averageSessionDuration},${tester.retentionDay1},${tester.retentionDay3},${tester.retentionDay7},${tester.npsScore || 'N/A'},${tester.status}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alpha_testers_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="dashboard-loading">Loading Alpha Test Dashboard...</div>;
  }

  return (
    <div className="alpha-dashboard">
      <div className="dashboard-header">
        <h1>🚀 LearnFlow Alpha Test Dashboard</h1>
        <div className="header-actions">
          <button onClick={exportTesterData} className="export-btn">
            📊 Export Data
          </button>
          <button onClick={fetchDashboardData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'testers' ? 'active' : ''}`}
          onClick={() => setActiveTab('testers')}
        >
          Alpha Testers
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Testers</h3>
              <div className="metric-value">{metrics.totalTesters}</div>
            </div>
            <div className="metric-card">
              <h3>Active Testers</h3>
              <div className="metric-value">{metrics.activeTesters}</div>
              <div className="metric-subtext">{((metrics.activeTesters / metrics.totalTesters) * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Day 1 Retention</h3>
              <div className="metric-value">{metrics.retention1Day.toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Day 7 Retention</h3>
              <div className="metric-value">{metrics.retention7Day.toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Avg NPS Score</h3>
              <div className="metric-value">{metrics.avgNPS.toFixed(1)}/10</div>
            </div>
            <div className="metric-card">
              <h3>Total Questions</h3>
              <div className="metric-value">{metrics.totalQuestions.toLocaleString()}</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Tester Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={testerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {testerStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Retention Funnel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                  <Bar dataKey="retention" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'testers' && (
        <div className="tab-content">
          <div className="testers-grid">
            {alphaTesters.map(tester => (
              <div key={tester._id} className={`tester-card ${tester.status}`}>
                <div className="tester-header">
                  <h4>{tester.name}</h4>
                  <span className={`status-badge ${tester.status}`}>
                    {tester.status}
                  </span>
                </div>
                
                <div className="tester-details">
                  <p><strong>Email:</strong> {tester.email}</p>
                  <p><strong>Type:</strong> {tester.userType.replace('_', ' ')}</p>
                  <p><strong>Joined:</strong> {new Date(tester.joinedAt).toLocaleDateString()}</p>
                  <p><strong>Last Active:</strong> {new Date(tester.lastActive).toLocaleDateString()}</p>
                </div>

                <div className="tester-metrics">
                  <div className="metric">
                    <span className="metric-label">Sessions</span>
                    <span className="metric-value">{tester.totalSessions}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Questions</span>
                    <span className="metric-value">{tester.questionsGenerated}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Practice</span>
                    <span className="metric-value">{tester.practiceSessionsCompleted}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">NPS</span>
                    <span className="metric-value">{tester.npsScore || 'N/A'}</span>
                  </div>
                </div>

                <div className="retention-indicators">
                  <span className={`retention-dot ${tester.retentionDay1 ? 'retained' : 'churned'}`} title="Day 1 Retention"></span>
                  <span className={`retention-dot ${tester.retentionDay3 ? 'retained' : 'churned'}`} title="Day 3 Retention"></span>
                  <span className={`retention-dot ${tester.retentionDay7 ? 'retained' : 'churned'}`} title="Day 7 Retention"></span>
                </div>

                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedTester(tester)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="tab-content">
          <div className="chart-container full-width">
            <h3>Daily Active Users</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Feature Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Questions Generated Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="questionsGenerated" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="tab-content">
          <div className="insights-grid">
            <div className="insight-card">
              <h3>🏆 Top Performers</h3>
              <div className="top-performers">
                {alphaTesters
                  .sort((a, b) => (b.questionsGenerated + b.practiceSessionsCompleted) - (a.questionsGenerated + a.practiceSessionsCompleted))
                  .slice(0, 5)
                  .map((tester, index) => (
                    <div key={tester._id} className="top-performer">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{tester.name}</span>
                      <span className="score">{tester.questionsGenerated + tester.practiceSessionsCompleted} actions</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="insight-card">
              <h3>⚠️ At-Risk Testers</h3>
              <div className="at-risk-testers">
                {alphaTesters
                  .filter(t => !t.retentionDay3 && t.status === 'active')
                  .map(tester => (
                    <div key={tester._id} className="at-risk-tester">
                      <span className="name">{tester.name}</span>
                      <span className="reason">Low engagement</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="insight-card">
              <h3>📊 Key Insights</h3>
              <div className="key-insights">
                <div className="insight">
                  <strong>Retention Drop:</strong> {(metrics.retention1Day - metrics.retention3Day).toFixed(1)}% between Day 1-3
                </div>
                <div className="insight">
                  <strong>Power User Ratio:</strong> {((alphaTesters.filter(t => t.userType === 'power_user').length / metrics.totalTesters) * 100).toFixed(1)}%
                </div>
                <div className="insight">
                  <strong>Avg Questions/User:</strong> {(metrics.totalQuestions / metrics.totalTesters).toFixed(1)}
                </div>
                <div className="insight">
                  <strong>Practice Completion Rate:</strong> {((metrics.totalPracticeSessions / metrics.totalQuestions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTester && (
        <div className="modal-overlay" onClick={() => setSelectedTester(null)}>
          <div className="tester-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTester.name} - Detailed View</h2>
              <button onClick={() => setSelectedTester(null)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="tester-detail-grid">
                <div className="detail-section">
                  <h4>Basic Info</h4>
                  <p><strong>Email:</strong> {selectedTester.email}</p>
                  <p><strong>Type:</strong> {selectedTester.userType.replace('_', ' ')}</p>
                  <p><strong>Status:</strong> {selectedTester.status}</p>
                  <p><strong>Joined:</strong> {new Date(selectedTester.joinedAt).toLocaleDateString()}</p>
                  <p><strong>Last Active:</strong> {new Date(selectedTester.lastActive).toLocaleDateString()}</p>
                </div>

                <div className="detail-section">
                  <h4>Usage Metrics</h4>
                  <p><strong>Total Sessions:</strong> {selectedTester.totalSessions}</p>
                  <p><strong>Questions Generated:</strong> {selectedTester.questionsGenerated}</p>
                  <p><strong>Practice Sessions:</strong> {selectedTester.practiceSessionsCompleted}</p>
                  <p><strong>Avg Session Duration:</strong> {selectedTester.averageSessionDuration.toFixed(1)} min</p>
                </div>

                <div className="detail-section">
                  <h4>Retention & Feedback</h4>
                  <p><strong>Day 1 Retention:</strong> {selectedTester.retentionDay1 ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Day 3 Retention:</strong> {selectedTester.retentionDay3 ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Day 7 Retention:</strong> {selectedTester.retentionDay7 ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>NPS Score:</strong> {selectedTester.npsScore || 'Not provided'}</p>
                  <p><strong>Feedback Given:</strong> {selectedTester.feedbackGiven ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphaTestDashboard;
