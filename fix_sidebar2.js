const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="p-4 border-t">
          <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>`;

const replace = `<div className="p-4 border-t">
          <div className="bg-secondary/50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Compute</span>
              {loadingCredits ? (
                <span className="text-xs text-muted-foreground">...</span>
              ) : (
                <span className={"text-xs font-bold " + (credits && credits <= 0 ? "text-red-500" : "text-primary")}>
                  {credits !== null ? credits.toLocaleString() : '?'}
                </span>
              )}
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
              <div 
                className={"h-1.5 rounded-full transition-all " + (credits && credits <= 0 ? "bg-red-500" : "bg-primary")} 
                style={{ width: Math.min(100, Math.max(0, ((credits || 0) / 150) * 100)) + '%' }}
              ></div>
            </div>
            {credits !== null && credits <= 0 && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('trigger_upgrade'))}
                className="w-full mt-3 text-xs bg-primary text-primary-foreground py-1.5 rounded-md font-bold hover:bg-primary/90 transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>
          <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
