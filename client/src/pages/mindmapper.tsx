import { Link } from 'wouter';

export default function MindMapper() {
  return (
    <div className="min-h-screen bg-slate-900 font-mono text-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-200 mb-4">Mind Mapper</h1>
            <p className="text-lg text-slate-400 font-mono">
              A visual thinking tool for organizing ideas and concepts
            </p>
          </header>

          {/* Project Iframe Container */}
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 mb-8">
            <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-slate-300 font-mono">Mind Mapper Project</p>
                <p className="text-sm text-slate-400 font-mono">
                  Replace this with your Replit project embed or iframe
                </p>
                <div className="space-y-2 text-xs text-slate-500 font-mono">
                  <p>Option 1: Embed your Replit project directly</p>
                  <p>Option 2: Host the project files in this same repository</p>
                  <p>Option 3: Link to the live Replit project</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-200 mb-4">About This Project</h3>
              <p className="text-slate-300 font-mono leading-relaxed mb-4">
                Describe your Mind Mapper project here. What does it do? What technologies did you use?
              </p>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Built with:</span>
                  <span className="text-cyan-400">Add your tech stack</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-200 mb-4">Features</h3>
              <ul className="space-y-2 text-slate-300 font-mono text-sm">
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">•</span>
                  Add your key features here
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">•</span>
                  Interactive mind mapping
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">•</span>
                  Visual organization tools
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">•</span>
                  Export capabilities
                </li>
              </ul>
            </div>
          </div>

          {/* Links */}
          <div className="text-center mt-12 space-x-6">
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                         hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                         focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                         active:scale-95 active:bg-slate-600/70 transform font-mono text-slate-300
                         hover:text-cyan-200"
            >
              View Live Project
            </a>
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                         hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                         focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                         active:scale-95 active:bg-slate-600/70 transform font-mono text-slate-300
                         hover:text-cyan-200"
            >
              Source Code
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}