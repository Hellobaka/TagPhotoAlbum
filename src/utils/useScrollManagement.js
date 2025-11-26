import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 滚动管理的组合函数
 */
export function useScrollManagement() {
  const isFilterHidden = ref(false)
  let lastScrollTop = 0
  let scrollAccumulator = 0
  let scrollDirection = null

  // 处理滚动事件，控制筛选条显示/隐藏
  const handleScroll = (event) => {
    const currentScrollTop = event.target.scrollTop
    const scrollDelta = currentScrollTop - lastScrollTop
    
    // 判断当前滚动方向
    const currentDirection = scrollDelta > 0 ? 'down' : 'up'
    
    // 如果方向改变，重置累计器
    if (scrollDirection !== currentDirection) {
      scrollDirection = currentDirection
      scrollAccumulator = 0
    }
    
    // 累计滚动距离
    scrollAccumulator += Math.abs(scrollDelta)
    
    // 向下滚动且总滚动距离大于50px，并且累计滚动超过200px时隐藏Header
    if (currentDirection === 'down' && currentScrollTop > 50 && scrollAccumulator > 200) {
      if (!isFilterHidden.value) {
        isFilterHidden.value = true
        scrollAccumulator = 0
      }
    } 
    // 向上滚动且累计滚动超过100px时显示Header
    else if (currentDirection === 'up' && scrollAccumulator > 100) {
      if (isFilterHidden.value) {
        isFilterHidden.value = false
        scrollAccumulator = 0
      }
    }
    
    lastScrollTop = currentScrollTop
  }

  return {
    isFilterHidden,
    handleScroll
  }
}

/**
 * 移动端检测的组合函数
 */
export function useMobileDetection() {
  const isMobile = ref(false)

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return {
    isMobile
  }
}
