import { Button } from '../components/ui/button';
import { useState } from 'react';

export default function ButtonDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-slate-800 dark:text-slate-200">
          按钮 Outline 效果展示
        </h1>
        
        {/* Primary Outline Buttons */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700 dark:text-slate-300">主要按钮 (Primary Outline)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="btn-outline-animated focus-ring-enhanced border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600"
            >
              <span className="mr-2">📧</span>
              发送邮件
            </Button>
            
            <Button 
              variant="outline" 
              className="btn-outline-animated focus-ring-enhanced border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
            >
              <span className="mr-2">✅</span>
              确认提交
            </Button>
            
            <Button 
              variant="outline" 
              className="btn-outline-animated focus-ring-enhanced border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600"
            >
              <span className="mr-2">🚀</span>
              立即开始
            </Button>
          </div>
        </div>

        {/* Gradient Outline Buttons */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700 dark:text-slate-300">渐变边框按钮</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="btn-outline btn-outline-animated focus-ring-enhanced h-12 text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
            >
              <span className="mr-2">🔑</span>
              登录系统
            </Button>
            
            <Button 
              variant="outline" 
              className="btn-outline btn-outline-animated focus-ring-enhanced h-12 text-white bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 border-0"
            >
              <span className="mr-2">👤</span>
              创建账户
            </Button>
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700 dark:text-slate-300">交互式按钮</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={handleClick}
              disabled={isLoading}
              className="btn-outline-animated focus-ring-enhanced border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                  加载中...
                </>
              ) : (
                <>
                  <span className="mr-2">⚡</span>
                  点击测试
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="btn-outline-animated focus-ring-enhanced border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 hover:scale-105"
            >
              <span className="mr-2">💾</span>
              保存文件
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="btn-outline-animated focus-ring-enhanced border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
            >
              <span className="mr-2">🗑️</span>
              删除
            </Button>
          </div>
        </div>

        {/* Icon Buttons */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700 dark:text-slate-300">图标按钮</h2>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              size="icon"
              className="btn-outline-animated focus-ring-enhanced border-2 border-slate-400 text-slate-600 hover:bg-slate-50 hover:border-slate-500"
            >
              ⚙️
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="btn-outline-animated focus-ring-enhanced border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500"
            >
              📊
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="btn-outline-animated focus-ring-enhanced border-2 border-green-400 text-green-600 hover:bg-green-50 hover:border-green-500"
            >
              ✨
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="btn-outline-animated focus-ring-enhanced border-2 border-purple-400 text-purple-600 hover:bg-purple-50 hover:border-purple-500"
            >
              🎨
            </Button>
          </div>
        </div>

        {/* Different Sizes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700 dark:text-slate-300">不同尺寸</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              className="btn-outline-animated focus-ring-enhanced border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:border-amber-600"
            >
              小按钮
            </Button>
            
            <Button 
              variant="outline" 
              size="md"
              className="btn-outline-animated focus-ring-enhanced border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-600"
            >
              中等按钮
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="btn-outline-animated focus-ring-enhanced border-2 border-rose-500 text-rose-600 hover:bg-rose-50 hover:border-rose-600"
            >
              大按钮
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}