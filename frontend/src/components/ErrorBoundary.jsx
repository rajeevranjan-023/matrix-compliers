import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-panel border border-line rounded-xl p-5 text-center">
            <p className="text-muted text-[13px] m-0">Something went wrong loading this part. The rest of the page still works.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
