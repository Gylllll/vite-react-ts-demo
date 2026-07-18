/**
 * 全局 Loading 状态管理器
 *
 * 基于请求计数（pending count）实现并发请求场景的正确状态计算：
 * - 首个请求发起时 loading 变为 true
 * - 最后一个请求完成时 loading 变为 false
 *
 * 使用方式：
 *   组件中订阅：
 *     useEffect(() => loadingManager.subscribe(setLoading), []);
 *   请求拦截器中自动调用（见 src/api/http.ts）
 */

type LoadingSubscriber = (loading: boolean) => void;

class LoadingManager {
  /** 当前进行中的请求数 */
  private count = 0;

  /** 订阅者集合 */
  private subscribers = new Set<LoadingSubscriber>();

  /** 当前是否为 loading 状态 */
  get isLoading(): boolean {
    return this.count > 0;
  }

  /** 发起请求时调用：计数 +1，首个请求触发 loading → true */
  show(): void {
    this.count++;
    if (this.count === 1) {
      this.notify(true);
    }
  }

  /** 请求完成时调用：计数 -1，无进行中请求时触发 loading → false */
  hide(): void {
    if (this.count > 0) {
      this.count--;
      if (this.count === 0) {
        this.notify(false);
      }
    }
  }

  /**
   * 订阅 loading 状态变化
   * @param fn 状态变化回调
   * @returns 取消订阅函数
   */
  subscribe(fn: LoadingSubscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  /** 通知所有订阅者 */
  private notify(loading: boolean): void {
    this.subscribers.forEach((fn) => fn(loading));
  }
}

/** 全局 loading 管理器单例 */
export const loadingManager = new LoadingManager();
