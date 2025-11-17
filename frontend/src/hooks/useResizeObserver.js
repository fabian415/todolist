import { useEffect } from 'react';

/**
 * 自定義 Hook：使用 ResizeObserver 監聽元素大小變化
 * 包含防抖機制以避免 ResizeObserver 錯誤
 * 
 * @param {React.RefObject} ref - 要監聽的元素 ref
 * @param {Function} callback - 當元素大小改變時調用的回調函數
 */
function useResizeObserver(ref, callback) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timeoutId = null;
    let rafId = null;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      
      // 清除之前的定時器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // 使用 requestAnimationFrame 確保在瀏覽器重繪時執行
      rafId = requestAnimationFrame(() => {
        // 添加短暫延遲以避免循環錯誤
        timeoutId = setTimeout(() => {
          const { width, height } = entries[0].contentRect;
          if (width > 0 && height > 0) {
            callback({ width, height });
          }
        }, 0);
      });
    });

    // 開始觀察
    try {
      resizeObserver.observe(element);
    } catch (error) {
      console.error('ResizeObserver error:', error);
    }

    // 初始調用
    const { clientWidth, clientHeight } = element;
    if (clientWidth > 0 && clientHeight > 0) {
      callback({ width: clientWidth, height: clientHeight });
    }

    // 清理函數
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (resizeObserver && element) {
        try {
          resizeObserver.unobserve(element);
          resizeObserver.disconnect();
        } catch (error) {
          // 忽略清理時的錯誤
        }
      }
    };
  }, [ref, callback]);
}

export default useResizeObserver;

