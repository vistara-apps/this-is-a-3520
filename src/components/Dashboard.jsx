import React from 'react';
import { PenTool, Repeat, Crown, TrendingUp, Clock, Zap } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Content Generated', value: '24', icon: PenTool, color: 'from-blue-500 to-purple-600' },
    { label: 'Content Repurposed', value: '12', icon: Repeat, color: 'from-green-500 to-blue-600' },
    { label: 'Premium Plan', value: 'Active', icon: Crown, color: 'from-yellow-500 to-orange-600' },
    { label: 'Time Saved', value: '48h', icon: Clock, color: 'from-purple-500 to-pink-600' },
  ];

  const recentActivity = [
    { type: 'generate', title: 'Blog post about AI trends', time: '2 hours ago' },
    { type: 'repurpose', title: 'YouTube video to Instagram clips', time: '4 hours ago' },
    { type: 'generate', title: 'Social media campaign copy', time: '1 day ago' },
    { type: 'repurpose', title: 'Podcast to Twitter thread', time: '2 days ago' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-lg text-white/80">
              Ready to create amazing content with AI?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-primary flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Generate
            </button>
            <button className="btn-secondary">
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 hover:bg-white/15 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 p-6 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer group">
              <PenTool className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-semibold text-white mb-2">Generate Content</h3>
              <p className="text-sm text-white/70">Create AI-powered content from prompts</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-blue-600/20 p-6 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer group">
              <Repeat className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-semibold text-white mb-2">Repurpose Content</h3>
              <p className="text-sm text-white/70">Transform long-form into short clips</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'generate' ? 'bg-blue-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-white/60">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;