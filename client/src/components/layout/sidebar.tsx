import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { 
  Video, 
  BarChart3, 
  Briefcase, 
  Scissors, 
  Upload, 
  Settings,
  ChevronLeft,
  Moon,
  Sun,
  Home,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Segments", href: "/segments", icon: Scissors },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )} data-testid="sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="text-2xl text-sidebar-primary" data-testid="logo-icon" />
            {!collapsed && (
              <span className="text-xl font-semibold text-sidebar-foreground" data-testid="logo-text">
                Scene Detect
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-sidebar-accent"
            data-testid="sidebar-toggle"
          >
            <ChevronLeft className={cn(
              "h-4 w-4 text-sidebar-foreground transition-transform",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href === "/dashboard" && location === "/");
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-3 py-2 transition-colors",
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {!collapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 hover:bg-sidebar-accent"
            data-testid="theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-sidebar-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-sidebar-foreground" />
            )}
          </Button>
          
          {!collapsed && (
            <Link href="/settings">
              <Button
                variant="ghost"
                className="flex items-center px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                data-testid="nav-settings"
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
