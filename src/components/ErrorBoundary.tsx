import React, { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" className="rounded-xl gap-2" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4" /> ลองใหม่
              </Button>
              <Button className="rounded-xl gap-2" onClick={() => window.location.reload()}>
                รีโหลดหน้า
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
