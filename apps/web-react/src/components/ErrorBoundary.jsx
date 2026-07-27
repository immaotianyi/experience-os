import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[EOS ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h2>页面渲染出错</h2>
            <p className="muted">{this.state.error?.message || "未知错误"}</p>
            <button className="primary-btn" onClick={this.handleReset}>
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
