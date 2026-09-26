import { Component } from 'react';

/** Catches render errors from parallel-built modules and shows `fallback` instead. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.warn(`[trust-me] ${this.props.name ?? 'module'} crashed, using fallback`, error);
  }
  render() {
    if (this.state.error) return this.props.fallback ?? null;
    return this.props.children;
  }
}
