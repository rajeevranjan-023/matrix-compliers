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
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-muted text-[13px]">This section couldn't load. The rest of the page is unaffected.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
