
//emitter是封装好的事件通信函数，emitter可以跨级实现组件的事件通信，其中，broadcast是子组件向父组件发送事件，dispatch是父组件向各级子组件发送事件

/**
 * 外部函数：broadcast
 * 调用子组件数组的所有元素，得到组件名，使子组件发射事件，若没有查找查找内部是否用到broadcast的子组件
 * 
 */

function broadcast(componentName, eventName, params) {
  this.$children.forEach(child => {
    var name = child.$options.componentName;

    if (name === componentName) {
      child.$emit.apply(child, [eventName].concat(params));
    } else {
      broadcast.apply(child, [componentName, eventName].concat([params]));
    }
  });
}
/**
 * 对高阶组件和低阶组件的事件通讯做了封装
 * 一共两个方法： dispatch 发射事件 / broadcast 广播事件
 * dispatch 函数三个参数  componentName 组件名称  eventName 事件名称 params参数  将高阶组件视为当前的父组件 向其发送带参数的事件
 * broadcast 函数与dispatch相同的参数调用了外部的broadcast事件 
 */
export default {
  methods: {
    dispatch(componentName, eventName, params) {
      var parent = this.$parent || this.$root;
      var name = parent.$options.componentName;

      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent;

        if (parent) {
          name = parent.$options.componentName;
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    },
    broadcast(componentName, eventName, params) {
      broadcast.call(this, componentName, eventName, params);
    }
  }
};
